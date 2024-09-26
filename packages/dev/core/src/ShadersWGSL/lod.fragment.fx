const GammaEncodePowerApprox = 1.0 / 2.2;

varying vUV: vec2f;

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

uniform lod: f32;
uniform gamma: bool;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, vUV, uniforms.lod);
    if (!gamma) {
        fragmentOutputs.color = vec4f(pow(fragmentOutputs.color, vec3f(GammaEncodePowerApprox)), fragmentOutputs.color.a);
    }
}
