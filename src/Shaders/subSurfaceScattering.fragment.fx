// Samplers
#include<fibonacci>
#include<helperFunctions>
#include<subSurfaceScatteringFunctions>
#include<diffusionProfile>

varying vec2 vUV;
uniform vec2 texelSize;
uniform sampler2D textureSampler;
uniform sampler2D irradianceSampler;
uniform sampler2D depthSampler;
uniform sampler2D albedoSampler;

uniform vec2 viewportSize;
uniform float metersPerUnit;

const float LOG2_E = 1.4426950408889634;
const float SSS_PIXELS_PER_SAMPLE = 4.;
const int _SssSampleBudget = 40;

#define rcp(x) 1. / x
#define Sq(x) x * x
#define SSS_BILATERAL_FILTER true
// #define SSS_CLAMP_ARTIFACT true
// #define DEBUG_SSS_SAMPLES true

vec3 EvalBurleyDiffusionProfile(float r, vec3 S)
{
    vec3 exp_13 = exp2(((LOG2_E * (-1.0/3.0)) * r) * S); // Exp[-S * r / 3]
    vec3 expSum = exp_13 * (1. + exp_13 * exp_13);        // Exp[-S * r / 3] + Exp[-S * r]

    return (S * rcp(8. * PI)) * expSum; // S / (8 * Pi) * (Exp[-S * r / 3] + Exp[-S * r])
}

// https://zero-radiance.github.io/post/sampling-diffusion/
// Performs sampling of a Normalized Burley diffusion profile in polar coordinates.
// 'u' is the random number (the value of the CDF): [0, 1).
// rcp(s) = 1 / ShapeParam = ScatteringDistance.
// 'r' is the sampled radial distance, s.t. (u = 0 -> r = 0) and (u = 1 -> r = Inf).
// rcp(Pdf) is the reciprocal of the corresponding PDF value.
vec2 SampleBurleyDiffusionProfile(float u, float rcpS)
{
    u = 1. - u; // Convert CDF to CCDF

    float g = 1. + (4. * u) * (2. * u + sqrt(1. + (4. * u) * u));
    float n = exp2(log2(g) * (-1.0/3.0));                    // g^(-1/3)
    float p = (g * n) * n;                                   // g^(+1/3)
    float c = 1. + p + n;                                     // 1 + g^(+1/3) + g^(-1/3)
    float d = (3. / LOG2_E * 2.) + (3. / LOG2_E) * log2(u);     // 3 * Log[4 * u]
    float x = (3. / LOG2_E) * log2(c) - d;                    // 3 * Log[c / (4 * u)]

    // x      = s * r
    // exp_13 = Exp[-x/3] = Exp[-1/3 * 3 * Log[c / (4 * u)]]
    // exp_13 = Exp[-Log[c / (4 * u)]] = (4 * u) / c
    // exp_1  = Exp[-x] = exp_13 * exp_13 * exp_13
    // expSum = exp_1 + exp_13 = exp_13 * (1 + exp_13 * exp_13)
    // rcpExp = rcp(expSum) = c^3 / ((4 * u) * (c^2 + 16 * u^2))
    float rcpExp = ((c * c) * c) * rcp((4. * u) * ((c * c) + (4. * u) * (4. * u)));

    float r = x * rcpS;
    float rcpPdf = (8. * PI * rcpS) * rcpExp; // (8 * Pi) / s / (Exp[-s * r / 3] + Exp[-s * r])

    return vec2(r, rcpPdf);
}

// Computes f(r, s)/p(r, s), s.t. r = sqrt(xy^2 + z^2).
// Rescaling of the PDF is handled by 'totalWeight'.
vec3 ComputeBilateralWeight(float xy2, float z, float mmPerUnit, vec3 S, float rcpPdf)
{
    #ifndef SSS_BILATERAL_FILTER
        z = 0.;
    #endif

    // Note: we perform all computation in millimeters.
    // So we must convert from world units (using 'mmPerUnit') to millimeters.
    // Only 'z' requires conversion to millimeters.
    float r = sqrt(xy2 + (z * mmPerUnit) * (z * mmPerUnit));
    float area = rcpPdf;

    #if SSS_CLAMP_ARTIFACT
        return clamp(EvalBurleyDiffusionProfile(r, S) * area, 0.0, 1.0);
    #else
        return EvalBurleyDiffusionProfile(r, S) * area;
    #endif
}

