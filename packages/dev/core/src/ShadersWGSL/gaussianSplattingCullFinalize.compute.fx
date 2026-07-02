// Gaussian Splatting GPU culling - finalize pass (post-sort).
//
// Computes the visible splat count from the scanned flags, writes the draw-indexed-indirect arguments
// (instanceCount = ceil(visible / 16)) and the visible count, then zero-pads the draw list's final partial
// instance so the indirect draw never renders stale indices in the last (< 16 splats) instance.

struct Params {
    count : u32,
    indexCount : u32,
    pad0 : u32,
    pad1 : u32,
};

@group(0) @binding(0) var<storage, read> flag : array<u32>;
@group(0) @binding(1) var<storage, read> offsets : array<u32>;
@group(0) @binding(2) var<storage, read_write> countOut : array<u32>;
@group(0) @binding(3) var<storage, read_write> indirectArgs : array<u32>;
@group(0) @binding(4) var<storage, read_write> drawList : array<f32>;
@group(0) @binding(5) var<uniform> params : Params;

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let n = params.count;
    var visible = 0u;
    if (n > 0u) {
        visible = offsets[n - 1u] + flag[n - 1u];
    }
    let padded = (visible + 15u) & ~15u;

    let t = gid.x;
    if (t == 0u) {
        countOut[0] = visible;
        indirectArgs[0] = params.indexCount;
        indirectArgs[1] = padded / 16u;
        indirectArgs[2] = 0u;
        indirectArgs[3] = 0u;
        indirectArgs[4] = 0u;
    }
    // Point the last partial instance's padding slots at a sentinel index (-1) that the vertex shader clips,
    // so they render nothing. (Index 0 — as the non-culled path uses — would render a real splat here, which is
    // wrong when that splat is culled: it would appear as an orphan in the middle of the view.)
    let idx = visible + t;
    if (idx < padded) {
        drawList[idx] = -1.0;
    }
}
