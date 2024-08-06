// Samplers
varying vUV: vec2f;
var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;

// Parameters
uniform screenSize: vec2f;


#define CUSTOM_FRAGMENT_DEFINITIONS

fn main(void)
{
	var colorDepth: vec4f =  vec4f(0.0);

	for (var x: i32 = -OFFSET; x <= OFFSET; x++)
		for (var y: i32 = -OFFSET; y <= OFFSET; y++)
			colorDepth += textureSample(textureSampler, textureSamplerSampler, vUV +  vec2f(x, y) / uniforms.screenSize);

	FragmentOutputs.color = (colorDepth /  f32((OFFSET * 2 + 1) * (OFFSET * 2 + 1)));
}