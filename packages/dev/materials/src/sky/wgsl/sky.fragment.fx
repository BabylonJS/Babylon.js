// Input
varying vPositionW: vec3f;

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif

#include<clipPlaneFragmentDeclaration>

// Sky
uniform cameraPosition: vec3f;
uniform cameraOffset: vec3f;
uniform up: vec3f;
uniform luminance: f32;
uniform turbidity: f32;
uniform rayleigh: f32;
uniform mieCoefficient: f32;
uniform mieDirectionalG: f32;
uniform sunPosition: vec3f;
uniform cloudiness: f32;
#ifdef SKY_RAW_HDR_OUTPUT
uniform maxColorValue: f32;
#endif

#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

// Constants
const ce: f32 = 2.71828182845904523536028747135266249775724709369995957;
const pi: f32 = 3.141592653589793238462643383279502884197169;
const cn: f32 = 1.0003;
const cN: f32 = 2.545E25;
const pn: f32 = 0.035;

const lambda: vec3f =  vec3f(680E-9, 550E-9, 450E-9);

const cK: vec3f =  vec3f(0.686, 0.678, 0.666);
const cv: f32 = 4.0;

const rayleighZenithLength: f32 = 8.4E3;
const mieZenithLength: f32 = 1.25E3;

const EE: f32 = 1000.0;
const sunAngularDiameterCos: f32 = 0.999956676946448443553574619906976478926848692873900859324;

const cutoffAngle: f32 = pi / 1.95;
const steepness: f32 = 1.5;

// Cloud model constants (used by cloudPhase and the cloudiness>0 branch in main). Values match
// the Frostbite-lineage reference (WickedEngine VolumetricCloudParameters defaults); full
// rationale + literature references are at the sun-disc branch below.
const CLOUD_TAU_MAX: f32 = 15.0;
const CLOUD_G: f32 = 0.5;
const CLOUD_G_BACK: f32 = -0.5;
const CLOUD_BACK_WEIGHT: f32 = 0.2;

fn totalRayleigh(lambdaIn: vec3f) -> vec3f
{
	return (8.0 * pow(pi, 3.0) * pow(pow(cn, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * cN * pow(lambdaIn,  vec3f(4.0)) * (6.0 - 7.0 * pn));
}

fn simplifiedRayleigh() -> vec3f
{
	return  vec3f(0.0005) /  vec3f(94, 40, 18);
}

fn rayleighPhase(cosTheta: f32) -> f32
{
	return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0));
}

fn totalMie(lambdaIn: vec3f, KIn: vec3f, T: f32) -> vec3f
{
	var c: f32 = (0.2 * T) * 10E-18;
	return 0.434 * c * pi * pow((2.0 * pi) / lambdaIn,  vec3f(cv - 2.0)) * KIn;
}

fn hgPhase(cosTheta: f32, g: f32) -> f32
{
	return (1.0 / (4.0 * pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0 * g * cosTheta + pow(g, 2.0), 1.5));
}

// Cloud scattering phase: a dual-lobe Henyey–Greenstein — a forward silver-lining lobe convex-
// blended with a weak backward glory lobe. Each hgPhase integrates to 1 over the sphere and the
// blend is convex, so cloudPhase integrates to 1 (energy-conserving) for any blend weight.
fn cloudPhase(cosTheta: f32, gForward: f32) -> f32
{
	return mix(hgPhase(cosTheta, gForward), hgPhase(cosTheta, CLOUD_G_BACK), CLOUD_BACK_WEIGHT);
}

fn sunIntensity(zenithAngleCos: f32) -> f32
{
	return EE * max(0.0, 1.0 - exp((-(cutoffAngle - acos(zenithAngleCos)) / steepness)));
}

const A: f32 = 0.15;
const B: f32 = 0.50;
const C: f32 = 0.10;
const D: f32 = 0.20;
const EEE: f32 = 0.02;
const F: f32 = 0.30;
const W: f32 = 1000.0;

fn Uncharted2Tonemap(x: vec3f) -> vec3f
{
	return ((x * (A * x + C * B) + D * EEE) / (x * (A * x + B) + D * F)) - EEE / F;
}

