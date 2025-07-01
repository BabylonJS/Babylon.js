varying vUV: vec2f;

var textureSampler: texture_2d<f32>;
var historySampler: texture_2d<f32>;
#ifdef TAA_VELOCITY_OFFSET
var historySamplerSampler: sampler;
var velocitySampler: texture_2d<f32>;
#endif

uniform factor: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	let pos = vec2i(fragmentInputs.position.xy);
	let c = textureLoad(textureSampler, pos, 0);

#ifdef TAA_VELOCITY_OFFSET
	let v = textureLoad(velocitySampler, pos, 0);
	var h = textureSample(historySampler, historySamplerSampler, input.vUV + v.xy);

	#ifdef TAA_COLOR_CLAMPED
		var minColor = vec4f(1);
		var maxColor = vec4f(0);
		for (var x = -1; x <= 1; x += 1) {
			for (var y = -1; y <= 1; y += 1) {
				let color = textureLoad(textureSampler, pos + vec2i(x, y), 0);
				minColor = min(minColor, color);
				maxColor = max(maxColor, color);
			}
		}
		h = clamp(h, minColor, maxColor);
	#endif

#else
	let h = textureLoad(historySampler, pos, 0);
#endif
	fragmentOutputs.color =  mix(h, c, uniforms.factor);
}
