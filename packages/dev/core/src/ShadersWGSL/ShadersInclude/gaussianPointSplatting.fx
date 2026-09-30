// Shared math for Gaussian Point Splatting.
//
// Visibility is packed as [depth:16 | (RGB565 ^ frame mask):16]; atomicMin keeps the nearest sample.

const GPS_DEPTH_CLEAR : u32 = 0xFFFFFFFFu;
// Largest valid depth code. 0xFFFF is reserved so no valid key can equal GPS_DEPTH_CLEAR.
const GPS_DEPTH_MAX_CODE : u32 = 65534u;
const GPS_TWO_PI : f32 = 6.2831853071795864;
const GPS_U32_TO_UNIT : f32 = 2.3283064365386963e-10; // 1 / 2^32

// Bucketed CDF-search table size. partTable[k] stores the owner of floor(k*total/BUCKETS), clamped
// to the last point for k == BUCKETS; gpsSplat widens the seed range by one bucket.
const GPS_PARTITION_BUCKETS : u32 = 65536u;

struct GpsUniforms {
    view : mat4x4f,
    viewProjection : mat4x4f,
    resNearFar : vec4f, // x=width, y=height, z=near, w=far
    params0 : vec4f,    // x=gaussianCount, y=kernelSize, z=pointScale, w=frameSeed
    focal : vec4f,      // x,y = focal length in render pixels; z = right-handed flag; w = orthographic flag
    camPosDeg : vec4f,  // xyz = camera world position, w = SH degree
    depthNorm : vec4f,  // x,y = the model's view-z min/max this frame; z = debugActive; w = compensation
    hiZInfo : vec4f,    // x=baseWidth, y=baseHeight, z=numLevels, w=occlusion enabled (Hi-Z pyramid)
    misc : vec4f,       // x=N, y=minPixelSize, z=color mask, w=projection flags (full=1, projected depth=2, reverse=4)
    pixelMap : vec4f,   // render px = (ndc * 0.5 + 0.5) * xy + zw (padded N-cell grid with this frame's jitter)
    projection : mat4x4f,
    inverseProjection : mat4x4f,
    projectedDepth : vec4f, // xy = nearest-first projected depth range for 16-bit keys
};

// Intersect the pixel's projective ray with a constant view-z plane. Returns NDC depth and clip w.
fn gpsProjectedDepth(inverseProjection : mat4x4f, ndcXY : vec2f, viewZ : f32) -> vec2f {
    let origin = inverseProjection * vec4f(ndcXY, 0.0, 1.0);
    let direction = inverseProjection[2];
    let depth = (viewZ * origin.w - origin.z) / (direction.z - viewZ * direction.w);
    return vec2f(depth, 1.0 / (origin.w + depth * direction.w));
}

// Differential of the full homogeneous projection, including shear and x/y-dependent clip w.
fn gpsCov2D(covA : vec3f, covB : vec3f, modelView : mat4x4f, projection : mat4x4f, clip : vec4f, pixelScale : vec2f) -> mat3x3f {
    let rowW = vec3f(projection[0].w, projection[1].w, projection[2].w);
    let rowX = vec3f(projection[0].x, projection[1].x, projection[2].x);
    let rowY = vec3f(projection[0].y, projection[1].y, projection[2].y);
    let jx = (rowX - clip.x / clip.w * rowW) * (0.5 * pixelScale.x / clip.w);
    let jy = (rowY - clip.y / clip.w * rowW) * (0.5 * pixelScale.y / clip.w);
    let J = mat3x3f(jx, jy, vec3f(0.0));
    let T = transpose(mat3x3f(modelView[0].xyz, modelView[1].xyz, modelView[2].xyz)) * J;
    let covariance = mat3x3f(covA.x, covA.y, covA.z, covA.y, covB.x, covB.y, covA.z, covB.y, covB.z);
    return transpose(T) * covariance * T;
}

// Live per-part state; non-compound meshes use one part.
struct GpsPart {
    world : mat4x4f, // part world matrix (local -> world), column-major
    vis : vec4f,     // x = part visibility (0..1); yzw unused ('meta' is a reserved WGSL keyword)
    // Per-part debug rows mirroring the classic debugger's dbgPartData; defaults are pass-through.
    dbg0 : vec4f,    // clipMin.xyz, clipMax.x
    dbg1 : vec4f,    // clipMax.y, clipMax.z, minOpacity, maxOpacity
    dbg2 : vec4f,    // minSize, maxSize, opacityScale, opacitySaturate
    dbg3 : vec4f,    // shDc, shOrder1, shOrder2, shOrder3
    dbg4 : vec4f,    // shOrder4, unused, unused, unused
};

// Same as helperFunctions' inverseMat3, kept local to avoid pulling in the whole include.
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
    depth : vec4u,     // depthKey, GPS_FLAG_* bits, sample-rect min (x | y << 16), sample-rect max (x | y << 16)
};

// GpsScreen.depth.y flags.
const GPS_FLAG_SATURATE : u32 = 1u; // debug opacity-saturate: flat disk instead of Gaussian falloff
// Samples are uniform over the on-screen sample rect and thinned by the local intensity, instead of
// importance-sampled over the whole footprint; chosen when that needs fewer points.
const GPS_FLAG_SCREEN_RECT : u32 = 2u;

// Largest per-pixel point intensity, -ln(1 - alpha), with alpha clamped so it stays finite.
const GPS_MAX_ALPHA : f32 = 0.999;
fn gpsPointIntensity(alpha : f32) -> f32 {
    return -log(1.0 - min(alpha, GPS_MAX_ALPHA));
}

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

fn gpsPackKey(depthKey : u32, colorKey : u32) -> u32 {
    return (depthKey << 16u) | (colorKey & 0xFFFFu);
}

// `mask` is the frame's color tie-break mask that was XORed into the key.
fn gpsKeyColor(key : u32, mask : u32) -> vec3f {
    return gpsUnpackRGB565((key ^ mask) & 0xFFFFu);
}


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

fn gpsBoxMuller(u1 : f32, u2 : f32) -> vec2f {
    let r = sqrt(-2.0 * log(max(1e-7, u1)));
    let theta = GPS_TWO_PI * u2;
    return vec2f(r * cos(theta), r * sin(theta));
}

// Li2(x) and inverse polynomial fits used to sample coverage without per-sample alpha rejection.

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

// Below this mean, Poisson samples use exact inverse-CDF search; the asymptotic form diverges as lambda -> 0.
const GPS_POISSON_SMALL_MEAN : f32 = 12.0;

// Poisson sample: inverse-CDF search for small means, else Giles' QN3 normal-asymptotic approximation
// (Algorithm 955, ACM TOMS 2016).
fn gpsPoisson(seed : u32, lambda : f32) -> u32 {
    let st1 = gpsPcg(seed);
    if (lambda < GPS_POISSON_SMALL_MEAN) {
        let u = gpsUnit(st1);
        var p = exp(-lambda);
        var cdf = p;
        var k = 0u;
        // Stop once the remaining tail is negligible, so f32 CDF saturation cannot run away.
        loop {
            if (u < cdf || (f32(k) > lambda && p < 1e-7)) {
                break;
            }
            k = k + 1u;
            p = p * lambda / f32(k);
            cdf = cdf + p;
        }
        return k;
    }
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
