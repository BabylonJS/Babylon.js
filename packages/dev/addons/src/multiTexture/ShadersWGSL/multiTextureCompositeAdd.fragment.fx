var uLayers: texture_2d_array<f32>;
var uLayersSampler: sampler;

uniform uLayerCount: i32;

varying vUV: vec2f;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var result: vec4f = vec4f(0.0);
    for (var i: i32 = 0; i < MULTITEXTURE_MAXLAYERS; i++) {
        if (i >= uniforms.uLayerCount) { break; }
        let s: vec4f = textureSampleLevel(uLayers, uLayersSampler, input.vUV, i, 0.0);
        result = min(result + s, vec4f(1.0));
    }
    fragmentOutputs.color = result;
}
