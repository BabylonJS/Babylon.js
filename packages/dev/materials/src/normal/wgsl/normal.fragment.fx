uniform vEyePosition: vec4f;
uniform vDiffuseColor: vec4f;

// Input
varying vPositionW: vec3f;

#ifdef NORMAL
varying vNormalW: vec3f;
#endif

#ifdef LIGHTING
// Helper functions
#include<helperFunctions>

// Lights
#include<lightUboDeclaration>[0]
#include<lightUboDeclaration>[1]
#include<lightUboDeclaration>[2]
#include<lightUboDeclaration>[3]


#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#endif

// Samplers
#ifdef DIFFUSE
varying vDiffuseUV: vec2f;
var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;
uniform vDiffuseInfos: vec2f;
#endif

#include<clipPlaneFragmentDeclaration>

#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
varying vViewDepth: f32;
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

	var viewDirectionW: vec3f = normalize(uniforms.vEyePosition.xyz - fragmentInputs.vPositionW);

	// Base color
	var baseColor: vec4f =  vec4f(1., 1., 1., 1.);
	var diffuseColor: vec3f = uniforms.vDiffuseColor.rgb;

	// Alpha
	var alpha: f32 = uniforms.vDiffuseColor.a;

#ifdef DIFFUSE
	baseColor = textureSample(diffuseSampler, diffuseSamplerSampler, fragmentInputs.vDiffuseUV);

#ifdef ALPHATEST
	if (baseColor.a < 0.4) {
        discard;
    }
#endif

#include<depthPrePass>

	baseColor = vec4f(baseColor.rgb * uniforms.vDiffuseInfos.y, baseColor.a);
#endif

#ifdef NORMAL
    baseColor = mix(baseColor,  vec4f(fragmentInputs.vNormalW, 1.0), 0.5);
#endif

	// Normal
#ifdef NORMAL
	var normalW: vec3f = normalize(fragmentInputs.vNormalW);
#else
	var normalW: vec3f =  vec3f(1.0, 1.0, 1.0);
#endif

	// Lighting

#ifdef LIGHTING
	var diffuseBase: vec3f =  vec3f(0., 0., 0.);
    var info: lightingInfo;
	var shadow: f32 = 1.;
    var glossiness: f32 = 0.;
    var aggShadow: f32 = 0.;
	var numLights: f32 = 0.;

#include<lightFragment>[0]
#include<lightFragment>[1]
#include<lightFragment>[2]
#include<lightFragment>[3]
	var finalDiffuse: vec3f = clamp(diffuseBase * diffuseColor, vec3f(0.0), vec3f(1.0)) * baseColor.rgb;
#else
	var finalDiffuse: vec3f =  baseColor.rgb;
#endif

	// Composition
	var color: vec4f =  vec4f(finalDiffuse, alpha);

#include<logDepthFragment>
#include<fogFragment>

	fragmentOutputs.color = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
