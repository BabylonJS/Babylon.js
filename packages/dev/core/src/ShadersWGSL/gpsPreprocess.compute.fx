// Gaussian Point Splatting — preprocess kernel. One invocation per Gaussian: transform to view/clip
// space, project the 3D covariance to a 2D screen-space covariance (EWA), frustum cull, and cache
// the screen-space state the splat kernel needs (pixel mean, conic, Cholesky factor, color, opacity,
// depth key). Emits a stochastic point count proportional to the Gaussian's screen-space mass.
#include<gaussianPointSplatting>
#include<gaussianSplattingSH>

@group(0) @binding(0) var<storage, read> means : array<vec4f>;
@group(0) @binding(1) var<storage, read> colorOpacity : array<u32>;
@group(0) @binding(2) var<storage, read_write> weights : array<u32>;
@group(0) @binding(3) var<storage, read_write> gsData : array<GpsScreen>;
@group(0) @binding(4) var<uniform> uniforms : GpsUniforms;
@group(0) @binding(5) var<storage, read> cov3d : array<u32>; // 4 u32/Gaussian: 3 f16 pairs (Sigma/factor) + f32 factor
@group(0) @binding(6) var<storage, read> sh : array<u32>; // 8-bit-quantized SH coeffs packed 4/word, GPS_SH_WORDS per Gaussian
@group(0) @binding(7) var<storage, read> parts : array<GpsPart>; // per-part live world matrix + visibility

#if SH_DEGREE > 0
// Compile-time count of u32 words per Gaussian holding this degree's 8-bit SH coefficients (3 scalar
// bytes per coeff, 4 bytes per word). Only the bands the asset has are compiled in (SH_DEGREE define),
// mirroring the classic rasterizer's #if SH_DEGREE. Words = ceil(shDim*3 / 4).
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

// View-dependent SH color delta. Assembles this Gaussian's coefficients from the packed buffer, then
// evaluates them with the shared computeColorFromSHDegree (the identical basis math the classic
// rasterizer uses). DC (coeffs[0]) stays zero — it is already baked into the base color, so only the
// higher-order delta is returned. The per-band weights so1..so4 drive the SH-order debug toggles.
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
    let g = gid.x;
    let count = u32(uniforms.params0.x);
    if (g >= count) {
        return;
    }
    weights[g] = 0u;

    let mean = means[g].xyz;
    // The part this splat belongs to (0 for a non-compound mesh). Its world matrix is applied here,
    // per frame, so runtime transforms (gizmo, part add/remove) move the splats without re-baking.
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
    let ndc = clip.xyz / clip.w;
    if (ndc.x < -1.3 || ndc.x > 1.3 || ndc.y < -1.3 || ndc.y > 1.3) {
        return;
    }

    // EWA projection of the 3D covariance to 2D screen space (same construction as the classic
    // rasterizer's gaussianSplatting()). The 6 unique Sigma components are stored as f16 pairs
    // normalized by a per-splat factor (matching the classic's covA/covB + center.w scheme), so f16
    // keeps full precision regardless of splat scale; rescale by the factor here.
    let covFactor = bitcast<f32>(cov3d[4u * g + 3u]);
    let p0 = unpack2x16float(cov3d[4u * g + 0u]) * covFactor; // S00, S01
    let p1 = unpack2x16float(cov3d[4u * g + 1u]) * covFactor; // S02, S11
    let p2 = unpack2x16float(cov3d[4u * g + 2u]) * covFactor; // S12, S22
    let Vrk = mat3x3f(p0.x, p0.y, p1.x, p0.y, p1.y, p2.x, p1.x, p2.x, p2.y);

    let focal = uniforms.focal.xy;
    let J = mat3x3f(
        focal.x / camspace.z, 0.0, -(focal.x * camspace.x) / (camspace.z * camspace.z),
        0.0, focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z),
        0.0, 0.0, 0.0
    );
    // Fold the part's world transform into the projection the same way the classic rasterizer does:
    // modelView = view * partWorld, then T = transpose(modelView3x3) * J. This is algebraically the
    // same 2D covariance as baking A*Sigma*A^T on the CPU, but the world stays out of the stored
    // (local) covariance so parts can move each frame.
    let modelView = uniforms.view * partWorld;
    let T = transpose(mat3x3f(modelView[0].xyz, modelView[1].xyz, modelView[2].xyz)) * J;
    var cov2d = transpose(T) * Vrk * T;

    // Low-pass (antialiasing) dilation, matching the classic rasterizer's kernelSize. The screen-scale
    // that cancels the classic quad's invViewport is baked into the covariance at load (see the mesh's
    // updateData), so cov2d needs no per-frame scaling here.
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

    // Conic = inverse 2D covariance; Cholesky L (lower) so a sample = mean + L * N(0,1).
    let invDet = 1.0 / det;
    let conic = vec3f(cc * invDet, -b * invDet, a * invDet);
    let chol0 = sqrt(a);
    let chol1 = b / chol0;
    let chol2 = sqrt(max(0.0, cc - chol1 * chol1));

    let rgba = colorOpacity[g];
    let baseColor = vec3f(f32(rgba & 0xFFu), f32((rgba >> 8u) & 0xFFu), f32((rgba >> 16u) & 0xFFu)) / 255.0;
    let baseOpacity = f32((rgba >> 24u) & 0xFFu) / 255.0;

    // Per-part debug knobs, mirroring the classic GaussianSplattingDebugger (dbgPartData). The rows are
    // pass-through defaults when debug is off, so opacity-scale / SH weights apply branchlessly; the
    // clip / cull tests (which need extra work) are gated behind the debugActive flag (depthNorm.z).
    if (uniforms.depthNorm.z > 0.5) {
        let clipMin = pdata.dbg0.xyz;
        let clipMax = vec3f(pdata.dbg0.w, pdata.dbg1.x, pdata.dbg1.y);
        if (any(worldPos < clipMin) || any(worldPos > clipMax)) {
            return;
        }
        if (baseOpacity < pdata.dbg1.z || baseOpacity > pdata.dbg1.w) {
            return;
        }
        // Splat size = pow(|det(Sigma3d)|, 1/6), the geometric mean of the principal radii.
        let det3d = p0.x * (p1.y * p2.y - p2.x * p2.x) - p0.y * (p0.y * p2.y - p2.x * p1.x) + p1.x * (p0.y * p2.x - p1.y * p1.x);
        let splatSize = pow(abs(det3d), 1.0 / 6.0);
        if (splatSize < pdata.dbg2.x || splatSize > pdata.dbg2.y) {
            return;
        }
    }

    // Opacity scale (dbg2.z) and SH DC weight (dbg3.x) are 1.0 when debug is off. Part visibility folds
    // into opacity too, matching the classic partVisibility path. Clamp to [0,1]: the debug opacity
    // scale can exceed 1 (0-5 slider), and dilog/correctedBoxMuller below are only defined on [0,1] —
    // the classic just lets alpha blending saturate, so clamping here is the stochastic equivalent.
    var color = baseColor * pdata.dbg3.x;
    var opacity = clamp(baseOpacity * pdata.vis.x * pdata.dbg2.z, 0.0, 1.0);
    let saturate = pdata.dbg2.w > 0.5;

    // View-dependent SH: add the higher-degree delta (DC is already baked into the base color). Only
    // compiled in when the asset has SH (SH_DEGREE define), matching the classic rasterizer. The
    // per-band weights (dbg3.yzw, dbg4.x) drive the SH-order debug toggles (all 1.0 when off).
