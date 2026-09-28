// Shared math for Gaussian Point Splatting (WebGPU stochastic point splatting).
//
// Per-pixel visibility uses a single atomic<u32> packing [depth : high 16 bits | color : low 16
// bits as RGB565]. atomicMin keeps the nearest sample (smallest depth key) with its color riding
// along. A full-float accumulation buffer (see gpsResolve) plus per-sample color dithering (see
// gpsSplat) recovers RGB565 precision across frames.

const GPS_DEPTH_CLEAR : u32 = 0xFFFFFFFFu;
const GPS_TWO_PI : f32 = 6.2831853071795864;
const GPS_U32_TO_UNIT : f32 = 2.3283064365386963e-10; // 1 / 2^32

// Point->Gaussian acceleration table resolution: partition[k] holds the Gaussian owning point
// k*total/GPS_PARTITION_BUCKETS, so the splat kernel seeds its CDF binary search from a narrow range
// instead of searching all Gaussians (see gpsPartition / gpsSplat). The table has BUCKETS+1 entries.
const GPS_PARTITION_BUCKETS : u32 = 65536u;

struct GpsUniforms {
    view : mat4x4f,
    viewProjection : mat4x4f,
    resNearFar : vec4f, // x=width, y=height, z=near, w=far
    params0 : vec4f,    // x=gaussianCount, y=kernelSize, z=pointScale, w=frameSeed
    focal : vec4f,      // x,y = focal length in pixels; z unused; w = orthographic flag
    camPosDeg : vec4f,  // xyz = camera world position, w = SH degree
    depthNorm : vec4f,  // x,y = the model's view-z min/max this frame; z = debugActive; w = compensation
    hiZInfo : vec4f,    // x=baseWidth, y=baseHeight, z=numLevels, w=occlusion enabled (Hi-Z pyramid)
    misc : vec4f,       // xy = temporal-upsampling jitter (NDC); zw reserved
};

// One compound part's live transform. Kept out of the covariance (which is baked once, in local
// space) because parts move at runtime: the world transform is applied per frame in the shader,
// exactly like the classic rasterizer's per-part `partWorld`. A non-compound mesh is a single part.
struct GpsPart {
    world : mat4x4f, // part world matrix (local -> world), column-major
    vis : vec4f,     // x = part visibility (0..1); yzw unused ('meta' is a reserved WGSL keyword)
    // Per-part debug LUT rows, mirroring the classic debugger's dbgPartData (pass-through defaults when
    // debug is inactive). Consumed only when the debugActive flag is set.
    dbg0 : vec4f,    // clipMin.xyz, clipMax.x
    dbg1 : vec4f,    // clipMax.y, clipMax.z, minOpacity, maxOpacity
    dbg2 : vec4f,    // minSize, maxSize, opacityScale, opacitySaturate
    dbg3 : vec4f,    // shDc, shOrder1, shOrder2, shOrder3
    dbg4 : vec4f,    // shOrder4, unused, unused, unused
};

// Inverse of a 3x3 matrix. Identical to core's helperFunctions inverseMat3 (kept local to avoid
// pulling the whole include into a compute shader), so the SH view direction is brought into the
// part's local frame exactly as the classic vertex shader does.
fn gpsInverseMat3(inMatrix : mat3x3f) -> mat3x3f {
    let a00 = inMatrix[0][0]; let a01 = inMatrix[0][1]; let a02 = inMatrix[0][2];
    let a10 = inMatrix[1][0]; let a11 = inMatrix[1][1]; let a12 = inMatrix[1][2];
    let a20 = inMatrix[2][0]; let a21 = inMatrix[2][1]; let a22 = inMatrix[2][2];
    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;
    let det = a00 * b01 + a01 * b11 + a02 * b21;
    return mat3x3f(b01 / det, (-a22 * a01 + a02 * a21) / det, (a12 * a01 - a02 * a11) / det,
            b11 / det, (a22 * a00 - a02 * a20) / det, (-a12 * a00 + a02 * a10) / det,
            b21 / det, (-a21 * a00 + a01 * a20) / det, (a11 * a00 - a01 * a10) / det);
}


// Per-Gaussian screen-space state produced by gpsPreprocess and consumed by gpsSplat (64 bytes).
struct GpsScreen {
    pmConicXY : vec4f, // pixelMean.x, pixelMean.y, conic.x, conic.y
    conicZChol : vec4f, // conic.z, chol0, chol1, chol2
    colorOp : vec4f,   // linear color r, g, b, opacity
    depth : vec4u,     // depthKey, opacitySaturate flag (debug), unused, unused
};

fn gpsGetPixelMean(s : GpsScreen) -> vec2f { return s.pmConicXY.xy; }
fn gpsGetConic(s : GpsScreen) -> vec3f { return vec3f(s.pmConicXY.z, s.pmConicXY.w, s.conicZChol.x); }
fn gpsGetChol(s : GpsScreen) -> vec3f { return s.conicZChol.yzw; }

