const GammaEncodePowerApprox = 1.0 / 2.2;

varying vUV: vec2f;

var textureSampler: texture_2d<f32>;

uniform lod: f32;
uniform gamma: i32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let textureSize = textureDimensions(textureSampler);
	fragmentOutputs.color = textureLoad(textureSampler, vec2u(fragmentInputs.vUV * vec2f(textureSize)), u32(uniforms.lod));
    if (uniforms.gamma == 0) {
        fragmentOutputs.color = vec4f(pow(fragmentOutputs.color.rgb, vec3f(GammaEncodePowerApprox)), fragmentOutputs.color.a);
    }
}
