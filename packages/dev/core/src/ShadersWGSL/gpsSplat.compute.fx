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

    let saturate = (s.depth.y & GPS_FLAG_SATURATE) != 0u;

    var st = gpsHash2(p, u32(uniforms.params0.w));
    st = gpsPcg(st);
    let u1 = gpsUnit(st);
    st = gpsPcg(st);
    let u2 = gpsUnit(st);
    var offset : vec2f;
    if ((s.depth.y & GPS_FLAG_SCREEN_RECT) != 0u) {
        // Uniform over the on-screen rect, thinned to the local intensity (accepted with lambda(x) / lambdaMax)
        // below; yields the same point process as the importance-sampled branch.
        let rectMin = vec2f(f32(s.depth.z & 0xFFFFu), f32(s.depth.z >> 16u));
        let rectMax = vec2f(f32(s.depth.w & 0xFFFFu), f32(s.depth.w >> 16u));
        offset = mix(rectMin, rectMax, vec2f(u1, u2)) - pixelMean;
    } else {
        var z : vec2f;
        if (saturate) {
            // Debug opacity-saturate: uniform sample over the Mahalanobis R^2=8 disk.
            let r = sqrt(u1) * 2.8284271; // R = sqrt(8)
            let ang = GPS_TWO_PI * u2;
            z = vec2f(r * cos(ang), r * sin(ang));
        } else {
            // Importance-sampled offset; the estimator targets opacity*gaussian without per-sample alpha rejection.
            z = gpsCorrectedBoxMuller(u1, u2, opacity);
        }
        offset = vec2f(chol.x * z.x, chol.y * z.x + chol.z * z.y);
    }

    // Match the classic quad cutoff: meshPos radius 2 => Mahalanobis radius 2*sqrt(2), i.e. d^T conic d <= 8.
    let mahalanobis2 = conic.x * offset.x * offset.x + 2.0 * conic.y * offset.x * offset.y + conic.z * offset.y * offset.y;
    if (mahalanobis2 > 8.0) {
        return;
    }

    let pixel = floor(pixelMean + offset);
    let x = i32(pixel.x);
    let y = i32(pixel.y);
    let res = vec2i(vec2u(uniforms.resNearFar.xy));
    if (x < 0 || y < 0 || x >= res.x || y >= res.y) {
        return;
    }

    // Evaluate at the continuous sample, not the pixel corner, so subpixel splats keep their coverage.
    // Debug opacity-saturate: flat alpha like the classic debug mode.
    let alpha = select(opacity * exp(-0.5 * mahalanobis2), opacity, saturate);
    // Coverage comes from sample density; only fully transparent tail samples are rejected.
    if (alpha < 0.00392) { // ~1/255
        return;
    }
    if ((s.depth.y & GPS_FLAG_SCREEN_RECT) != 0u) {
        st = gpsPcg(st);
        if (gpsUnit(st) * gpsPointIntensity(opacity) >= gpsPointIntensity(alpha)) {
            return;
        }
    }

    // Dither +/- 0.5 LSB so accumulation converges to the true color instead of banding.
    st = gpsPcg(st);
    let dr = gpsUnit(st) - 0.5;
    st = gpsPcg(st);
    let dg = gpsUnit(st) - 0.5;
    st = gpsPcg(st);
    let db = gpsUnit(st) - 0.5;
    let dithered = s.colorOp.rgb / uniforms.projectedDepth.z + vec3f(dr / 31.0, dg / 63.0, db / 31.0);

    var depthKey = s.depth.x;
    if ((u32(uniforms.misc.w) & 2u) != 0u) {
        let ndcXY = ((pixel + 0.5 - uniforms.pixelMap.zw) / uniforms.pixelMap.xy) * 2.0 - 1.0;
        let projected = gpsProjectedDepth(uniforms.inverseProjection, ndcXY, bitcast<f32>(s.depth.x));
        // Clip before selecting a winner, so a clipped foreground sample cannot hide a valid background one.
        if (!(projected.x >= 0.0 && projected.x <= 1.0 && projected.y > 0.0)) {
            return;
        }
        let ordered = select(projected.x, 1.0 - projected.x, (u32(uniforms.misc.w) & 4u) != 0u);
        let normalized = clamp((ordered - uniforms.projectedDepth.x) / max(uniforms.projectedDepth.y - uniforms.projectedDepth.x, 1e-6), 0.0, 1.0);
        depthKey = u32(normalized * f32(GPS_DEPTH_MAX_CODE));
    }
    let key = gpsPackKey(depthKey, gpsPackRGB565(dithered) ^ u32(uniforms.misc.z));
    let idx = u32(y) * u32(res.x) + u32(x);

    // Skipping losing samples before atomicMin cuts contention in dense overlap.
    if (atomicLoad(&imageBuffer[idx]) <= key) {
        return;
    }
    atomicMin(&imageBuffer[idx], key);
}
