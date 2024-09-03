var textureSampler: texture_3d<f32>;

uniform layerNum: i32;
varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var coord: vec2i = vec2i(i32(input.vUV.x), i32(input.vUV.y)) * vec2i(textureDimensions(textureSampler, 0).xy);
    var color: vec3f = textureLoad(textureSampler, vec3i(coord, uniforms.layerNum), 0).rgb;
    fragmentOutputs.color =  vec4f(color, 1);
}
