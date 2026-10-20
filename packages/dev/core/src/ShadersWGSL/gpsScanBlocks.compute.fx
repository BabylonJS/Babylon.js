// Gaussian Point Splatting — workload scan, level 1. Exclusive-scans each 512-Gaussian block of the
// per-Gaussian point weights into cdf, and writes each block's total to blockSums.
#include<gaussianPointSplattingScan>

@group(0) @binding(0) var<storage, read> weights : array<u32>;
@group(0) @binding(1) var<storage, read_write> cdf : array<u32>;
@group(0) @binding(2) var<storage, read_write> blockSums : array<u32>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let t = lid.x;
    let block = wid.y * 65535u + wid.x;
    let base = block * 512u;
    let n = arrayLength(&weights);
    let i0 = base + 2u * t;
    let i1 = base + 2u * t + 1u;

    gpsScanTemp[2u * t] = select(0u, weights[i0], i0 < n);
    gpsScanTemp[2u * t + 1u] = select(0u, weights[i1], i1 < n);

    let total = gpsScanExclusive512(t);

    if (t == 0u) {
        blockSums[block] = total;
    }
    if (i0 < n) {
        cdf[i0] = gpsScanTemp[2u * t];
    }
    if (i1 < n) {
        cdf[i1] = gpsScanTemp[2u * t + 1u];
    }
}
