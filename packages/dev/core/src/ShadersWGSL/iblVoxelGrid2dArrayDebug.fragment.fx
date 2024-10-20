varying vUV: vec2f;

var voxelTextureSampler: sampler;
var voxelTexture: texture_3d<f32>;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
uniform slice: i32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    var size: vec3u = textureDimensions(voxelTexture, 0);
    var dimension: f32 = sqrt( f32(size.z));
    var samplePos: vec2f = fract(input.vUV.xy *  vec2f(dimension));
    var sampleIndex: u32 =  u32(floor(input.vUV.x *  f32(dimension)) + floor(input.vUV.y *  f32(dimension)) * dimension);
    var color = textureSample(voxelTexture, voxelTextureSampler,  vec3f(samplePos.xy, sampleIndex)).rrr;

    color += textureSample(textureSampler, textureSamplerSampler, input.vUV.xy).rgb;

    fragmentOutputs.color = vec4f(color, 1.0);

}