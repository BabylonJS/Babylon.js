// Gaussian Point Splatting — preprocess kernel. One invocation per Gaussian: transform to view/clip
// space, project the 3D covariance to a 2D screen-space covariance (EWA), frustum cull, and cache
// the screen-space state the splat kernel needs (pixel mean, conic, Cholesky factor, color, opacity,
// depth key). Emits a stochastic point count proportional to the Gaussian's screen-space mass.
#include<gaussianPointSplatting>

@group(0) @binding(0) var<storage, read> means : array<vec4f>;
@group(0) @binding(1) var<storage, read> colorOpacity : array<u32>;
@group(0) @binding(2) var<storage, read_write> weights : array<u32>;
@group(0) @binding(3) var<storage, read_write> gsData : array<GpsScreen>;
@group(0) @binding(4) var<uniform> uniforms : GpsUniforms;
@group(0) @binding(5) var<storage, read> cov3d : array<vec4f>; // 2 vec4 per Gaussian: (S00,S01,S02,S11),(S12,S22,-,-)
@group(0) @binding(6) var<storage, read> sh : array<f32>; // dequantized SH coeffs, interleaved RGB, shDim*3 floats per Gaussian
@group(0) @binding(7) var<storage, read> parts : array<GpsPart>; // per-part live world matrix + visibility

#if SH_DEGREE > 0
// Compile-time SH coefficient count (excluding DC) for the asset's degree. Only the bands the asset
// actually has are compiled in (SH_DEGREE define), mirroring the classic rasterizer's #if SH_DEGREE.
#if SH_DEGREE == 1
const GPS_SH_DIM : u32 = 3u;
#elif SH_DEGREE == 2
const GPS_SH_DIM : u32 = 8u;
#elif SH_DEGREE == 3
const GPS_SH_DIM : u32 = 15u;
#else
const GPS_SH_DIM : u32 = 24u;
#endif

// One SH coefficient (RGB) for Gaussian at scalar-base `base`, coefficient index `j`.
fn gpsShCoeff(base : u32, j : u32) -> vec3f {
    let o = base + j * 3u;
    return vec3f(sh[o], sh[o + 1u], sh[o + 2u]);
}