#if SH_DEGREE > 0
    {
        // SH coefficients live in the splat's local frame, so bring the world-space eye->splat
        // direction into that frame with the inverse of the part's world rotation (matches the classic
        // vertex shader's inverseMat3(worldRot)).
        let worldRot = mat3x3f(partWorld[0].xyz, partWorld[1].xyz, partWorld[2].xyz);
        let dir = normalize(gpsInverseMat3(worldRot) * (worldPos - uniforms.camPosDeg.xyz));
        color += gpsEvalShDelta(g, dir, pdata.dbg3.y, pdata.dbg3.z, pdata.dbg3.w, pdata.dbg4.x);
    }
#endif

    // Point budget (expected sample count) that makes per-pixel coverage match the target.
    // Normal (unbiased 2D splatting): coverage = opacity*gaussian, so importance = 2*pi*sqrt(det) *
    //   dilog(opacity) (the integral of the density -ln(1 - opacity*gaussian)); samples are
    //   Gaussian-distributed (correctedBoxMuller) in the splat kernel.
    // Debug opacity-saturate: coverage = opacity FLAT across the footprint (a solid disk). That needs a
    //   uniform density -ln(1 - opacity) over the Mahalanobis-R^2=8 ellipse (area = pi*R^2*sqrt(det) =
    //   4*(2*pi)*sqrt(det)); the splat kernel then samples uniformly in that ellipse.
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
    // Depth key: order so the NEAREST sample has the smallest key (atomicMin keeps it). Under
    // reverse-Z (near = large NDC z) invert so nearest still maps to the smallest key. The true NDC z
    // is recovered in resolve for fragDepth compositing against the (same-convention) depth buffer.
    // Normalize the depth key to the model's own NDC-z span this frame (not the scene's [0,1]).
    // The scene far plane can be huge, so raw NDC z gives the model only a few hundred of the 16-bit
    // key's levels; hundreds of splats then collide on one level and the atomicMin can no longer pick
    // the nearest, which averages overlapping splats and blurs fine detail. Remapping to the model's
    // span restores the full 16-bit ordering resolution.
    let dmin = uniforms.depthNorm.x;
    let dmax = uniforms.depthNorm.y;
    let dlin = clamp((ndc.z - dmin) / max(dmax - dmin, 1e-6), 0.0, 1.0);
    let dord = select(dlin, 1.0 - dlin, uniforms.focal.z > 0.5);
    // depth.y carries the debug opacity-saturate flag (flat disk instead of Gaussian falloff).
    s.depth = vec4u(u32(dord * 65535.0), select(0u, 1u, saturate), 0u, 0u);
    gsData[g] = s;

    weights[g] = numPoints;
}
