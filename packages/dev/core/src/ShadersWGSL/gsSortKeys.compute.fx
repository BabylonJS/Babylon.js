// Gaussian Splatting GPU depth sort — key pass. One thread per output slot: maps the slot to its source splat through
// the active intervals, evaluates the view depth of the splat center and writes a quantized back-to-front sort key
// (farthest splat = smallest key) together with the source splat index.

struct GsSortParams {
    activeCount : u32,
    vertexCount : u32,
    paddedCount : u32,
    textureWidth : u32,
    partCount : u32,
    intervalCount : u32,
    depthMax : f32,
    keyScale : f32,
    maxKey : f32,
    pad0 : f32,
    pad1 : f32,
    pad2 : f32,
    meansMin : vec4f,
    meansMax : vec4f,
}

@group(0) @binding(0) var<storage, read> params : GsSortParams;
@group(0) @binding(1) var<storage, read> intervals : array<vec2u>; // x = exclusive prefix sum of the counts, y = source start
@group(0) @binding(2) var<storage, read> coefs : array<vec4f>; // per part: depth = dot(coef.xyz, center) + coef.w
@group(0) @binding(3) var<storage, read_write> keys : array<u32>;
@group(0) @binding(4) var<storage, read_write> vals : array<u32>;
@group(0) @binding(5) var centersTexture : texture_2d<f32>;
#ifdef USE_SOG
@group(0) @binding(6) var meansUTexture : texture_2d<f32>;
#endif
#ifdef COMPOUND
@group(0) @binding(7) var partIndicesTexture : texture_2d<f32>;
#endif

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let slot = (wid.y * 65535u + wid.x) * 256u + lid.x;
    if (slot >= params.activeCount) {
        return;
    }

    var src = slot;
    if (params.intervalCount > 0u) {
        // Last interval whose prefix offset is <= slot.
        var lo = 0u;
        var hi = params.intervalCount - 1u;
        while (lo < hi) {
            let mid = (lo + hi + 1u) >> 1u;
            if (intervals[mid].x <= slot) {
                lo = mid;
            } else {
                hi = mid - 1u;
            }
        }
        src = intervals[lo].y + (slot - intervals[lo].x);
    }

    let row = src / params.textureWidth;
    let uv = vec2i(i32(src - row * params.textureWidth), i32(row));

#ifdef USE_SOG
    let mL = textureLoad(centersTexture, uv, 0);
    let mU = textureLoad(meansUTexture, uv, 0);
    let q16 = (mU.xyz * 256.0 + mL.xyz) * (255.0 / 65535.0);
    let nPos = mix(params.meansMin.xyz, params.meansMax.xyz, q16);
    let center = sign(nPos) * (exp(abs(nPos)) - vec3f(1.0));
#else
    let center = textureLoad(centersTexture, uv, 0).xyz;
#endif

    var partIndex = 0u;
#ifdef COMPOUND
    let rawPart = textureLoad(partIndicesTexture, uv, 0).r;
    partIndex = min(u32(rawPart * 255.0 + 0.5), max(params.partCount, 1u) - 1u);
#endif

    let co = coefs[partIndex];
    let depth = dot(co.xyz, center) + co.w;
    let key = clamp((params.depthMax - depth) * params.keyScale, 0.0, params.maxKey);

    keys[slot] = u32(key);
    vals[slot] = src;
}
