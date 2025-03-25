// Samplers
#include<helperFunctions>
#include<fibonacci>
#include<subSurfaceScatteringFunctions>
#include<diffusionProfile>

varying vUV: vec2f;
uniform texelSize: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var irradianceSamplerSampler: sampler;
var irradianceSampler: texture_2d<f32>;
var depthSamplerSampler: sampler;
var depthSampler: texture_2d<f32>;
var albedoSamplerSampler: sampler;
var albedoSampler: texture_2d<f32>;

uniform viewportSize: vec2f;
uniform metersPerUnit: f32;

const LOG2_E = 1.4426950408889634;
const SSS_PIXELS_PER_SAMPLE = 4.;
const _SssSampleBudget = 40u;

#define SSS_BILATERAL_FILTER true
// #define SSS_CLAMP_ARTIFACT true
// #define DEBUG_SSS_SAMPLES true

fn EvalBurleyDiffusionProfile(r: f32, S: vec3f) -> vec3f
{
    let exp_13 = exp2(((LOG2_E * (-1.0/3.0)) * r) * S); // Exp[-S * r / 3]
    let expSum = exp_13 * (1. + exp_13 * exp_13);        // Exp[-S * r / 3] + Exp[-S * r]

    return (S * rcp(8. * PI)) * expSum; // S / (8 * Pi) * (Exp[-S * r / 3] + Exp[-S * r])
}

// https://zero-radiance.github.io/post/sampling-diffusion/
// Performs sampling of a Normalized Burley diffusion profile in polar coordinates.
// 'u' is the random number (the value of the CDF): [0, 1).
// rcp(s) = 1 / ShapeParam = ScatteringDistance.
// 'r' is the sampled radial distance, s.t. (u = 0 -> r = 0) and (u = 1 -> r = Inf).
// rcp(Pdf) is the reciprocal of the corresponding PDF value.
fn SampleBurleyDiffusionProfile(u_: f32, rcpS: f32) -> vec2f
{
    let u = 1. - u_; // Convert CDF to CCDF

    let g = 1. + (4. * u) * (2. * u + sqrt(1. + (4. * u) * u));
    let n = exp2(log2(g) * (-1.0/3.0));                    // g^(-1/3)
    let p = (g * n) * n;                                   // g^(+1/3)
    let c = 1. + p + n;                                     // 1 + g^(+1/3) + g^(-1/3)
    let d = (3. / LOG2_E * 2.) + (3. / LOG2_E) * log2(u);     // 3 * Log[4 * u]
    let x = (3. / LOG2_E) * log2(c) - d;                    // 3 * Log[c / (4 * u)]

    // x      = s * r
    // exp_13 = Exp[-x/3] = Exp[-1/3 * 3 * Log[c / (4 * u)]]
    // exp_13 = Exp[-Log[c / (4 * u)]] = (4 * u) / c
    // exp_1  = Exp[-x] = exp_13 * exp_13 * exp_13
    // expSum = exp_1 + exp_13 = exp_13 * (1 + exp_13 * exp_13)
    // rcpExp = rcp(expSum) = c^3 / ((4 * u) * (c^2 + 16 * u^2))
    let rcpExp = ((c * c) * c) * rcp((4. * u) * ((c * c) + (4. * u) * (4. * u)));

    let r = x * rcpS;
    let rcpPdf = (8. * PI * rcpS) * rcpExp; // (8 * Pi) / s / (Exp[-s * r / 3] + Exp[-s * r])

    return vec2f(r, rcpPdf);
}

// Computes f(r, s)/p(r, s), s.t. r = sqrt(xy^2 + z^2).
// Rescaling of the PDF is handled by 'totalWeight'.
fn ComputeBilateralWeight(xy2: f32, z_: f32, mmPerUnit: f32, S: vec3f, rcpPdf: f32) -> vec3f
{
    #ifndef SSS_BILATERAL_FILTER
        let z = 0.;
    #else
        let z = z_;
    #endif

    // Note: we perform all computation in millimeters.
    // So we must convert from world units (using 'mmPerUnit') to millimeters.
    // Only 'z' requires conversion to millimeters.
    let r = sqrt(xy2 + (z * mmPerUnit) * (z * mmPerUnit));
    let area = rcpPdf;

    #ifdef SSS_CLAMP_ARTIFACT
        return clamp(EvalBurleyDiffusionProfile(r, S) * area, vec3f(0.0), vec3f(1.0));
    #else
        return EvalBurleyDiffusionProfile(r, S) * area;
    #endif
}

