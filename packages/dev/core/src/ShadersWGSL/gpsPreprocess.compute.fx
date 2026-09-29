// Gaussian Point Splatting — preprocesses one Gaussian into screen-space state and emits its stochastic
// point count.
#include<gaussianPointSplatting>
#include<gaussianSplattingShared>

@group(0) @binding(0) var<storage, read> means : array<vec4f>;
@group(0) @binding(1) var<storage, read> colorOpacity : array<u32>;
@group(0) @binding(2) var<storage, read_write> weights : array<u32>;
@group(0) @binding(3) var<storage, read_write> gsData : array<GpsScreen>;
@group(0) @binding(4) var<uniform> uniforms : GpsUniforms;
@group(0) @binding(5) var<storage, read> cov3d : array<u32>; // 4 u32/Gaussian: 3 f16 pairs (Sigma/factor) + f32 factor
@group(0) @binding(6) var<storage, read> sh : array<u32>; // 8-bit-quantized SH coeffs packed 4/word, GPS_SH_WORDS per Gaussian
@group(0) @binding(7) var<storage, read> parts : array<GpsPart>; // per-part live world matrix + visibility
@group(0) @binding(8) var<storage, read> hiZ : array<f32>; // previous-frame Hi-Z pyramid (max view-z), for occlusion

// Flat offset (in floats) of Hi-Z pyramid level `l` (levels concatenated finest-first at level 0).
fn gpsHiZLevelOffset(l : u32, baseW : u32, baseH : u32) -> u32 {
    var off = 0u;
    for (var i = 0u; i < l; i = i + 1u) {
        off += max(1u, baseW >> i) * max(1u, baseH >> i);
    }
    return off;
}

// True when the whole footprint is behind previous-frame geometry. Use the max depth touched by the
// footprint so any miss/far sample prevents an unsafe cull.
fn gpsHiZOccluded(center : vec2f, footR : f32, viewDepth : f32) -> bool {
    let baseW = u32(uniforms.hiZInfo.x);
    let baseH = u32(uniforms.hiZInfo.y);
    let numLevels = u32(uniforms.hiZInfo.z);
    let minx = i32(floor(center.x - footR));
    let maxx = i32(ceil(center.x + footR));
    let miny = i32(floor(center.y - footR));
    let maxy = i32(ceil(center.y + footR));
    let d = f32(max(maxx - minx, maxy - miny) + 1);
    var lod = i32(ceil(log2(max(d, 1.0) * 0.5)));
    lod = clamp(lod, 0, i32(numLevels) - 1);
    let L = u32(lod);
    let lw = max(1u, baseW >> L);
    let lh = max(1u, baseH >> L);
    let tile = 1u << L;
    let off = gpsHiZLevelOffset(L, baseW, baseH);
    let tx0 = min(u32(max(minx, 0)) / tile, lw - 1u);
    let tx1 = min(u32(max(maxx, 0)) / tile, lw - 1u);
    let ty0 = min(u32(max(miny, 0)) / tile, lh - 1u);
    let ty1 = min(u32(max(maxy, 0)) / tile, lh - 1u);
    // Misalignment can make a ~2-texel footprint touch 3x3 texels; sample all of them so the max depth
    // remains conservative.
    var zMax = 0.0;
    for (var ty = ty0; ty <= ty1; ty = ty + 1u) {
        let row = off + ty * lw;
        for (var tx = tx0; tx <= tx1; tx = tx + 1u) {
            zMax = max(zMax, hiZ[row + tx]);
        }
    }
    return zMax < viewDepth;
}

#if SH_DEGREE > 0
// u32 words per Gaussian for this degree's packed 8-bit SH coefficients; words = ceil(shDim*3 / 4).
#if SH_DEGREE == 1
const GPS_SH_WORDS : u32 = 3u;  // shDim 3  -> 9 bytes
#elif SH_DEGREE == 2
const GPS_SH_WORDS : u32 = 6u;  // shDim 8  -> 24 bytes
#elif SH_DEGREE == 3
const GPS_SH_WORDS : u32 = 12u; // shDim 15 -> 45 bytes
#else
const GPS_SH_WORDS : u32 = 18u; // shDim 24 -> 72 bytes
#endif

// One 8-bit SH scalar (byte `s` within the Gaussian's word range) dequantized to [-1, 1], matching the
// classic decompose(): b * 2/255 - 1.
fn gpsShByte(baseWord : u32, s : u32) -> f32 {
    let w = sh[baseWord + (s >> 2u)];
    let b = (w >> (8u * (s & 3u))) & 0xFFu;
    return f32(b) * (2.0 / 255.0) - 1.0;
}

// One SH coefficient (RGB = 3 consecutive bytes) for coefficient index `j`.
fn gpsShCoeff(baseWord : u32, j : u32) -> vec3f {
    let s = j * 3u;
    return vec3f(gpsShByte(baseWord, s), gpsShByte(baseWord, s + 1u), gpsShByte(baseWord, s + 2u));
}

