// Constants
uniform vEyePosition: vec4f;
uniform vDiffuseColor: vec4f;

#ifdef SPECULARTERM
uniform vSpecularColor: vec4f;
#endif

// Input
varying vPositionW: vec3f;

#ifdef NORMAL
varying vNormalW: vec3f;
#endif

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<lightUboDeclaration>[0..maxSimultaneousLights]

// Samplers
#ifdef DIFFUSE
varying vTextureUV: vec2f;
var mixMap1SamplerSampler: sampler;
var mixMap1Sampler: texture_2d<f32>;
uniform vTextureInfos: vec2f;

#ifdef MIXMAP2
var mixMap2SamplerSampler: sampler;
var mixMap2Sampler: texture_2d<f32>;
#endif

var diffuse1SamplerSampler: sampler;
var diffuse1Sampler: texture_2d<f32>;
var diffuse2SamplerSampler: sampler;
var diffuse2Sampler: texture_2d<f32>;
var diffuse3SamplerSampler: sampler;
var diffuse3Sampler: texture_2d<f32>;
var diffuse4SamplerSampler: sampler;
var diffuse4Sampler: texture_2d<f32>;

uniform diffuse1Infos: vec2f;
uniform diffuse2Infos: vec2f;
uniform diffuse3Infos: vec2f;
uniform diffuse4Infos: vec2f;

#ifdef MIXMAP2
var diffuse5SamplerSampler: sampler;
var diffuse5Sampler: texture_2d<f32>;
var diffuse6SamplerSampler: sampler;
var diffuse6Sampler: texture_2d<f32>;
var diffuse7SamplerSampler: sampler;
var diffuse7Sampler: texture_2d<f32>;
var diffuse8SamplerSampler: sampler;
var diffuse8Sampler: texture_2d<f32>;

uniform diffuse5Infos: vec2f;
uniform diffuse6Infos: vec2f;
uniform diffuse7Infos: vec2f;
uniform diffuse8Infos: vec2f;
#endif

#endif

// Shadows
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
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

	// Clip plane
	#include<clipPlaneFragment>

	var viewDirectionW: vec3f = normalize(uniforms.vEyePosition.xyz - fragmentInputs.vPositionW);

	// Base color
	var finalMixColor: vec4f =  vec4f(1., 1., 1., 1.);
	var diffuseColor: vec3f = uniforms.vDiffuseColor.rgb;

#ifdef MIXMAP2
	var mixColor2: vec4f =  vec4f(1., 1., 1., 1.);
#endif

#ifdef SPECULARTERM
	var glossiness: f32 = uniforms.vSpecularColor.a;
	var specularColor: vec3f = uniforms.vSpecularColor.rgb;
#else
	var glossiness: f32 = 0.;
#endif

	// Alpha
	var alpha: f32 = uniforms.vDiffuseColor.a;

	// Normal
#ifdef NORMAL
	var normalW: vec3f = normalize(fragmentInputs.vNormalW);
#else
	var normalW: vec3f =  vec3f(1.0, 1.0, 1.0);
#endif

#ifdef DIFFUSE
	var mixColor: vec4f = textureSample(mixMap1Sampler, mixMap1SamplerSampler, fragmentInputs.vTextureUV);

#include<depthPrePass>

	mixColor = vec4f(mixColor.rgb * uniforms.vTextureInfos.y, mixColor.a);

	var diffuse1Color: vec4f = textureSample(diffuse1Sampler, diffuse1SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse1Infos);
	var diffuse2Color: vec4f = textureSample(diffuse2Sampler, diffuse2SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse2Infos);
	var diffuse3Color: vec4f = textureSample(diffuse3Sampler, diffuse3SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse3Infos);
	var diffuse4Color: vec4f = textureSample(diffuse4Sampler, diffuse4SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse4Infos);

	diffuse1Color = vec4f(diffuse1Color.rgb * mixColor.r, diffuse1Color.a);
   	diffuse2Color = vec4f(mix(diffuse1Color.rgb, diffuse2Color.rgb, vec3f(mixColor.g)), diffuse2Color.a);
   	diffuse3Color = vec4f(mix(diffuse2Color.rgb, diffuse3Color.rgb, vec3f(mixColor.b)), diffuse3Color.a);
	finalMixColor = vec4f(mix(diffuse3Color.rgb, diffuse4Color.rgb, vec3f(1.0 - mixColor.a)), finalMixColor.a);

#ifdef MIXMAP2
	mixColor = textureSample(mixMap2Sampler, mixMap2SamplerSampler, fragmentInputs.vTextureUV);
	mixColor = vec4f(mixColor.rgb * uniforms.vTextureInfos.y, mixColor.a);

	var diffuse5Color: vec4f = textureSample(diffuse5Sampler, diffuse5SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse5Infos);
	var diffuse6Color: vec4f = textureSample(diffuse6Sampler, diffuse6SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse6Infos);
	var diffuse7Color: vec4f = textureSample(diffuse7Sampler, diffuse7SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse7Infos);
	var diffuse8Color: vec4f = textureSample(diffuse8Sampler, diffuse8SamplerSampler, fragmentInputs.vTextureUV * uniforms.diffuse8Infos);

	diffuse5Color = vec4f(mix(finalMixColor.rgb, diffuse5Color.rgb, vec3f(mixColor.r)), diffuse5Color.a);
   	diffuse6Color = vec4f(mix(diffuse5Color.rgb, diffuse6Color.rgb, vec3f(mixColor.g)), diffuse6Color.a);
   	diffuse7Color = vec4f(mix(diffuse6Color.rgb, diffuse7Color.rgb, vec3f(mixColor.b)), diffuse7Color.a);
	finalMixColor = vec4f(mix(diffuse7Color.rgb, diffuse8Color.rgb, vec3f(1.0 - mixColor.a)), finalMixColor.a);
#endif

#endif

#ifdef VERTEXCOLOR
	finalMixColor = vec4f(finalMixColor.rgb * fragmentInputs.vColor.rgb, finalMixColor.a);
#endif

	// Lighting
	var diffuseBase: vec3f =  vec3f(0., 0., 0.);
    var info: lightingInfo;
	var shadow: f32 = 1.;
	var aggShadow: f32 = 0.;
	var numLights: f32 = 0.;

#ifdef SPECULARTERM
	var specularBase: vec3f =  vec3f(0., 0., 0.);
#endif
	#include<lightFragment>[0..maxSimultaneousLights]

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= fragmentInputs.vColor.a;
#endif

#ifdef SPECULARTERM
	var finalSpecular: vec3f = specularBase * specularColor;
#else
	var finalSpecular: vec3f =  vec3f(0.0);
#endif

    var finalDiffuse: vec3f = clamp(diffuseBase * diffuseColor * finalMixColor.rgb, vec3f(0.0), vec3f(1.0));

	// Composition
	var color: vec4f =  vec4f(finalDiffuse + finalSpecular, alpha);

#include<logDepthFragment>
#include<fogFragment>

	fragmentOutputs.color = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
