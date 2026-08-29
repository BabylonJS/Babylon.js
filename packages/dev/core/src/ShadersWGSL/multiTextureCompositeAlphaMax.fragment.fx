var uLayers: texture_2d_array<f32>;
var uLayersSampler: sampler;

uniform uLayerCount: i32;

varying vUV: vec2f;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let px: vec2i = min(vec2i(i32(input.vUV.x * f32(MULTITEXTURE_WIDTH)), i32(input.vUV.y * f32(MULTITEXTURE_HEIGHT))), vec2i(MULTITEXTURE_WIDTH - 1, MULTITEXTURE_HEIGHT - 1));
    var result: vec4f = vec4f(0.0);
    for (var i: i32 = 0; i < MULTITEXTURE_MAXLAYERS; i++) {
        if (i >= uniforms.uLayerCount) { break; }
        let s: vec4f = textureSampleLevel(uLayers, uLayersSampler, input.vUV, i, 0.0);
        if (s.a >= result.a) {
            result = s;
        }
    }
    fragmentOutputs.color = result;
}