void EvaluateSample(int i, int n, vec3 S, float d, vec3 centerPosVS, float mmPerUnit, float pixelsPerMm,
                    float phase, inout vec3 totalIrradiance, inout vec3 totalWeight)
{
    // The sample count is loop-invariant.
    float scale  = rcp(float(n));
    float offset = rcp(float(n)) * 0.5;

    // The phase angle is loop-invariant.
    float sinPhase, cosPhase;
    sinPhase = sin(phase);
    cosPhase = cos(phase);

    vec2 bdp = SampleBurleyDiffusionProfile(float(i) * scale + offset, d);
    float r = bdp.x;
    float rcpPdf = bdp.y;

    float phi = SampleDiskGolden(i, n).y;
    float sinPhi, cosPhi;
    sinPhi = sin(phi);
    cosPhi = cos(phi);

    float sinPsi = cosPhase * sinPhi + sinPhase * cosPhi; // sin(phase + phi)
    float cosPsi = cosPhase * cosPhi - sinPhase * sinPhi; // cos(phase + phi)

    vec2 vec = r * vec2(cosPsi, sinPsi);

    // Compute the screen-space position and the squared distance (in mm) in the image plane.
    vec2 position; 
    float xy2;

    position = vUV + round((pixelsPerMm * r) * vec2(cosPsi, sinPsi)) * texelSize;
    xy2      = r * r;

    vec4 textureSample = texture2D(irradianceSampler, position);
    float viewZ = texture2D(depthSampler, position).r;
    vec3 irradiance    = textureSample.rgb;

    if (testLightingForSSS(irradiance))
    {
        // Apply bilateral weighting.
        float relZ = viewZ - centerPosVS.z;
        vec3 weight = ComputeBilateralWeight(xy2, relZ, mmPerUnit, S, rcpPdf);

        totalIrradiance += weight * irradiance;
        totalWeight     += weight;
    }
    else
    {
        // The irradiance is 0. This could happen for 2 reasons.
        // Most likely, the surface fragment does not have an SSS material.
        // Alternatively, our sample comes from a region without any geometry.
        // Our blur is energy-preserving, so 'centerWeight' should be set to 0.
        // We do not terminate the loop since we want to gather the contribution
        // of the remaining samples (e.g. in case of hair covering skin).
    }
}

void main(void) 
{
	vec4 irradianceAndDiffusionProfile  = texture2D(irradianceSampler, vUV);
    vec3 centerIrradiance = irradianceAndDiffusionProfile.rgb;
    int diffusionProfileIndex = int(round(irradianceAndDiffusionProfile.a * 255.));

	float  centerDepth       = 0.;
    vec4 inputColor = texture2D(textureSampler, vUV);
	bool passedStencilTest = testLightingForSSS(centerIrradiance);

	if (passedStencilTest)
	{
	    centerDepth = texture2D(depthSampler, vUV).r;
	}

    if (!passedStencilTest) { 
        gl_FragColor = inputColor;
        return;
    }

	float  distScale   = 1.;
	vec3 S             = diffusionS[diffusionProfileIndex];
	float  d           = diffusionD[diffusionProfileIndex];
    float filterRadius = filterRadii[diffusionProfileIndex];

	// Reconstruct the view-space position corresponding to the central sample.
	vec2 centerPosNDC = vUV;
	vec2 cornerPosNDC = vUV + 0.5 * texelSize;
	vec3 centerPosVS  = vec3(centerPosNDC * viewportSize, 1.0) * centerDepth; // ComputeViewSpacePosition(centerPosNDC, centerDepth, UNITY_MATRIX_I_P);
	vec3 cornerPosVS  = vec3(cornerPosNDC * viewportSize, 1.0) * centerDepth; // ComputeViewSpacePosition(cornerPosNDC, centerDepth, UNITY_MATRIX_I_P);

	// Rescaling the filter is equivalent to inversely scaling the world.
	float mmPerUnit  = 1000. * (metersPerUnit * rcp(distScale));
	float unitsPerMm = rcp(mmPerUnit);

	// Compute the view-space dimensions of the pixel as a quad projected onto geometry.
	// Assuming square pixels, both X and Y are have the same dimensions.
	float unitsPerPixel = 2. * abs(cornerPosVS.x - centerPosVS.x);
	float pixelsPerMm   = rcp(unitsPerPixel) * unitsPerMm;

	// Area of a disk.
	float filterArea   = PI * Sq(filterRadius * pixelsPerMm);


	int  sampleCount  = int(filterArea * rcp(SSS_PIXELS_PER_SAMPLE));
	int  sampleBudget = _SssSampleBudget;

	int texturingMode = 0;
	vec3 albedo  = texture2D(albedoSampler, vUV).rgb;

	if (distScale == 0. || sampleCount < 1)
	{
        #ifdef DEBUG_SSS_SAMPLES
            vec3 green = vec3(0., 1., 0.);
            gl_FragColor = vec4(green, 1.0);
            return;
        #endif

	    gl_FragColor = vec4(inputColor.rgb + albedo * centerIrradiance, 1.0);
        return;
	}

    #ifdef DEBUG_SSS_SAMPLES
        vec3 red  = vec3(1., 0., 0.);
        vec3 blue = vec3(0., 0., 1.);
        gl_FragColor = vec4(mix(blue, red, clamp(float(sampleCount) / float(sampleBudget), 0.0, 1.0)), 1.0);
        return;
    #endif

    // we dont perform random rotation since we dont have temporal filter
    float phase = 0.;

    int n = min(sampleCount, sampleBudget);

    // Accumulate filtered irradiance and bilateral weights (for renormalization).
    vec3 centerWeight    = vec3(0.); // Defer (* albedo)
    vec3 totalIrradiance = vec3(0.);
    vec3 totalWeight     = vec3(0.);

    for (int i = 0; i < n; i++)
    {
        // Integrate over the image or tangent plane in the view space.
        EvaluateSample(i, n, S, d, centerPosVS, mmPerUnit, pixelsPerMm,
                       phase, totalIrradiance, totalWeight);
    }
    // Total weight is 0 for color channels without scattering.
    totalWeight = max(totalWeight, HALF_MIN);

    // gl_FragColor = vec4(totalIrradiance / totalWeight, 1.);
    gl_FragColor = vec4(inputColor.rgb + albedo * max(totalIrradiance / totalWeight, vec3(0.0)), 1.);
	// gl_FragColor = mix(texture2D(textureSampler, vUV), centerIrradiance, 0.5);
}