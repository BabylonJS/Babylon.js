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
        #ifdef MULTITEXTURE_PREMULTIPLY
        result = s + result * (1.0 - s.a);
        #else
        let pm: vec4f = vec4f(s.rgb * s.a, s.a);
        result = pm + result * (1.0 - s.a);
        #endif
    }
    #ifdef MULTITEXTURE_PREMULTIPLY
    fragmentOutputs.color = result;
    #else
    let outA: f32 = result.a;
    fragmentOutputs.color = vec4f(select(vec3f(0.0), result.rgb / outA, outA > 0.0), outA);
    #endif
}
