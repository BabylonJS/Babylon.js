// Gaussian Point Splatting — resolve kernel. Reads the per-pixel packed image buffer (this frame's
// nearest stochastic sample) and folds it into the progressive accumulation, then reseeds the image
// buffer sentinel for the next frame.
//
// accumBuffer holds PREMULTIPLIED color (rgb) and accumulated COVERAGE (w): running means over frames
// of (hit ? color : 0) and (hit ? 1 : 0). Averaging coverage this way makes a stochastically-hit edge
// pixel converge to a stable alpha instead of flickering, and lets the blit alpha-composite the splat
// over the scene (soft edges) rather than hard-discarding per frame. accumDepth holds the resolved
// surface depth (NDC z) for fragDepth compositing.
#include<gaussianPointSplatting>

struct GpsResolveParams {
    resolution : vec2f,
    accumFrame : f32,
    reverseZ : f32,    // unused (ndc.z is reconstructed via projZ, which encodes the convention)
    depthNorm : vec2f, // the model's view-space depth min/max this frame (matches the preprocess key)
    pad : vec2f,
    projZ : vec4f,     // projection z-row (m10, m11, m14, m15) to map view-z back to ndc.z
};

@group(0) @binding(0) var<storage, read_write> accumBuffer : array<vec4f>;
@group(0) @binding(1) var<uniform> params : GpsResolveParams;
@group(0) @binding(2) var<storage, read_write> imageBuffer : array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> accumDepth : array<f32>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let res = vec2u(params.resolution);
    if (gid.x >= res.x || gid.y >= res.y) {
        return;
    }
    let idx = gid.y * res.x + gid.x;

    let raw = atomicLoad(&imageBuffer[idx]);
    var hitColor = vec3f(0.0, 0.0, 0.0);
    var hit = 0.0;
    var depth = 1.0;
    if (raw != GPS_DEPTH_CLEAR) {
        hitColor = gpsKeyColor(raw);
        hit = 1.0;
        // Recover the view-space depth from the key, then map it to ndc.z via the projection z-row so
        // fragDepth matches the scene depth buffer (projZ encodes the reverse-Z / half-Z convention).
        let dq = f32(raw >> 16u) / 65535.0;
        let vz = params.depthNorm.x + dq * (params.depthNorm.y - params.depthNorm.x);
        depth = (params.projZ.x * vz + params.projZ.z) / (params.projZ.y * vz + params.projZ.w);
    }

    let t = select(1.0 / (params.accumFrame + 1.0), 1.0, params.accumFrame < 0.5);
    let prev = accumBuffer[idx];
    // Premultiplied color: the sample color on a hit, zero on a miss; coverage is the hit fraction.
    let newRgb = mix(prev.rgb, hitColor * hit, t);
    let newCov = mix(prev.w, hit, t);
    accumBuffer[idx] = vec4f(newRgb, newCov);

    // Keep the latest hit depth as the surface depth; reset to far on a first-frame miss.
    if (hit > 0.5) {
        accumDepth[idx] = depth;
    } else if (params.accumFrame < 0.5) {
        accumDepth[idx] = 1.0;
    }

    atomicStore(&imageBuffer[idx], GPS_DEPTH_CLEAR);
}
