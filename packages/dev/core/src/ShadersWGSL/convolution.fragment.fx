// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

uniform screenSize: vec2f;
uniform kernel: array<f32, 9>;


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var onePixel: vec2f =  vec2f(1.0, 1.0) / uniforms.screenSize;
	var colorSum: vec4f =
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(-1, -1)) * uniforms.kernel[0] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(0, -1)) * uniforms.kernel[1] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(1, -1)) * uniforms.kernel[2] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(-1, 0)) * uniforms.kernel[3] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(0, 0)) * uniforms.kernel[4] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(1, 0)) * uniforms.kernel[5] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(-1, 1)) * uniforms.kernel[6] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(0, 1)) * uniforms.kernel[7] +
		textureSample(textureSampler, textureSamplerSampler, input.vUV + onePixel *  vec2f(1, 1)) * uniforms.kernel[8];

	var kernelWeight: f32 =
		uniforms.kernel[0] +
		uniforms.kernel[1] +
		uniforms.kernel[2] +
		uniforms.kernel[3] +
		uniforms.kernel[4] +
		uniforms.kernel[5] +
		uniforms.kernel[6] +
		uniforms.kernel[7] +
		uniforms.kernel[8];

	if (kernelWeight <= 0.0) {
		kernelWeight = 1.0;
	}

	fragmentOutputs.color =  vec4f((colorSum / kernelWeight).rgb, 1);
}