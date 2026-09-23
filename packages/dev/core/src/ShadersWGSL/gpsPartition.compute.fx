// Gaussian Point Splatting — acceleration-table build. One invocation per bucket (GPS_PARTITION_BUCKETS
// + 1 entries): partTable[k] = the Gaussian that owns point k*total/BUCKETS. The splat kernel then seeds
// its CDF binary search from partTable[bucket], turning ~log2(gaussianCount) divergent global reads per
// point into a search over just the few Gaussians spanning one bucket. Runs after the scan, before splat.
#include<gaussianPointSplatting>

@group(0) @binding(0) var<storage, read> cdf : array<u32>;
@group(0) @binding(1) var<storage, read> pointCount : array<u32>;
@group(0) @binding(2) var<storage, read_write> partTable : array<u32>;

// Largest g in [0, count) with cdf[g] <= p (the point's owning Gaussian).
fn gpsFindGaussian(p : u32, count : u32) -> u32 {
    var lo = 0u;
    var hi = count;
    loop {
        if (lo + 1u >= hi) {
            break;
        }
        let mid = (lo + hi) >> 1u;
        if (cdf[mid] <= p) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    return lo;
}

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let k = gid.x;
    if (k > GPS_PARTITION_BUCKETS) {
        return;
    }
    let total = pointCount[0];
    let count = arrayLength(&cdf);
    if (total == 0u || count == 0u) {
        partTable[k] = 0u;
        return;
    }
    // Point at the start of bucket k. f32 avoids the u32 overflow of k*total; the splat kernel widens its
    // seed range by +/-1 bucket, which absorbs the small f32 rounding here.
    var pk = u32(f32(k) / f32(GPS_PARTITION_BUCKETS) * f32(total));
    if (pk > total - 1u) {
        pk = total - 1u;
    }
    partTable[k] = gpsFindGaussian(pk, count);
}
