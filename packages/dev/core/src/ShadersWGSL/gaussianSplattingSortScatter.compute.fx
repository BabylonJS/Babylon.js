// Gaussian Splatting GPU depth sort - scatter pass.
//
// After the histogram has been exclusive-scanned into per-bucket start offsets, each active slot claims
// the next free position within its bucket via an atomic increment and writes its source index (as f32)
// into the sorted-index buffer. Trailing padded slots are set to the reserved (invisible) index 0.

struct Params {
    count : u32,
    paddedCount : u32,
    numBuckets : u32,
    pad : u32,
    coeff : vec4f,
};

@group(0) @binding(0) var<storage, read> bucket : array<u32>;
@group(0) @binding(1) var<storage, read> seed : array<f32>;
@group(0) @binding(2) var<storage, read_write> offsets : array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> sortedIndex : array<f32>;
@group(0) @binding(4) var<uniform> params : Params;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let i = gid.x;
    if (i >= params.paddedCount) {
        return;
    }
    if (i >= params.count) {
        // Padding beyond the active count renders the reserved invisible splat 0.
        sortedIndex[i] = 0.0;
        return;
    }
    let b = bucket[i];
    let dst = atomicAdd(&offsets[b], 1u);
    sortedIndex[dst] = seed[i];
}
