// Gaussian Point Splatting — one invocation per emitted point. Finds the owning Gaussian through the
// CDF, samples its covariance, quantizes color with dithering, and depth-tests with packed atomicMin.
#include<gaussianPointSplatting>

@group(0) @binding(0) var<storage, read> cdf : array<u32>;
@group(0) @binding(1) var<storage, read> gsData : array<GpsScreen>;
@group(0) @binding(2) var<storage, read_write> imageBuffer : array<atomic<u32>>;
@group(0) @binding(3) var<uniform> uniforms : GpsUniforms;
@group(0) @binding(4) var<storage, read> pointCount : array<u32>;
@group(0) @binding(5) var<storage, read> partTable : array<u32>; // bucket->Gaussian search table

// Largest g in [loInit, hiInit) with cdf[g] <= p; choosing the largest handles zero-weight Gaussians.
fn gpsFindGaussian(p : u32, loInit : u32, hiInit : u32) -> u32 {
    var lo = loInit;
    var hi = hiInit;
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
    // Linear point index from a 2D grid tiled at WebGPU's 65535-workgroup-per-dimension limit.
    let p = gid.y * 65535u * 256u + gid.x;
    let total = pointCount[0];
    if (p >= total) {
        return;
    }

    let count = u32(uniforms.params0.x);
    // Seed from the bucket table and widen +/-1 bucket to cover f32 bucket rounding.
    let bucket = min(u32(max(f32(p) / f32(total) * f32(GPS_PARTITION_BUCKETS), 0.0)), GPS_PARTITION_BUCKETS - 1u);
    let loB = select(bucket - 1u, 0u, bucket == 0u);
    let hiB = min(bucket + 2u, GPS_PARTITION_BUCKETS);
    let g = gpsFindGaussian(p, partTable[loB], min(partTable[hiB] + 1u, count));
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
        // Debug opacity-saturate: uniform sample over the Mahalanobis R^2=8 disk; no cutoff needed.
        let r = sqrt(u1) * 2.8284271; // R = sqrt(8)
        let ang = GPS_TWO_PI * u2;
        z = vec2f(r * cos(ang), r * sin(ang));
    } else {
        // Importance-sampled offset; before the classic cutoff below, the estimator targets
        // opacity*gaussian without per-sample alpha rejection.
        z = gpsCorrectedBoxMuller(u1, u2, opacity);
        // Match the classic quad cutoff: meshPos radius 2 => Mahalanobis radius 2*sqrt(2).
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
    // Debug opacity-saturate: flat alpha like the classic debug mode; sampling used a uniform disk above.
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

    // Depth pre-check: skip the atomicMin when this sample cannot beat the current nearest. In dense
    // overlap most samples lose, so filtering them out cuts atomic contention enough to outweigh the
    // load — keep this ahead of the write.
    if (atomicLoad(&imageBuffer[idx]) <= key) {
        return;
    }
    atomicMin(&imageBuffer[idx], key);
}
