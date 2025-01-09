// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_cube<f32>;


#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var uv: vec2f = input.vUV * 2.0 - 1.0;

#ifdef POSITIVEX
	fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, vec3f(1.001, uv.y, uv.x));
#endif
#ifdef NEGATIVEX
	fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, vec3f(-1.001, uv.y, uv.x));
#endif
#ifdef POSITIVEY
	fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, vec3f(uv.y, 1.001, uv.x));
#endif
#ifdef NEGATIVEY
	fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, vec3f(uv.y, -1.001, uv.x));
#endif
#ifdef POSITIVEZ
	fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, vec3f(uv, 1.001));
#endif
#ifdef NEGATIVEZ
	fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, vec3f(uv, -1.001));
#endif
}