#if DITHER
#include<helperFunctions>
#endif


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	// Clip plane
#include<clipPlaneFragment>

	/**
	* Sky Color
	*/
	var sunfade: f32 = 1.0 - clamp(1.0 - exp((uniforms.sunPosition.y / 450000.0)), 0.0, 1.0);
	var rayleighCoefficient: f32 = uniforms.rayleigh - (1.0 * (1.0 - sunfade));
	var sunDirection: vec3f = normalize(uniforms.sunPosition);
	var sunE: f32 = sunIntensity(dot(sunDirection, uniforms.up));
	var betaR: vec3f = simplifiedRayleigh() * rayleighCoefficient;
	var betaM: vec3f = totalMie(lambda, cK, uniforms.turbidity) * uniforms.mieCoefficient;
	var zenithAngle: f32 = acos(max(0.0, dot(uniforms.up, normalize(fragmentInputs.vPositionW - uniforms.cameraPosition + uniforms.cameraOffset))));
	var sR: f32 = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	var sM: f32 = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	var Fex: vec3f = exp(-(betaR * sR + betaM * sM));
	var cosTheta: f32 = dot(normalize(fragmentInputs.vPositionW - uniforms.cameraPosition), sunDirection);
	var rPhase: f32 = rayleighPhase(cosTheta * 0.5 + 0.5);
	var betaRTheta: vec3f = betaR * rPhase;
	var mPhase: f32 = hgPhase(cosTheta, uniforms.mieDirectionalG);
	var betaMTheta: vec3f = betaM * mPhase;

	var Lin: vec3f = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),  vec3f(1.5));
	Lin = Lin * mix( vec3f(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex,  vec3f(1.0 / 2.0)),  vec3f(clamp(pow(1.0 - dot(uniforms.up, sunDirection), 5.0), 0.0, 1.0)));

	var direction: vec3f = normalize(fragmentInputs.vPositionW - uniforms.cameraPosition);
	var theta: f32 = acos(direction.y);
	var phi: f32 = atan2(direction.z, direction.x);
	var uv: vec2f =  vec2f(phi, theta) /  vec2f(2.0 * pi, pi) +  vec2f(0.5, 0.0);
	var L0: vec3f =  vec3f(0.1) * Fex;

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
	var sundiskTerm: f32 = 0.0;
	if (uniforms.cloudiness > 0.0) {
		var cloudTau: f32 = uniforms.cloudiness * CLOUD_TAU_MAX;
		var cloudT: f32 = exp(-cloudTau);
		var cloudG: f32 = CLOUD_G * cloudT;
		var omegaSun: f32 = 2.0 * pi * (1.0 - sunAngularDiameterCos);
		var sharpDisk: f32 = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
		sundiskTerm = cloudT * sharpDisk + (1.0 - cloudT) * omegaSun * cloudPhase(cosTheta, cloudG);
	} else {
		sundiskTerm = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
	}
	L0 = L0 + (sunE * 19000.0 * Fex) * sundiskTerm;

	var texColor: vec3f = (Lin + L0);
	texColor = texColor * 0.04;
	texColor = texColor +  vec3f(0.0, 0.001, 0.0025) * 0.3;

#ifdef SKY_RAW_HDR_OUTPUT
	// Scene-referred linear HDR: `luminance` is a plain linear gain and no filmic tonemap is applied,
	// so the sky and its bright sun disc keep their full dynamic range — required when this output is
	// baked into an HDR (float / half-float) IBL environment. The value is clamped to maxColorValue
	// (below) so a bright sun cannot overflow the target to +Inf, and the sRGB encode is left off.
	var retColor: vec3f = texColor * uniforms.luminance;
#else
	var whiteScale: vec3f = 1.0 / Uncharted2Tonemap( vec3f(W));

	var g_fMaxLuminance: f32 = 1.0;
	var fLumScaled: f32 = 0.1 / uniforms.luminance;
	var fLumCompressed: f32 = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled);

	var ExposureBias: f32 = fLumCompressed;

	var curr: vec3f = Uncharted2Tonemap((log2(2.0 / pow(uniforms.luminance, 4.0))) * texColor);

	var retColor: vec3f = curr * whiteScale;
#endif

	// Alpha
	var alpha: f32 = 1.0;

#ifdef VERTEXCOLOR
	retColor = retColor.rgb * fragmentInputs.vColor.rgb;
#endif

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= fragmentInputs.vColor.a;
#endif

#if DITHER
	retColor = retColor.rgb + dither(fragmentInputs.position.xy, 0.5);
#endif

	// Composition
#ifdef SKY_RAW_HDR_OUTPUT
	// Clamp to the render target's max representable value (maxColorValue: 65504 for half-float, a
	// huge finite for float, 1.0 for 8-bit LDR) so a bright HDR sun cannot store as +Inf and corrupt
	// anything reading the texture back (e.g. an IBL CDF).
	var color: vec4f =  vec4f(clamp(retColor.rgb,  vec3f(0.0),  vec3f(uniforms.maxColorValue)), alpha);
#else
	var color: vec4f = clamp( vec4f(retColor.rgb, alpha),  vec4f(0.0),  vec4f(1.0));
#endif

#include<logDepthFragment>

    // Fog
#include<fogFragment>

	fragmentOutputs.color = color;

#ifndef SKY_RAW_HDR_OUTPUT
#include<imageProcessingCompatibility>
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}
