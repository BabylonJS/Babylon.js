// Copies the atomically-accumulated per-voxel opacity buffer (populated during voxelization via
// atomicMax) into the r8unorm voxel grid storage texture (mip 0). Runs once after all splat/axis
// voxelization passes and before the mip hierarchy is generated. See iblShadowsVoxelRenderer.
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
    // Opacity is stored quantized to [0,255], packed 4 voxels per u32 (byte lane = vidx % 4,
    // LSB-first). Unpack the target byte and decode back to [0,1].
    let word: u32 = voxelOpacityBuffer[vidx >> 2u];
    let byteVal: u32 = (word >> ((vidx & 3u) * 8u)) & 0xFFu;
    let opacity: f32 = f32(byteVal) / 255.0;
    textureStore(voxelGridTarget, vec3<i32>(id), vec4f(opacity, 0.0, 0.0, 1.0));
}
