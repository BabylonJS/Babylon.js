var uLayersSampler: sampler;
var uLayers: texture_2d_array<f32>;

uniform uLayerCount: i32;

varying vUV: vec2f;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var result: vec4f = vec4f(1.0);
    for (var i: i32 = 0; i < MULTITEXTURE_MAXLAYERS; i++) {
        if (i >= uniforms.uLayerCount) { break; }
        let px: vec2i = min(vec2i(i32(input.vUV.x * f32(MULTITEXTURE_WIDTH)), i32(input.vUV.y * f32(MULTITEXTURE_HEIGHT))), vec2i(MULTITEXTURE_WIDTH - 1, MULTITEXTURE_HEIGHT - 1));
        let s: vec4f = textureLoad(uLayers, px, i);
        result = result * s;
        if (dot(result, vec4f(1.0)) == 0.0) { break; }
    }
    fragmentOutputs.color = result;
}
