// Blelloch exclusive scan of gpsScanTemp[0..511] in place (256 threads). The returned block total is
// valid on thread 0 only.

// Ceiling on every point-count sum. Sums saturate to it so a workload beyond 2^32 points degrades into a
// clamped (still monotonic) CDF instead of wrapping around.
const GpsMaxPointCount : u32 = 0xFFFFFF00u;

fn gpsSaturatingAdd(a : u32, b : u32) -> u32 {
    let sum = a + b;
    return select(GpsMaxPointCount, sum, sum >= a && sum <= GpsMaxPointCount);
}

var<workgroup> gpsScanTemp : array<u32, 512>;

fn gpsScanExclusive512(t : u32) -> u32 {
    var offset = 1u;
    for (var d = 256u; d > 0u; d = d >> 1u) {
        workgroupBarrier();
        if (t < d) {
            let ai = offset * (2u * t + 1u) - 1u;
            let bi = offset * (2u * t + 2u) - 1u;
            gpsScanTemp[bi] = gpsSaturatingAdd(gpsScanTemp[bi], gpsScanTemp[ai]);
        }
        offset = offset << 1u;
    }

    var total = 0u;
    if (t == 0u) {
        total = gpsScanTemp[511];
        gpsScanTemp[511] = 0u; // clear the last element for the exclusive down-sweep
    }

    for (var d = 1u; d < 512u; d = d << 1u) {
        offset = offset >> 1u;
        workgroupBarrier();
        if (t < d) {
            let ai = offset * (2u * t + 1u) - 1u;
            let bi = offset * (2u * t + 2u) - 1u;
            let s = gpsScanTemp[ai];
            gpsScanTemp[ai] = gpsScanTemp[bi];
            gpsScanTemp[bi] = gpsSaturatingAdd(gpsScanTemp[bi], s);
        }
    }
    workgroupBarrier();

    return total;
}
