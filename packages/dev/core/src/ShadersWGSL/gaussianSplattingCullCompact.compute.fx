// Gaussian Splatting GPU culling - compaction pass (post-sort).
//
// Stream-compacts the visible sorted indices into a dense draw list, preserving back-to-front order. `offsets`
// holds the exclusive prefix sum of the visibility flags, so each visible slot writes to its packed position.

struct Params {
    count : u32,
};

@group(0) @binding(0) var<storage, read> sortedIndex : array<f32>;
@group(0) @binding(1) var<storage, read> flag : array<u32>;
@group(0) @binding(2) var<storage, read> offsets : array<u32>;
@group(0) @binding(3) var<storage, read_write> drawList : array<f32>;
@group(0) @binding(4) var<uniform> params : Params;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let i = gid.x;
    if (i >= params.count) {
        return;
    }
    if (flag[i] == 1u) {
        drawList[offsets[i]] = sortedIndex[i];
    }
}
