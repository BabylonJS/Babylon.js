// Gaussian Splatting GPU depth sort — radix pass, step 3. Single workgroup: in-place exclusive scan of the (at most 256)
// chunk totals produced by the local scan.

struct GsSortPassParams {
    count : u32,
    numBlocks : u32,
    shift : u32,
    chunkCount : u32,
}

@group(0) @binding(0) var<storage, read> params : GsSortPassParams;
@group(0) @binding(1) var<storage, read_write> chunkSums : array<u32>;

var<workgroup> sums : array<u32, 256>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(local_invocation_id) lid : vec3u) {
    let t = lid.x;
    let v = select(0u, chunkSums[t], t < params.chunkCount);

    sums[t] = v;
    workgroupBarrier();
    for (var off = 1u; off < 256u; off = off << 1u) {
        var add = 0u;
        if (t >= off) {
            add = sums[t - off];
        }
        workgroupBarrier();
        sums[t] += add;
        workgroupBarrier();
    }

    if (t < params.chunkCount) {
        chunkSums[t] = sums[t] - v;
    }
}
