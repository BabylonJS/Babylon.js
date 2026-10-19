precision highp float;

// Input
varying vec3 vPositionW;

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<clipPlaneFragmentDeclaration>

// Sky
uniform vec3 cameraPosition;
uniform vec3 cameraOffset;
uniform vec3 up;
uniform float luminance;
uniform float turbidity;
uniform float rayleigh;
uniform float mieCoefficient;
uniform float mieDirectionalG;
uniform vec3 sunPosition;
uniform float cloudiness;
#ifdef SKY_RAW_HDR_OUTPUT
uniform float maxColorValue;
#endif

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

// Constants
const float e = 2.71828182845904523536028747135266249775724709369995957;
const float pi = 3.141592653589793238462643383279502884197169;
const float n = 1.0003;
const float N = 2.545E25;
const float pn = 0.035;

const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);

const vec3 K = vec3(0.686, 0.678, 0.666);
const float v = 4.0;

const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;

const float EE = 1000.0;
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

const float cutoffAngle = pi/1.95;
const float steepness = 1.5;

// Cloud model constants (used by cloudPhase and the cloudiness>0 branch in main). Values match
// the Frostbite-lineage reference (WickedEngine VolumetricCloudParameters defaults); full
// rationale + literature references are at the sun-disc branch below.
const float CLOUD_TAU_MAX = 15.0;
const float CLOUD_G = 0.5;
const float CLOUD_G_BACK = -0.5;
const float CLOUD_BACK_WEIGHT = 0.2;

vec3 totalRayleigh(vec3 lambda)
{
	return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));
}

vec3 simplifiedRayleigh()
{
	return 0.0005 / vec3(94, 40, 18);
}

float rayleighPhase(float cosTheta)
{	 
	return (3.0 / (16.0*pi)) * (1.0 + pow(cosTheta, 2.0));
}

vec3 totalMie(vec3 lambda, vec3 K, float T)
{
	float c = (0.2 * T ) * 10E-18;
	return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;
}

float hgPhase(float cosTheta, float g)
{
	return (1.0 / (4.0*pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));
}

// Cloud scattering phase: a dual-lobe Henyey–Greenstein — a forward silver-lining lobe convex-
// blended with a weak backward glory lobe. Each hgPhase integrates to 1 over the sphere and the
// blend is convex, so cloudPhase integrates to 1 (energy-conserving) for any blend weight.
float cloudPhase(float cosTheta, float gForward)
{
	return mix(hgPhase(cosTheta, gForward), hgPhase(cosTheta, CLOUD_G_BACK), CLOUD_BACK_WEIGHT);
}

float sunIntensity(float zenithAngleCos)
{
	return EE * max(0.0, 1.0 - exp((-(cutoffAngle - acos(zenithAngleCos))/steepness)));
}

float A = 0.15;
float B = 0.50;
float C = 0.10;
float D = 0.20;
float EEE = 0.02;
float F = 0.30;
float W = 1000.0;

vec3 Uncharted2Tonemap(vec3 x)
{
	return ((x*(A*x+C*B)+D*EEE)/(x*(A*x+B)+D*F))-EEE/F;
}

