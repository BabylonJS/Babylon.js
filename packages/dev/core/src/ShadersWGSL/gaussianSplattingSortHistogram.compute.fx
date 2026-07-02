// Gaussian Splatting GPU depth sort - histogram pass.
//
// Maps each active slot's depth to a bucket in [0, numBuckets) and accumulates the per-bucket count.
// The farthest splat (max depth) maps to bucket 0 so the subsequent ascending scatter produces
// back-to-front order for correct alpha blending (matching the CPU worker's counting sort).

struct Params {
    count : u32,
    paddedCount : u32,
    numBuckets : u32,
    pad : u32,
    coeff : vec4f,
};

@group(0) @binding(0) var<storage, read> depth : array<f32>;
@group(0) @binding(1) var<storage, read> range : array<i32>;
@group(0) @binding(2) var<storage, read_write> bucket : array<u32>;
@group(0) @binding(3) var<storage, read_write> histogram : array<atomic<u32>>;
@group(0) @binding(4) var<uniform> params : Params;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let i = gid.x;
    if (i >= params.count) {
        return;
    }
    let minDepth = bitcast<f32>(range[0]);
    let maxDepth = bitcast<f32>(range[1]);
    let span = maxDepth - minDepth;

    var b : u32 = 0u;
    if (span > 1e-12) {
        let scale = f32(params.numBuckets - 1u) / span;
        var k = i32((maxDepth - depth[i]) * scale);
        if (k < 0) {
            k = 0;
        }
        let maxBucket = i32(params.numBuckets - 1u);
        if (k > maxBucket) {
            k = maxBucket;
        }
        b = u32(k);
    }
    bucket[i] = b;
    atomicAdd(&histogram[b], 1u);
}
