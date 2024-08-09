// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var result: vec4f = textureSample(textureSampler, textureSamplerSampler, input.vUV);

#ifdef IMAGEPROCESSING
	#ifndef FROMLINEARSPACE
		// Need to move to linear space for subsequent operations.
		result = vec4f(toLinearSpaceVec3(result.rgb), result.a);
	#endif

	result = applyImageProcessing(result);
#else
	// In case where the input is in linear space we at least need to put it back in gamma.
	#ifdef FROMLINEARSPACE
		result = applyImageProcessing(result);
	#endif
#endif

	fragmentOutputs.color = result;
}