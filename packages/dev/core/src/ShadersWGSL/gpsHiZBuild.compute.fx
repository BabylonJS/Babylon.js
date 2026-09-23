// Gaussian Point Splatting — Hi-Z pyramid build. One dispatch per level: each destination texel is the
// MAX view-space depth (farthest surface) of its 2x2 children in the finer source level. The finest level
// (0, full resolution) is written by gpsResolve; this reduces it up. The occlusion test in gpsPreprocess
// reads the resulting pyramid (from the previous frame) to skip Gaussians fully behind nearer geometry.

struct GpsHiZParams {
    src : vec4u, // x=srcOffset (floats), y=srcWidth, z=srcHeight, w=unused
    dst : vec4u, // x=dstOffset (floats), y=dstWidth, z=dstHeight, w=unused
};

@group(0) @binding(0) var<storage, read_write> hiZ : array<f32>;
@group(0) @binding(1) var<uniform> params : GpsHiZParams;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let dstW = params.dst.y;
    let dstH = params.dst.z;
    if (gid.x >= dstW || gid.y >= dstH) {
        return;
    }
    let srcW = params.src.y;
    let srcH = params.src.z;
    let sx = gid.x * 2u;
    let sy = gid.y * 2u;

    // Max over the 2x2 children, clamping to source bounds for odd dimensions.
    let sx1 = min(sx + 1u, srcW - 1u);
    let sy1 = min(sy + 1u, srcH - 1u);
    let base = params.src.x;
    let a = hiZ[base + sy * srcW + sx];
    let b = hiZ[base + sy * srcW + sx1];
    let c = hiZ[base + sy1 * srcW + sx];
    let d = hiZ[base + sy1 * srcW + sx1];

    hiZ[params.dst.x + gid.y * dstW + gid.x] = max(max(a, b), max(c, d));
}
