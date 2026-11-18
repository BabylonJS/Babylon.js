// Gaussian Splatting GPU depth sort — radix pass, step 1. Each workgroup histograms the 4-bit digit of its 1024-key block
// and writes the 16 counts bin-major into sumTable[bin * numBlocks + block].

struct GsSortPassParams {
    count : u32,
    numBlocks : u32,
    shift : u32,
    chunkCount : u32,
}

@group(0) @binding(0) var<storage, read> params : GsSortPassParams;
@group(0) @binding(1) var<storage, read> keysIn : array<u32>;
@group(0) @binding(2) var<storage, read_write> sumTable : array<u32>;

var<workgroup> hist : array<atomic<u32>, 16>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let t = lid.x;
    let block = wid.y * 65535u + wid.x;

    if (t < 16u) {
        atomicStore(&hist[t], 0u);
    }
    workgroupBarrier();

    let base = block * 1024u;
    for (var j = 0u; j < 4u; j++) {
        let idx = base + j * 256u + t;
        if (idx < params.count) {
            atomicAdd(&hist[(keysIn[idx] >> params.shift) & 15u], 1u);
        }
    }
    workgroupBarrier();

    if (t < 16u && block < params.numBlocks) {
        sumTable[t * params.numBlocks + block] = atomicLoad(&hist[t]);
    }
}
