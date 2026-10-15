// Gaussian Point Splatting — workload scan, level 3. Adds each block's scanned offset back onto the
// per-Gaussian exclusive prefixes so cdf becomes the global exclusive prefix sum of the weights.
#include<gaussianPointSplattingScan>

@group(0) @binding(0) var<storage, read_write> cdf : array<u32>;
@group(0) @binding(1) var<storage, read> blockSums : array<u32>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let i = gid.y * 65535u * 256u + gid.x;
    if (i >= arrayLength(&cdf)) {
        return;
    }
    cdf[i] = gpsSaturatingAdd(cdf[i], blockSums[i / 512u]);
}