// Compile-time SH coefficient count (excluding DC) for this asset's degree.
#if SH_DEGREE == 1
const GPS_SH_DIM : u32 = 3u;
#elif SH_DEGREE == 2
const GPS_SH_DIM : u32 = 8u;
#elif SH_DEGREE == 3
const GPS_SH_DIM : u32 = 15u;
#else
const GPS_SH_DIM : u32 = 24u;
#endif

// View-dependent SH delta. DC stays zero because it is already baked into baseColor; so1..so4 are the
// SH-order debug weights.
fn gpsEvalShDelta(g : u32, dir : vec3f, so1 : f32, so2 : f32, so3 : f32, so4 : f32) -> vec3f {
    let base = g * GPS_SH_WORDS;
    var coeffs : array<vec3<f32>, 25>;
    for (var j = 0u; j < GPS_SH_DIM; j = j + 1u) {
        coeffs[1u + j] = gpsShCoeff(base, j);
    }
    return computeColorFromSHDegree(dir, coeffs, so1, so2, so3, so4);
}
#endif

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let g = gid.y * 65535u * 256u + gid.x;
    let count = u32(uniforms.params0.x);
    if (g >= count) {
        return;
    }
    weights[g] = 0u;

    let mean = means[g].xyz;
    // Apply the live per-part transform; non-compound meshes use part 0.
    let partIndex = u32(means[g].w);
    let pdata = parts[partIndex];
    let partWorld = pdata.world;
    let near = uniforms.resNearFar.z;
    let far = uniforms.resNearFar.w;

    let worldPos = (partWorld * vec4f(mean, 1.0)).xyz;
    let camspace = uniforms.view * vec4f(worldPos, 1.0);
    let clip = uniforms.viewProjection * vec4f(worldPos, 1.0);
    if (clip.w <= 0.0) {
        return;
    }
    // View-space forward distance, handedness-agnostic (LH: +z, RH: -z).
    let viewDepth = abs(camspace.z);
    if (viewDepth <= near) {
        return;
    }
    var ndc = clip.xyz / clip.w;
    // Temporal-upsampling jitter: sub-pixel NDC shift so this frame's low-res grid samples a different
    // full-res sub-position (reconstructed in resolve). Zero when not upsampling.
    ndc.x += uniforms.misc.x;
    ndc.y += uniforms.misc.y;
    if (ndc.x < -1.3 || ndc.x > 1.3 || ndc.y < -1.3 || ndc.y > 1.3) {
        return;
    }

    // EWA projection setup. Sigma is stored as f16 pairs normalized by a per-splat factor, matching the
    // classic covA/covB + center.w scheme; rescale before projection.
    let covFactor = bitcast<f32>(cov3d[4u * g + 3u]);
    let p0 = unpack2x16float(cov3d[4u * g + 0u]) * covFactor; // S00, S01
    let p1 = unpack2x16float(cov3d[4u * g + 1u]) * covFactor; // S02, S11
    let p2 = unpack2x16float(cov3d[4u * g + 2u]) * covFactor; // S12, S22 (p0/p1/p2 reused for size cull)
    let covA = vec3f(p0.x, p0.y, p1.x); // S00, S01, S02
    let covB = vec3f(p1.y, p2.x, p2.y); // S11, S12, S22

    // Project with the shared classic EWA math. Keeping partWorld live here lets parts move each frame.
    // focal.w selects the orthographic Jacobian.
    let isOrtho = uniforms.focal.w > 0.5;
    let modelView = uniforms.view * partWorld;
    var cov2d = computeCov2D(covA, covB, modelView, camspace.xyz, uniforms.focal.xy, isOrtho);

    // `_makeSplat` doubles scale, making Sigma/cov2d 4x too large. The classic quad path cancels that
    // with invViewport = 1/width; this pixel-space path cancels it before detOrig and the low-pass kernel.
    cov2d = cov2d * 0.25;

    // Determinant BEFORE the low-pass dilation, for the optional opacity compensation below.
    let detOrig = cov2d[0][0] * cov2d[1][1] - cov2d[0][1] * cov2d[0][1];

    // Low-pass (antialiasing) dilation, matching the classic rasterizer's kernelSize.
    let kernelSize = uniforms.params0.y;
    cov2d[0][0] += kernelSize;
    cov2d[1][1] += kernelSize;

    let a = cov2d[0][0];
    let b = cov2d[0][1];
    let cc = cov2d[1][1];
    let det = a * cc - b * b;
    if (det <= 0.0) {
        return;
    }

    // Previous-frame Hi-Z cull; weights[g] is already 0, so returning emits no points.
    if (uniforms.hiZInfo.w > 0.5) {
        let mid = (a + cc) * 0.5;
        let rad = length(vec2f((a - cc) * 0.5, b));
        let footR = 3.0 * sqrt(max(mid + rad, 0.0)); // ~3-sigma footprint radius (px) from the max eigenvalue
        let cx = (ndc.x * 0.5 + 0.5) * uniforms.resNearFar.x;
        let cy = (ndc.y * 0.5 + 0.5) * uniforms.resNearFar.y;
        if (gpsHiZOccluded(vec2f(cx, cy), footR, viewDepth)) {
            return;
        }
    }

    // Optional COMPENSATION (depthNorm.w): boost opacity by sqrt(detOrig/detBlur) so the low-pass
    // dilation preserves each splat's total mass, matching the classic material's compensation.
    let compensation = select(1.0, sqrt(max(0.0, detOrig / det)), uniforms.depthNorm.w > 0.5);

    // Conic = inverse 2D covariance; Cholesky L (lower) so a sample = mean + L * N(0,1).
    let invDet = 1.0 / det;
    let conic = vec3f(cc * invDet, -b * invDet, a * invDet);
    let chol0 = sqrt(a);
    let chol1 = b / chol0;
    let chol2 = sqrt(max(0.0, cc - chol1 * chol1));

    let rgba = colorOpacity[g];
    let baseColor = vec3f(f32(rgba & 0xFFu), f32((rgba >> 8u) & 0xFFu), f32((rgba >> 16u) & 0xFFu)) / 255.0;
    let baseOpacity = f32((rgba >> 24u) & 0xFFu) / 255.0;
    if (baseOpacity == 0.0) {
        return;
    }

    // Per-part debug knobs mirror dbgPartData. Defaults are pass-through; extra clip/cull tests are
    // gated by debugActive (depthNorm.z).
    if (uniforms.depthNorm.z > 0.5) {
        let clipMin = pdata.dbg0.xyz;
        let clipMax = vec3f(pdata.dbg0.w, pdata.dbg1.x, pdata.dbg1.y);
        if (any(worldPos < clipMin) || any(worldPos > clipMax)) {
            return;
        }
        if (baseOpacity < pdata.dbg1.z || baseOpacity > pdata.dbg1.w) {
            return;
        }
        // Use the raw doubled Sigma so the size metric matches classic splatSizeRange/debug thresholds.
        let det3d = p0.x * (p1.y * p2.y - p2.x * p2.x) - p0.y * (p0.y * p2.y - p2.x * p1.x) + p1.x * (p0.y * p2.x - p1.y * p1.x);
        let splatSize = pow(abs(det3d), 1.0 / 6.0);
        if (splatSize < pdata.dbg2.x || splatSize > pdata.dbg2.y) {
            return;
        }
    }

    // Clamp opacity after debug scaling/part visibility: debug opacity can exceed 1, while the sampling
    // math below is defined on [0,1].
    var color = baseColor * pdata.dbg3.x;
    var opacity = clamp(baseOpacity * pdata.vis.x * pdata.dbg2.z * compensation, 0.0, 1.0);
    let saturate = pdata.dbg2.w > 0.5;

    // Add the higher-degree SH delta; DC is already baked into baseColor. Debug weights default to 1.
