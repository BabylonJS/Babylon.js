// Gaussian Splatting GPU depth sort — radix pass, step 4. Stable scatter of a 1024-key block (256 threads x 4 contiguous
// keys, read as one vec4u per thread) to its sorted position: global offset of the (digit, block) bin + rank of the key
// among the block's keys with the same digit.
//
// Per-thread digit counters are packed two 16-bit bins per u32 (a block holds at most 1024 keys, so the 16-bit halves never
// overflow) in 8 rows (digit >> 1) of 256 columns (threads). Each row is scanned with a segmented scan: 32 threads per row
// scan 8 consecutive columns sequentially, then the 32 segment totals of the row are scanned with a Hillis-Steele scan.
// Rows are padded by one word per segment so the sequential accesses of a warp hit distinct banks.

struct GsSortPassParams {
    count : u32,
    numBlocks : u32,
    shift : u32,
    chunkCount : u32,
}

@group(0) @binding(0) var<storage, read> params : GsSortPassParams;
@group(0) @binding(1) var<storage, read> keysIn : array<vec4u>;
@group(0) @binding(2) var<storage, read> valsIn : array<vec4u>;
@group(0) @binding(3) var<storage, read_write> keysOut : array<u32>;
@group(0) @binding(4) var<storage, read_write> valsOut : array<u32>;
@group(0) @binding(5) var<storage, read> sumTable : array<u32>; // chunk-local exclusive scan
@group(0) @binding(6) var<storage, read> chunkSums : array<u32>; // exclusive scan of the chunk totals

const RowStride = 288u; // 256 columns + 32 padding words

var<workgroup> counters : array<u32, 2304>; // 8 rows x RowStride
var<workgroup> segSums : array<u32, 256>; // 8 rows x 32 segments
var<workgroup> globalOffset : array<u32, 16>;

fn column(t : u32) -> u32 {
    return t + (t >> 3u);
}

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let t = lid.x;
    let block = wid.y * 65535u + wid.x;
    let base = block * 1024u + t * 4u;
    let col = column(t);

    for (var r = 0u; r < 8u; r++) {
        counters[r * RowStride + col] = 0u;
    }
    if (t < 16u && block < params.numBlocks) {
        let bin = t * params.numBlocks + block;
        globalOffset[t] = sumTable[bin] + chunkSums[bin >> 10u];
    }

    let key = keysIn[block * 256u + t];
    var digit : array<u32, 4>;
    var rank : array<u32, 4>;
    for (var j = 0u; j < 4u; j++) {
        if (base + j < params.count) {
            digit[j] = (key[j] >> params.shift) & 15u;
            let slot = (digit[j] >> 1u) * RowStride + col;
            let sh = (digit[j] & 1u) * 16u;
            let prev = counters[slot];
            rank[j] = (prev >> sh) & 0xFFFFu;
            counters[slot] = prev + (1u << sh);
        }
    }
    workgroupBarrier();

    // Inclusive scan of the 8 columns of this thread's (row, segment)
    let scanRow = t >> 5u;
    let scanSeg = t & 31u;
    let scanBase = scanRow * RowStride + scanSeg * 9u;
    var run = 0u;
    for (var k = 0u; k < 8u; k++) {
        run += counters[scanBase + k];
        counters[scanBase + k] = run;
    }
    segSums[t] = run;
    workgroupBarrier();

    for (var off = 1u; off < 32u; off = off << 1u) {
        var add = 0u;
        if (scanSeg >= off) {
            add = segSums[t - off];
        }
        workgroupBarrier();
        segSums[t] += add;
        workgroupBarrier();
    }

    let val = valsIn[block * 256u + t];
    let seg = t >> 3u;
    for (var j = 0u; j < 4u; j++) {
        if (base + j < params.count) {
            let d = digit[j];
            let row = d >> 1u;
            let sh = (d & 1u) * 16u;
            // Exclusive count over the threads before this one: previous column of the segment + previous segments
            var exclusive = 0u;
            if ((t & 7u) != 0u) {
                exclusive = counters[row * RowStride + column(t - 1u)];
            }
            if (seg > 0u) {
                exclusive += segSums[row * 32u + seg - 1u];
            }
            let pos = globalOffset[d] + ((exclusive >> sh) & 0xFFFFu) + rank[j];
            keysOut[pos] = key[j];
            valsOut[pos] = val[j];
        }
    }
}
