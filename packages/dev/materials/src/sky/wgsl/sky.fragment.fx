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

	var sundisk: f32 = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
	L0 = L0 + (sunE * 19000.0 * Fex) * sundisk;

	var whiteScale: vec3f = 1.0 / Uncharted2Tonemap( vec3f(W));
	var texColor: vec3f = (Lin + L0);
	texColor = texColor * 0.04;
	texColor = texColor +  vec3f(0.0, 0.001, 0.0025) * 0.3;

	var g_fMaxLuminance: f32 = 1.0;
	var fLumScaled: f32 = 0.1 / uniforms.luminance;
	var fLumCompressed: f32 = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled);

	var ExposureBias: f32 = fLumCompressed;

	var curr: vec3f = Uncharted2Tonemap((log2(2.0 / pow(uniforms.luminance, 4.0))) * texColor);

	var retColor: vec3f = curr * whiteScale;

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
	var color: vec4f = clamp( vec4f(retColor.rgb, alpha),  vec4f(0.0),  vec4f(1.0));

#include<logDepthFragment>

    // Fog
#include<fogFragment>

	fragmentOutputs.color = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