#if DITHER
#include<helperFunctions>
#endif


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	// Clip plane
#include<clipPlaneFragment>

	/**
	*--------------------------------------------------------------------------------------------------
	* Sky Color
	*--------------------------------------------------------------------------------------------------
	*/
	float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
	float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
	vec3 sunDirection = normalize(sunPosition);
	float sunE = sunIntensity(dot(sunDirection, up));
	vec3 betaR = simplifiedRayleigh() * rayleighCoefficient;
	vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;
	float zenithAngle = acos(max(0.0, dot(up, normalize(vPositionW - cameraPosition + cameraOffset))));
	float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	vec3 Fex = exp(-(betaR * sR + betaM * sM));
	float cosTheta = dot(normalize(vPositionW - cameraPosition), sunDirection);
	float rPhase = rayleighPhase(cosTheta*0.5+0.5);
	vec3 betaRTheta = betaR * rPhase;
	float mPhase = hgPhase(cosTheta, mieDirectionalG);
	vec3 betaMTheta = betaM * mPhase;
	
	vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),vec3(1.5));
	Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(1.0 / 2.0)), clamp(pow(1.0-dot(up, sunDirection), 5.0), 0.0, 1.0));

	vec3 direction = normalize(vPositionW - cameraPosition);
	float theta = acos(direction.y);
	float phi = atan(direction.z, direction.x);
	vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);
	vec3 L0 = vec3(0.1) * Fex;
	
	// Sun disc. When cloudiness == 0 this is a sharp solar disc. When cloudiness > 0 a physically-
	// based cloud model takes over:
	// cloudiness in [0,1] maps to a cloud optical depth τ; the direct sun is attenuated by
	// Beer–Lambert transmittance (cloudT) and the removed energy (1 − cloudT) is redistributed
	// through cloudPhase() (a dual-lobe Henyey–Greenstein), with its forward asymmetry faded
	// toward isotropic with depth (cloudG = CLOUD_G·cloudT). Thin cloud → tight silver-lining
	// aureole; full overcast → a broad, directionless glow. Energy is conserved exactly: cloudPhase
	// integrates to 1 over the sphere and cloudT + (1 − cloudT) = 1, so total sun flux equals the
	// clear-sky disc flux (disc solid angle omegaSun) at any cloudiness.
	//
	// Chosen constants + references:
	//   CLOUD_TAU_MAX = 15 — cloud optical depth at full overcast; mid-range for overcast
	//     stratus/stratocumulus (τ ≈ 10–20), exp(−15) ≈ 3e-7 ⇒ the sun is fully hidden.
	//     Ref: Petty, "A First Course in Atmospheric Radiation" (2006).
	//   CLOUD_G = 0.5 / CLOUD_G_BACK = −0.5 / CLOUD_BACK_WEIGHT = 0.2 — dual-lobe HG forward / back /
	//     blend, matching the Frostbite-lineage reference (WickedEngine VolumetricCloudParameters
	//     phaseG / phaseG2 / phaseBlend). Artistic values, lower than the ~0.85 physical water-
	//     droplet g of Hansen & Travis, "Light scattering in planetary atmospheres", Space Sci.
	//     Rev. 16:527 (1974). A single scattering octave (Frostbite's games recommendation for
	//     performance; Hillaire, "Physically Based Sky, Atmosphere and Cloud Rendering in
	//     Frostbite", SIGGRAPH 2016) reduces the multiple-scattering sum to this dual-lobe HG.
	//   HG phase function form: Henyey & Greenstein, Astrophys. J. 93:70 (1941).
	//   Direct-beam attenuation: Beer–Lambert law.
	float sundiskTerm;
	if (cloudiness > 0.0) {
		float cloudTau = cloudiness * CLOUD_TAU_MAX;
		float cloudT = exp(-cloudTau);
		float cloudG = CLOUD_G * cloudT;
		float omegaSun = 2.0 * pi * (1.0 - sunAngularDiameterCos);
		float sharpDisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
		sundiskTerm = cloudT * sharpDisk + (1.0 - cloudT) * omegaSun * cloudPhase(cosTheta, cloudG);
	} else {
		sundiskTerm = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
	}
	L0 += (sunE * 19000.0 * Fex) * sundiskTerm;
	
	vec3 texColor = (Lin+L0);
	texColor *= 0.04 ;
	texColor += vec3(0.0,0.001,0.0025)*0.3;

#ifdef SKY_RAW_HDR_OUTPUT
	// Scene-referred linear HDR: `luminance` is a plain linear gain and no filmic tonemap is applied,
	// so the sky and its bright sun disc keep their full dynamic range — required when this output is
	// baked into an HDR (float / half-float) IBL environment. The value is clamped to maxColorValue
	// (below) so a bright sun cannot overflow the target to +Inf, and the sRGB encode is left off.
	vec3 retColor = texColor * luminance;
#else
	vec3 whiteScale = 1.0/Uncharted2Tonemap(vec3(W));

	float g_fMaxLuminance = 1.0;
	float fLumScaled = 0.1 / luminance;
	float fLumCompressed = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled);

	float ExposureBias = fLumCompressed;

	vec3 curr = Uncharted2Tonemap((log2(2.0/pow(luminance,4.0)))*texColor);

	// May generate a bug so just just keep retColor = skyColor;
	// vec3 skyColor = curr * whiteScale;
	//vec3 retColor = pow(skyColor,vec3(1.0/(1.2+(1.2*sunfade))));

	vec3 retColor = curr * whiteScale;
#endif

	/**
	*--------------------------------------------------------------------------------------------------
	* Sky Color
	*--------------------------------------------------------------------------------------------------
	*/
	
	// Alpha
	float alpha = 1.0;

#ifdef VERTEXCOLOR
	retColor.rgb *= vColor.rgb;
#endif

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= vColor.a;
#endif

#if DITHER
	retColor.rgb += dither(gl_FragCoord.xy, 0.5);
#endif

	// Composition
#ifdef SKY_RAW_HDR_OUTPUT
	// Clamp to the render target's max representable value (maxColorValue: 65504 for half-float, a
	// huge finite for float, 1.0 for 8-bit LDR) so a bright HDR sun cannot store as +Inf and corrupt
	// anything reading the texture back (e.g. an IBL CDF).
	vec4 color = vec4(clamp(retColor.rgb, 0.0, maxColorValue), alpha);
#else
	vec4 color = clamp(vec4(retColor.rgb, alpha), 0.0, 1.0);
#endif

#include<logDepthFragment>

    // Fog
#include<fogFragment>

	gl_FragColor = color;

#ifndef SKY_RAW_HDR_OUTPUT
#include<imageProcessingCompatibility>
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}