// View-dependent SH color delta; DC is already baked into the base color.
fn gpsEvalShDelta(g : u32, dir : vec3f) -> vec3f {
    let base = g * GPS_SH_DIM * 3u;
    let x = dir.x;
    let y = dir.y;
    let z = dir.z;

    var res = -GPS_SH_C1 * y * gpsShCoeff(base, 0u) + GPS_SH_C1 * z * gpsShCoeff(base, 1u) - GPS_SH_C1 * x * gpsShCoeff(base, 2u);

#if SH_DEGREE > 1
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    res += GPS_SH_C2[0] * (x * y) * gpsShCoeff(base, 3u)
        + GPS_SH_C2[1] * (y * z) * gpsShCoeff(base, 4u)
        + GPS_SH_C2[2] * (2.0 * zz - xx - yy) * gpsShCoeff(base, 5u)
        + GPS_SH_C2[3] * (x * z) * gpsShCoeff(base, 6u)
        + GPS_SH_C2[4] * (xx - yy) * gpsShCoeff(base, 7u);
#endif
#if SH_DEGREE > 2
    res += GPS_SH_C3[0] * y * (3.0 * xx - yy) * gpsShCoeff(base, 8u)
        + GPS_SH_C3[1] * (x * y) * z * gpsShCoeff(base, 9u)
        + GPS_SH_C3[2] * y * (4.0 * zz - xx - yy) * gpsShCoeff(base, 10u)
        + GPS_SH_C3[3] * z * (2.0 * zz - 3.0 * xx - 3.0 * yy) * gpsShCoeff(base, 11u)
        + GPS_SH_C3[4] * x * (4.0 * zz - xx - yy) * gpsShCoeff(base, 12u)
        + GPS_SH_C3[5] * z * (xx - yy) * gpsShCoeff(base, 13u)
        + GPS_SH_C3[6] * x * (xx - 3.0 * yy) * gpsShCoeff(base, 14u);
#endif
#if SH_DEGREE > 3
    res += GPS_SH_C4[0] * x * y * (xx - yy) * gpsShCoeff(base, 15u)
        + GPS_SH_C4[1] * y * z * (3.0 * xx - yy) * gpsShCoeff(base, 16u)
        + GPS_SH_C4[2] * x * y * (7.0 * zz - 1.0) * gpsShCoeff(base, 17u)
        + GPS_SH_C4[3] * y * z * (7.0 * zz - 3.0) * gpsShCoeff(base, 18u)
        + GPS_SH_C4[4] * (zz * (35.0 * zz - 30.0) + 3.0) * gpsShCoeff(base, 19u)
        + GPS_SH_C4[5] * x * z * (7.0 * zz - 3.0) * gpsShCoeff(base, 20u)
        + GPS_SH_C4[6] * (xx - yy) * (7.0 * zz - 1.0) * gpsShCoeff(base, 21u)
        + GPS_SH_C4[7] * x * z * (xx - 3.0 * yy) * gpsShCoeff(base, 22u)
        + GPS_SH_C4[8] * (xx * (xx - 3.0 * yy) - yy * (3.0 * xx - yy)) * gpsShCoeff(base, 23u);
#endif
    return res;
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
    let partWorld = parts[partIndex].world;
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
    // rasterizer's gaussianSplatting()).
    let c0 = cov3d[2u * g];
    let c1 = cov3d[2u * g + 1u];
    let covA = c0.xyz;             // S00, S01, S02
    let covB = vec3f(c0.w, c1.x, c1.y); // S11, S12, S22
    let Vrk = mat3x3f(covA.x, covA.y, covA.z, covA.y, covB.x, covB.y, covA.z, covB.y, covB.z);

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
    var color = vec3f(f32(rgba & 0xFFu), f32((rgba >> 8u) & 0xFFu), f32((rgba >> 16u) & 0xFFu)) / 255.0;
    // Per-part visibility scales opacity (0 hides the part), matching the classic partVisibility path.
    var opacity = f32((rgba >> 24u) & 0xFFu) / 255.0 * parts[partIndex].vis.x;

    // View-dependent SH: add the higher-degree delta (DC is already baked into the base color). Only
    // compiled in when the asset has SH (SH_DEGREE define), matching the classic rasterizer.
#if SH_DEGREE > 0
    {
        // SH coefficients live in the splat's local frame, so bring the world-space eye->splat
        // direction into that frame with the inverse of the part's world rotation (matches the classic
        // vertex shader's inverseMat3(worldRot)).
        let worldRot = mat3x3f(partWorld[0].xyz, partWorld[1].xyz, partWorld[2].xyz);
        let dir = normalize(gpsInverseMat3(worldRot) * (worldPos - uniforms.camPosDeg.xyz));
        color += gpsEvalShDelta(g, dir);
    }
#endif

    // Unbiased 2D splatting: importance = 2*pi*sqrt(det) * dilog(opacity) is the integral of the
    // target point density -ln(1 - opacity*gaussian). Drawing a Poisson count and emitting all samples
    // (importance-sampled via correctedBoxMuller) makes per-pixel coverage = 1 - exp(-density) equal
    // exactly opacity*gaussian, matching the classic alpha blend. pointScale must stay 1 for that
    // exactness (it only trades noise for cost); temporal accumulation denoises.
    let importance = GPS_TWO_PI * sqrt(det) * gpsDilog(opacity) * uniforms.params0.z;
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
    s.depth = vec4u(u32(dord * 65535.0), 0u, 0u, 0u);
    gsData[g] = s;

    weights[g] = numPoints;
}
