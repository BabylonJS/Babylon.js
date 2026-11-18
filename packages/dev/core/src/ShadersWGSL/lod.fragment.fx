#ifndef USE_EXACT_SRGB_CONVERSIONS
#define USE_EXACT_SRGB_CONVERSIONS
#endif
#include<helperFunctions>

varying vUV: vec2f;

var textureSampler: texture_2d<f32>;

uniform lod: f32;
uniform gamma: i32; // 0: display gamma, 1: preserve channels, 2: restore hardware sRGB.

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let textureSize = textureDimensions(textureSampler);
	fragmentOutputs.color = textureLoad(textureSampler, vec2u(fragmentInputs.vUV * vec2f(textureSize)), u32(uniforms.lod));
    if (uniforms.gamma == 0) {
        fragmentOutputs.color = vec4f(pow(fragmentOutputs.color.rgb, vec3f(GammaEncodePowerApprox)), fragmentOutputs.color.a);
    } else if (uniforms.gamma == 2) {
        fragmentOutputs.color = vec4f(toGammaSpaceExact(fragmentOutputs.color.rgb), fragmentOutputs.color.a);
    }
}
