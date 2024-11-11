var textureSampler: texture_2d<f32>;
var historySampler: texture_2d<f32>;

uniform factor: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	let c = textureLoad(textureSampler, vec2<i32>(fragmentInputs.position.xy), 0);
	let h = textureLoad(historySampler, vec2<i32>(fragmentInputs.position.xy), 0);
	fragmentOutputs.color =  mix(h, c, uniforms.factor);
}
