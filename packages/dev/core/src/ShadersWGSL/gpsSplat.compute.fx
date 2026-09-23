// Gaussian Point Splatting — splat kernel. Dispatched indirectly with one invocation per point (the
// scanned total). Each invocation finds its owning Gaussian by binary-searching the CDF (no scatter
// pass, no per-point index buffer), samples a stochastic offset in the Gaussian's covariance frame,
// rejects it against the Gaussian's footprint, dithers the color, and writes it with a packed
// atomicMin depth-min.
#include<gaussianPointSplatting>

@group(0) @binding(0) var<storage, read> cdf : array<u32>;
@group(0) @binding(1) var<storage, read> gsData : array<GpsScreen>;
@group(0) @binding(2) var<storage, read_write> imageBuffer : array<atomic<u32>>;
@group(0) @binding(3) var<uniform> uniforms : GpsUniforms;
@group(0) @binding(4) var<storage, read> pointCount : array<u32>;

// Largest g in [0, count) with cdf[g] <= p. Zero-weight Gaussians share a CDF value with the next
// one, so picking the largest index always lands on the point's real owner.
fn gpsFindGaussian(p : u32, count : u32) -> u32 {
    var lo = 0u;
    var hi = count;
    loop {
        if (lo + 1u >= hi) {
            break;
        }
        let mid = (lo + hi) >> 1u;
        if (cdf[mid] <= p) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    return lo;
}

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    // Linear point index from the 2D dispatch grid: rows are tiled at the 65535-workgroup limit
    // (65535 * 256 = 16776960 threads per row) so the total point count can exceed one dimension.
    let p = gid.y * 16776960u + gid.x;
    if (p >= pointCount[0]) {
        return;
    }

    let count = u32(uniforms.params0.x);
    let g = gpsFindGaussian(p, count);
    let s = gsData[g];

    let pixelMean = gpsGetPixelMean(s);
    let conic = gpsGetConic(s);
    let chol = gpsGetChol(s);
    let opacity = s.colorOp.w;

    // Stochastic sample: Box-Muller normal, transformed by the Cholesky factor of the 2D covariance.
    var st = gpsHash2(p, u32(uniforms.params0.w));
    st = gpsPcg(st);
    let u1 = gpsUnit(st);
    st = gpsPcg(st);
    let u2 = gpsUnit(st);
    // Offset in the covariance frame (standard-normal / Mahalanobis units).
    var z : vec2f;
    if (s.depth.y == 1u) {
        // Debug opacity-saturate: sample UNIFORMLY over the Mahalanobis R^2=8 ellipse (flat disk). r =
        // sqrt(u1)*R gives a uniform areal distribution; r <= R, so no cutoff is needed.
        let r = sqrt(u1) * 2.8284271; // R = sqrt(8)
        let ang = GPS_TWO_PI * u2;
        z = vec2f(r * cos(ang), r * sin(ang));
    } else {
        // Importance-sampled offset (unbiased 2D splatting): with the Poisson count in preprocess and no
        // per-sample rejection, the atomicMin coverage converges to exactly opacity*gaussian.
        z = gpsCorrectedBoxMuller(u1, u2, opacity);
        // Match the classic quad cutoff: meshPos in [-2,2] with a circular discard at |meshPos|>=2,
        // i.e. mahalanobis 2*sqrt(2) sigma. Our z is in standard-normal (mahalanobis) units, so |z|<2.83.
        if (dot(z, z) > 8.0) {
            return;
        }
    }
    let offset = vec2f(chol.x * z.x, chol.y * z.x + chol.z * z.y);

    let pixel = floor(pixelMean + offset);
    let x = i32(pixel.x);
    let y = i32(pixel.y);
    let res = vec2i(vec2u(uniforms.resNearFar.xy));
    if (x < 0 || y < 0 || x >= res.x || y >= res.y) {
        return;
    }

    // Hard-reject only fully-transparent tail samples (cleanup); the coverage is set by the sample
    // DENSITY (importance sampling), not by a per-sample stochastic emission.
    let d = pixelMean - pixel;
    // Debug opacity-saturate (s.depth.y): drop the Gaussian falloff so the footprint reads as a flat
    // disk. Approximate in the stochastic model (sample density is still Gaussian), but visibly fills
    // the splat as the classic's flat-disk debug does.
    let alpha = select(opacity * gpsGaussianValue(conic, d), opacity, s.depth.y == 1u);
    if (alpha < 0.00392) { // ~1/255
        return;
    }

    // Dither the color +/- 0.5 LSB (per 565 channel) before quantizing, so the full-float
    // accumulation converges to the true color instead of banding.
    st = gpsPcg(st);
    let dr = gpsUnit(st) - 0.5;
    st = gpsPcg(st);
    let dg = gpsUnit(st) - 0.5;
    st = gpsPcg(st);
    let db = gpsUnit(st) - 0.5;
    let dithered = s.colorOp.rgb + vec3f(dr / 31.0, dg / 63.0, db / 31.0);

    let key = gpsPackKey(s.depth.x, gpsPackRGB565(dithered));
    let idx = u32(y) * u32(res.x) + u32(x);

    // Cheap non-atomic pre-check: skip the atomic when this sample cannot be the nearest.
    if (atomicLoad(&imageBuffer[idx]) <= key) {
        return;
    }
    atomicMin(&imageBuffer[idx], key);
}
