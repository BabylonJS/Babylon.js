// Adds each block's scanned offset back onto its elements, completing a hierarchical exclusive scan.
// Pairs with prefixSumScanBlock: after the per-block exclusive sums are written and the block totals
// have themselves been exclusive-scanned into `blockOffsets`, this adds blockOffsets[block] to every
// element of that block.

struct Params {
    count : u32,
};

@group(0) @binding(0) var<storage, read_write> data : array<u32>;
@group(0) @binding(1) var<storage, read> blockOffsets : array<u32>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let g = gid.x;
    if (g < params.count) {
        data[g] = data[g] + blockOffsets[wid.x];
    }
}
