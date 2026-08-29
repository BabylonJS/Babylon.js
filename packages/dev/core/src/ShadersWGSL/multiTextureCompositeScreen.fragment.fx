var uLayers: texture_2d_array<f32>;

uniform uLayerCount: i32;

varying vUV: vec2f;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let px: vec2i = min(vec2i(i32(input.vUV.x * f32(MULTITEXTURE_WIDTH)), i32(input.vUV.y * f32(MULTITEXTURE_HEIGHT))), vec2i(MULTITEXTURE_WIDTH - 1, MULTITEXTURE_HEIGHT - 1));
    var result: vec4f = vec4f(0.0);
    for (var i: i32 = 0; i < MULTITEXTURE_MAXLAYERS; i++) {
        if (i >= uniforms.uLayerCount) { break; }
        let s: vec4f = textureLoad(uLayers, px, i, 0);
        result = vec4f(1.0) - (vec4f(1.0) - result) * (vec4f(1.0) - s);
        if (all(result == vec4f(1.0))) { break; }
    }
    fragmentOutputs.color = result;
}
