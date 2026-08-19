// voxel_storage is kept bound only to source the grid resolution via textureDimensions; the grid
// texture itself is written later by the buffer->grid copy compute pass, not here.
var voxel_storage: texture_storage_3d<r8unorm, write>;
// Shared per-voxel opacity accumulator (see gaussianSplattingVoxel.fragment; packed 4 voxels per
// u32). Opaque meshes write full opacity (255); overlapping writes are combined with max.
var<storage, read_write> voxelOpacityBuffer: array<atomic<u32>>;
#include<iblVoxelOpacityAtomicMax>
varying vNormalizedPosition: vec3f;
flat varying f_swizzle: i32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var size: vec3<u32> = textureDimensions(voxel_storage);
    var normPos: vec3f = input.vNormalizedPosition.xyz;
    switch (input.f_swizzle) {
        case 0: {
            normPos = normPos.zxy;
            break;
        }
        case 1: {
            normPos = normPos.yzx;
            break;
        }
        default: {
            normPos = normPos.xyz;
            break;
        }
    }

    let coord: vec3<u32> = min(
        vec3<u32>(u32(normPos.x * f32(size.x)), u32(normPos.y * f32(size.y)), u32(normPos.z * f32(size.z))),
        size - vec3<u32>(1u));
    let vidx: u32 = coord.x + coord.y * size.x + coord.z * size.x * size.y;
    voxelOpacityAtomicMax(vidx, 255u);
    fragmentOutputs.color = vec4<f32>(vec3<f32>(normPos), 1.);
}