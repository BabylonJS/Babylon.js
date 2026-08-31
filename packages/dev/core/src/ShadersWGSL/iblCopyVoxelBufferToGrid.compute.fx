// Copies the packed per-voxel opacity buffer into the r8 voxel grid (mip 0), after voxelization and
// before mip generation.
@group(0) @binding(0) var<storage, read> voxelOpacityBuffer: array<u32>;
@group(0) @binding(1) var voxelGridTarget: texture_storage_3d<r8unorm, write>;

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let size: vec3<u32> = textureDimensions(voxelGridTarget);
    if (id.x >= size.x || id.y >= size.y || id.z >= size.z) {
        return;
    }
    let res: u32 = size.x;
    let vidx: u32 = id.x + id.y * res + id.z * res * res;
    // Unpack this voxel's byte (4 voxels/u32, LSB-first) and decode [0,255] -> [0,1].
    let word: u32 = voxelOpacityBuffer[vidx >> 2u];
    let byteVal: u32 = (word >> ((vidx & 3u) * 8u)) & 0xFFu;
    let opacity: f32 = f32(byteVal) / 255.0;
    textureStore(voxelGridTarget, vec3<i32>(id), vec4f(opacity, 0.0, 0.0, 1.0));
}
