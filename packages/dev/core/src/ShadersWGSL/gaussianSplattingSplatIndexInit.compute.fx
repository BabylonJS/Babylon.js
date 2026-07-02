// Gaussian Splatting - splat index generation (WebGPU compute).
//
// Phase 0 scaffold for the WebGPU Gaussian Splatting fast path: copies a packed
// (interval-aware) source-index list into the sorted-index buffer that is bound
// directly as the `splatIndex` instanced vertex buffer. This proves the
// compute -> storage buffer -> instanced vertex buffer data path end to end,
// without any CPU readback. Phase 1 replaces the seed copy with GPU depth-key
// generation followed by a radix sort.

struct Params {
    count : u32,
};

@group(0) @binding(0) var<storage, read> seedBuffer : array<f32>;
@group(0) @binding(1) var<storage, read_write> sortedIndexBuffer : array<f32>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let index = global_id.x;
    if (index >= params.count) {
        return;
    }
    sortedIndexBuffer[index] = seedBuffer[index];
}
