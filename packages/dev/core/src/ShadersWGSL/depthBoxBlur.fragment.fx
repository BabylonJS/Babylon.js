// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

// Parameters
uniform screenSize: vec2f;


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var colorDepth: vec4f = vec4f(0.0);

	for (var x: i32 = -OFFSET; x <= OFFSET; x++) {
		for (var y: i32 = -OFFSET; y <= OFFSET; y++) {
			colorDepth += textureSample(textureSampler, textureSamplerSampler, input.vUV +  vec2f(f32(x), f32(y)) / uniforms.screenSize);
		}
	}

	fragmentOutputs.color = (colorDepth /  f32((OFFSET * 2 + 1) * (OFFSET * 2 + 1)));
}