fn EvaluateSample(i: u32, n: u32, S: vec3f, d: f32, centerPosVS: vec3f, mmPerUnit: f32, pixelsPerMm: f32,
                    phase: f32, totalIrradiance: ptr<function, vec3f>, totalWeight: ptr<function, vec3f>)
{
    // The sample count is loop-invariant.
    let scale  = rcp(f32(n));
    let offset = rcp(f32(n)) * 0.5;

    // The phase angle is loop-invariant.
    let sinPhase = sin(phase);
    let cosPhase = cos(phase);

    let bdp = SampleBurleyDiffusionProfile(f32(i) * scale + offset, d);
    let r = bdp.x;
    let rcpPdf = bdp.y;

    let phi = SampleDiskGolden(i, n).y;
    let sinPhi = sin(phi);
    let cosPhi = cos(phi);

    let sinPsi = cosPhase * sinPhi + sinPhase * cosPhi; // sin(phase + phi)
    let cosPsi = cosPhase * cosPhi - sinPhase * sinPhi; // cos(phase + phi)

    let vec = r * vec2f(cosPsi, sinPsi);

    // Compute the screen-space position and the squared distance (in mm) in the image plane.

    let position = fragmentInputs.vUV + round((pixelsPerMm * r) * vec2(cosPsi, sinPsi)) * uniforms.texelSize;
    let xy2      = r * r;

    let textureRead = textureSampleLevel(irradianceSampler, irradianceSamplerSampler, position, 0.);
    let viewZ = textureSampleLevel(depthSampler, depthSamplerSampler, position, 0.).r;
    let irradiance    = textureRead.rgb;

    if (testLightingForSSS(textureRead.a))
    {
        // Apply bilateral weighting.
        let relZ = viewZ - centerPosVS.z;
        let weight = ComputeBilateralWeight(xy2, relZ, mmPerUnit, S, rcpPdf);

        *totalIrradiance += weight * irradiance;
        *totalWeight     += weight;
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


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	let irradianceAndDiffusionProfile  = textureSampleLevel(irradianceSampler, irradianceSamplerSampler, fragmentInputs.vUV, 0.);
    let centerIrradiance = irradianceAndDiffusionProfile.rgb;
    let diffusionProfileIndex = u32(round(irradianceAndDiffusionProfile.a * 255.));

	var  centerDepth       = 0.;
    let inputColor = textureSampleLevel(textureSampler, textureSamplerSampler, fragmentInputs.vUV, 0.);
	let passedStencilTest = testLightingForSSS(irradianceAndDiffusionProfile.a);

	if (passedStencilTest)
	{
	    centerDepth = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV, 0.).r;
	}

    if (!passedStencilTest) { 
        fragmentOutputs.color = inputColor;
        return fragmentOutputs;
    }

	let distScale    = 1.;
	let S            = uniforms.diffusionS[diffusionProfileIndex];
	let d            = uniforms.diffusionD[diffusionProfileIndex];
    let filterRadius = uniforms.filterRadii[diffusionProfileIndex];

	// Reconstruct the view-space position corresponding to the central sample.
	let centerPosNDC = fragmentInputs.vUV;
	let cornerPosNDC = fragmentInputs.vUV + 0.5 * uniforms.texelSize;
	let centerPosVS  = vec3f(centerPosNDC * uniforms.viewportSize, 1.0) * centerDepth; // ComputeViewSpacePosition(centerPosNDC, centerDepth, UNITY_MATRIX_I_P);
	let cornerPosVS  = vec3f(cornerPosNDC * uniforms.viewportSize, 1.0) * centerDepth; // ComputeViewSpacePosition(cornerPosNDC, centerDepth, UNITY_MATRIX_I_P);

	// Rescaling the filter is equivalent to inversely scaling the world.
	let mmPerUnit  = 1000. * (uniforms.metersPerUnit * rcp(distScale));
	let unitsPerMm = rcp(mmPerUnit);

	// Compute the view-space dimensions of the pixel as a quad projected onto geometry.
	// Assuming square pixels, both X and Y are have the same dimensions.
	let unitsPerPixel = 2. * abs(cornerPosVS.x - centerPosVS.x);
	let pixelsPerMm   = rcp(unitsPerPixel) * unitsPerMm;

	// Area of a disk.
	let filterArea   = PI * square(filterRadius * pixelsPerMm);


	let  sampleCount  = u32(filterArea * rcp(SSS_PIXELS_PER_SAMPLE));
	let  sampleBudget = _SssSampleBudget;

	let albedo  = textureSampleLevel(albedoSampler, albedoSamplerSampler, fragmentInputs.vUV, 0.).rgb;

	if (distScale == 0. || sampleCount < 1)
	{
        #ifdef DEBUG_SSS_SAMPLES
            let green = vec3f(0., 1., 0.);
            fragmentOutputs.color = vec4f(green, 1.0);
            return fragmentOutputs;
        #endif

	    fragmentOutputs.color = vec4f(inputColor.rgb + albedo * centerIrradiance, 1.0);
        return fragmentOutputs;
	}

    #ifdef DEBUG_SSS_SAMPLES
        let red  = vec3f(1., 0., 0.);
        let blue = vec3f(0., 0., 1.);
        fragmentOutputs.color = vec4f(mix(blue, red, clamp(f32(sampleCount) / f32(sampleBudget), 0.0, 1.0)), 1.0);
        return fragmentOutputs;
    #endif

    // we dont perform random rotation since we dont have temporal filter
    let phase = 0.;

    let n = min(sampleCount, sampleBudget);

    // Accumulate filtered irradiance and bilateral weights (for renormalization).
    var totalIrradiance = vec3f(0.);
    var totalWeight     = vec3f(0.);

    for (var i = 0u; i < n; i++)
    {
        // Integrate over the image or tangent plane in the view space.
        EvaluateSample(i, n, S, d, centerPosVS, mmPerUnit, pixelsPerMm,
                       phase, &totalIrradiance, &totalWeight);
    }
    // Total weight is 0 for color channels without scattering.
    totalWeight = max(totalWeight, vec3f(HALF_MIN));

    fragmentOutputs.color = vec4f(inputColor.rgb + albedo * max(totalIrradiance / totalWeight, vec3f(0.0)), 1.);
}
