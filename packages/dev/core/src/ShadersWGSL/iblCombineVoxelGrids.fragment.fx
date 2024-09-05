varying vUV: vec2f;

var voxelXaxisSamplerSampler: sampler;
var voxelXaxisSampler: texture_3d<f32>;
var voxelYaxisSamplerSampler: sampler;
var voxelYaxisSampler: texture_3d<f32>;
var voxelZaxisSamplerSampler: sampler;
var voxelZaxisSampler: texture_3d<f32>;

uniform layer: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var coordZ: vec3f =  vec3f(fragmentInputs.vUV.x, fragmentInputs.vUV.y, uniforms.layer);
    var voxelZ: f32 = textureSample(voxelZaxisSampler, voxelZaxisSamplerSampler, coordZ).r;
    var coordX: vec3f =  vec3f(1.0 - uniforms.layer, fragmentInputs.vUV.y, fragmentInputs.vUV.x);
    var voxelX: f32 = textureSample(voxelXaxisSampler, voxelXaxisSamplerSampler, coordX).r;
    var coordY: vec3f =  vec3f(uniforms.layer, fragmentInputs.vUV.x, fragmentInputs.vUV.y);
    var voxelY: f32 = textureSample(voxelYaxisSampler, voxelYaxisSamplerSampler, coordY).r;

    //   ivar size: vec3f = textureSize(voxelZaxisSampler, 0);
    //   ivar coordZ: vec3f = i vec3f(vUV.x *  f32(size.x), vUV.y *  f32(size.y),
    //                         i32(layer *  f32(size.z)));

    //   ivar coordX: vec3f = i vec3f(coordZ.z, coordZ.y, coordZ.x);
    //   ivar coordY: vec3f = i vec3f(coordZ.z, coordZ.x, coordZ.y);

    //   var voxelX: f32 = texelFetch(voxelXaxisSampler, coordX, 0).r;
    //   var voxelY: f32 = texelFetch(voxelYaxisSampler, coordY, 0).r;
    //   var voxelZ: f32 = texelFetch(voxelZaxisSampler, coordZ, 0).r;

    var voxel = select(0.0, 1.0, (voxelX > 0.0 || voxelY > 0.0 || voxelZ > 0.0));
    fragmentOutputs.color =  vec4f( vec3f(voxel), 1.0);

}