#if SH_DEGREE > 0
    {
        // SH coefficients are local, so match the classic inverseMat3(worldRot) direction transform.
        let worldRot = mat3x3f(partWorld[0].xyz, partWorld[1].xyz, partWorld[2].xyz);
        let dir = normalize(gpsInverseMat3(worldRot) * (worldPos - uniforms.camPosDeg.xyz));
        color += gpsEvalShDelta(g, dir, pdata.dbg3.y, pdata.dbg3.z, pdata.dbg3.w, pdata.dbg4.x);
    }
#endif

    // Expected sample count. Normal mode integrates -ln(1 - opacity*gaussian); opacity-saturate uses
    // uniform density -ln(1 - opacity) over the Mahalanobis R^2=8 ellipse.
    var importance : f32;
    if (saturate) {
        importance = 4.0 * GPS_TWO_PI * sqrt(det) * (-log(1.0 - min(opacity, 0.999))) * uniforms.params0.z;
    } else {
        importance = GPS_TWO_PI * sqrt(det) * gpsDilog(opacity) * uniforms.params0.z;
    }
    let res = uniforms.resNearFar.xy;
    if (importance < 1e-4) {
        return;
    }
    let seed = gpsHash2(g, u32(uniforms.params0.w));
    var numPoints = gpsPoisson(gpsPcg(seed), importance);
    // Cap so a single huge Gaussian cannot dominate the point budget.
    numPoints = min(numPoints, u32(res.x * res.y * 0.5));
    if (numPoints == 0u) {
        return;
    }

    let px = (ndc.x * 0.5 + 0.5) * res.x;
    let py = (ndc.y * 0.5 + 0.5) * res.y;

    var s : GpsScreen;
    s.pmConicXY = vec4f(px, py, conic.x, conic.y);
    s.conicZChol = vec4f(conic.z, chol0, chol1, chol2);
    s.colorOp = vec4f(color, opacity);
    // Depth key for atomicMin: normalize positive view depth over this model's frame-local span, not the
    // scene far plane, so the 16-bit key keeps useful ordering even for huge scenes.
    let dmin = uniforms.depthNorm.x;
    let dmax = uniforms.depthNorm.y;
    let dord = clamp((viewDepth - dmin) / max(dmax - dmin, 1e-6), 0.0, 1.0);
    // depth.y carries the debug opacity-saturate flag (flat disk instead of Gaussian falloff).
    s.depth = vec4u(u32(dord * 65535.0), select(0u, 1u, saturate), 0u, 0u);
    gsData[g] = s;

    weights[g] = numPoints;
}
