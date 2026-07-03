// Blelloch/Hillis-Steele block scan (WebGPU compute).
//
// Scans `count` u32 values in `data` in place into per-block EXCLUSIVE prefix sums, and writes each
// block's total into `blockSums`. A hierarchical driver scans `blockSums` and adds the offsets back
// (see prefixSumAddOffsets), producing a full exclusive scan over arrays larger than one workgroup.

struct Params {
    count : u32,
};

@group(0) @binding(0) var<storage, read_write> data : array<u32>;
@group(0) @binding(1) var<storage, read_write> blockSums : array<u32>;
@group(0) @binding(2) var<uniform> params : Params;

var<workgroup> temp : array<u32, 256>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u, @builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let g = gid.x;
    let t = lid.x;

    // Explicit bounds check: `select` would still evaluate `data[g]` for out-of-range lanes, and the recursive
    // block-sums buffer is sized to the exact block count (not padded to the workgroup size), so that read can be
    // out of bounds. Guard the load so padded lanes contribute 0.
    var v = 0u;
    if (g < params.count) {
        v = data[g];
    }
    temp[t] = v;
    workgroupBarrier();

    // Hillis-Steele inclusive scan. Each step reads old values into a register before the shared
    // array is updated, so no thread observes a partially-updated neighbour.
    for (var d = 1u; d < 256u; d = d * 2u) {
        var val = temp[t];
        if (t >= d) {
            val = val + temp[t - d];
        }
        workgroupBarrier();
        temp[t] = val;
        workgroupBarrier();
    }

    // Exclusive result = inclusive - own value.
    if (g < params.count) {
        data[g] = temp[t] - v;
    }
    // The last lane holds the inclusive total of the whole block (padded lanes contribute 0).
    if (t == 255u) {
        blockSums[wid.x] = temp[t];
    }
}