fn gpsPackRGB565(c : vec3f) -> u32 {
    let r = u32(clamp(c.r, 0.0, 1.0) * 31.0 + 0.5);
    let g = u32(clamp(c.g, 0.0, 1.0) * 63.0 + 0.5);
    let b = u32(clamp(c.b, 0.0, 1.0) * 31.0 + 0.5);
    return (r << 11u) | (g << 5u) | b;
}

fn gpsUnpackRGB565(v : u32) -> vec3f {
    return vec3f(
        f32((v >> 11u) & 31u) / 31.0,
        f32((v >> 5u) & 63u) / 63.0,
        f32(v & 31u) / 31.0
    );
}

// Depth in the high 16 bits so atomicMin over the packed key resolves the nearest sample.
fn gpsPackKey(depthKey : u32, colorKey : u32) -> u32 {
    return (depthKey << 16u) | (colorKey & 0xFFFFu);
}

fn gpsKeyColor(key : u32) -> vec3f {
    return gpsUnpackRGB565(key & 0xFFFFu);
}

// --- Random sampling (PCG hash) ---

fn gpsPcg(vIn : u32) -> u32 {
    let state = vIn * 747796405u + 2891336453u;
    let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
}

fn gpsHash2(a : u32, b : u32) -> u32 {
    return gpsPcg(a ^ gpsPcg(b));
}

fn gpsUnit(state : u32) -> f32 {
    return f32(state) * GPS_U32_TO_UNIT;
}

// Standard normal pair from two uniforms.
fn gpsBoxMuller(u1 : f32, u2 : f32) -> vec2f {
    let r = sqrt(-2.0 * log(max(1e-7, u1)));
    let theta = GPS_TWO_PI * u2;
    return vec2f(r * cos(theta), r * sin(theta));
}

// --- Unbiased 2D splatting (paper's method) ---
// Dilogarithm Li2(x) and its inverse (polynomial fits, from the reference), used to importance-sample
// the Gaussian so that emitting all points and taking the atomicMin coverage yields exactly
// opacity*gaussian per pixel (matching alpha blending), with no per-sample stochastic rejection.

const GPS_LI2_MAX : f32 = 1.6449340668482264; // Li2(1) = pi^2 / 6

fn gpsDilog(x : f32) -> f32 {
    var y = -6.09201442e-01;
    y = y * x + 1.79126616e+00;
    y = y * x + -2.14953223e+00;
    y = y * x + 1.26304372e+00;
    y = y * x + -4.59069895e-01;
    y = y * x + -1.87417414e-01;
    y = y * x + 1.99603130e+00;
    y = y * x + 5.99669467e-05;
    let s = 1.0 - x;
    if (s > 0.0) {
        y += s * log(max(s, 1e-37));
    }
    return y;
}

fn gpsInvDilog(x : f32) -> f32 {
    let t = min(x / GPS_LI2_MAX, 1.0);
    var y = -1.27463503e+01;
    y = y * t + 5.88993459e+01;
    y = y * t + -1.16025780e+02;
    y = y * t + 1.26945827e+02;
    y = y * t + -8.43108826e+01;
    y = y * t + 3.48799862e+01;
    y = y * t + -8.89606235e+00;
    y = y * t + 1.38640936e+00;
    y = y * t + -7.80640876e-01;
    y = y * t + 1.64841888e+00;
    y = y * t + -2.82836687e-05;
    return y;
}

// Importance-sampled Gaussian offset (in standard-normal units) for opacity `alpha`.
fn gpsCorrectedBoxMuller(u1 : f32, u2 : f32, alpha : f32) -> vec2f {
    var a = (1.0 / max(alpha, 1e-37)) * gpsInvDilog((1.0 - u1) * gpsDilog(alpha));
    a = clamp(a, 1e-37, 1.0);
    let r = sqrt(max(-2.0 * log(a), 0.0));
    let theta = GPS_TWO_PI * u2;
    return vec2f(r * cos(theta), r * sin(theta));
}

// Poisson sample via Giles' QN3 normal-asymptotic approximation (Algorithm 955, ACM TOMS 42(1),
// 2016), for all lambda — matching the reference implementation.
fn gpsPoisson(seed : u32, lambda : f32) -> u32 {
    let st1 = gpsPcg(seed);
    let st2 = gpsPcg(st1);
    let w = gpsBoxMuller(gpsUnit(st1), gpsUnit(st2)).x;
    let w2 = w * w;
    let w3 = w2 * w;
    let w4 = w2 * w2;
    let s = sqrt(lambda);
    let invS = 1.0 / s;
    let invL = 1.0 / lambda;
    var kf = lambda + s * w + (w2 - 1.0) / 6.0;
    kf += invS * (-(1.0 / 36.0) * w - (1.0 / 72.0) * w3);
    kf += invL * (-(8.0 / 405.0) + (7.0 / 810.0) * w2 + (1.0 / 270.0) * w4);
    return u32(max(i32(round(kf)), 0));
}

// exp(-1/2 d^T conic d), conic = inverse 2D covariance packed as (c00, c01, c11).
fn gpsGaussianValue(conic : vec3f, d : vec2f) -> f32 {
    let power = -0.5 * (conic.x * d.x * d.x + conic.z * d.y * d.y) - conic.y * d.x * d.y;
    return exp(power);
}
