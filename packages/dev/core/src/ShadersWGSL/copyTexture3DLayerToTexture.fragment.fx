var textureSampler: texture_3d<f32>;

uniform layerNum: i32;
varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let coord = vec3f(vec2f(input.vUV.x, input.vUV.y) * vec2f(textureDimensions(textureSampler, 0).xy), f32(uniforms.layerNum));
    let color = textureLoad(textureSampler, vec3i(coord), 0).rgb;
    fragmentOutputs.color =  vec4f(color, 1);
}