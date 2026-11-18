// Gaussian Splatting GPU depth sort — output pass. Writes the sorted source splat indices as floats into the instanced
// vertex buffer consumed by the Gaussian Splatting vertex shader, padding up to a multiple of 16 with the empty splat
// index (vertexCount).

struct GsSortParams {
    activeCount : u32,
    vertexCount : u32,
    paddedCount : u32,
    textureWidth : u32,
    partCount : u32,
    intervalCount : u32,
    depthMax : f32,
    keyScale : f32,
    maxKey : f32,
    pad0 : f32,
    pad1 : f32,
    pad2 : f32,
    meansMin : vec4f,
    meansMax : vec4f,
}

@group(0) @binding(0) var<storage, read> params : GsSortParams;
@group(0) @binding(1) var<storage, read> vals : array<u32>;
@group(0) @binding(2) var<storage, read_write> indexOut : array<f32>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let i = (wid.y * 65535u + wid.x) * 256u + lid.x;
    if (i >= params.paddedCount) {
        return;
    }
    indexOut[i] = select(f32(params.vertexCount), f32(vals[i]), i < params.activeCount);
}
