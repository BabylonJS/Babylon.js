varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var originalColorSampler: sampler;
var originalColor: texture_2d<f32>;
uniform viewport: vec4f;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	var uv: vec2f = uniforms.viewport.xy + input.vUV * uniforms.viewport.zw;
	var ssaoColor: vec4f = textureSample(textureSampler, textureSamplerSampler, uv);
	var sceneColor: vec4f = textureSample(originalColor, originalColorSampler, uv);

	fragmentOutputs.color = sceneColor * ssaoColor;

#define CUSTOM_FRAGMENT_MAIN_END
}
