// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

#ifdef DUAL_SOURCE_BLENDING
	var textureSampler2Sampler: sampler;
	var textureSampler2: texture_2d<f32>;
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, input.vUV);
#ifdef DUAL_SOURCE_BLENDING
	fragmentOutputs.color2 = textureSample(textureSampler2, textureSampler2Sampler, input.vUV);
#endif
}
