// Samplers
varying vUV: vec2f;
varying vColor: vec4f;
uniform textureMask: vec4f;
var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;

#include<clipPlaneFragmentDeclaration>

#include<imageProcessingDeclaration>
#include<logDepthDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

#ifdef RAMPGRADIENT
varying remapRanges: vec4f;
var rampSamplerSampler: sampler;
var rampSampler: texture_2d<f32>;
#endif

#include<fogFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	#include<clipPlaneFragment>

	var textureColor: vec4f = textureSample(diffuseSampler, diffuseSamplerSampler, input.vUV);
	var baseColor: vec4f = (textureColor * uniforms.textureMask + ( vec4f(1., 1., 1., 1.) - uniforms.textureMask)) * input.vColor;

	#ifdef RAMPGRADIENT
		var alpha: f32 = baseColor.a;
		var remappedColorIndex: f32 = clamp((alpha - input.remapRanges.x) / input.remapRanges.y, 0.0, 1.0);

		var rampColor: vec4f = textureSample(rampSampler, rampSamplerSampler, vec2f(1.0 - remappedColorIndex, 0.));
		baseColor = vec4f(baseColor.rgb * rampColor.rgb, baseColor.a);

		// Remapped alpha
		var finalAlpha: f32 = baseColor.a;
		baseColor.a = clamp((alpha * rampColor.a - input.remapRanges.z) / input.remapRanges.w, 0.0, 1.0);
	#endif

	#ifdef BLENDMULTIPLYMODE
		var sourceAlpha: f32 = input.vColor.a * textureColor.a;
		baseColor = vec4f(baseColor.rgb * sourceAlpha +  vec3f(1.0) * (1.0 - sourceAlpha), baseColor.a);
	#endif

	#include<logDepthFragment>
	#include<fogFragment>(color,baseColor)

// Apply image processing if relevant. As this applies in linear space, 
// We first move from gamma to linear.
#ifdef IMAGEPROCESSINGPOSTPROCESS
	baseColor = vec4f(toLinearSpaceVec3(baseColor.rgb), baseColor.a);
#else
	#ifdef IMAGEPROCESSING
		baseColor = vec4f(toLinearSpaceVec3(baseColor.rgb), baseColor.a);
		baseColor = applyImageProcessing(baseColor);
	#endif
#endif

	fragmentOutputs.color = baseColor;

#define CUSTOM_FRAGMENT_MAIN_END

}