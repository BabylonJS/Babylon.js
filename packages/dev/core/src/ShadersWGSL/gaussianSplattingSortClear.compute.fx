// Gaussian Splatting GPU depth sort - clear pass.
// Zeroes the per-bucket histogram before the histogram pass accumulates into it.

struct Params {
    count : u32,
    paddedCount : u32,
    numBuckets : u32,
    pad : u32,
    coeff : vec4f,
};

@group(0) @binding(0) var<storage, read_write> histogram : array<atomic<u32>>;
@group(0) @binding(1) var<uniform> params : Params;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    if (gid.x < params.numBuckets) {
        atomicStore(&histogram[gid.x], 0u);
    }
}
