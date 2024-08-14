// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

#include<helperFunctions>


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	fragmentOutputs.color = vec4f(fromRGBD(textureSample(textureSampler, textureSamplerSampler, input.vUV)), 1.0);
}