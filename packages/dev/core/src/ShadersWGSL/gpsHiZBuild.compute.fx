// Gaussian Point Splatting — builds one max-depth Hi-Z level from the finer one.

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

    // Odd trailing rows/columns fold into the last texel; dropping them would over-cull.
    let sxEnd = select(min(sx + 1u, srcW - 1u), srcW - 1u, gid.x == dstW - 1u);
    let syEnd = select(min(sy + 1u, srcH - 1u), srcH - 1u, gid.y == dstH - 1u);
    let base = params.src.x;
    var m = 0.0;
    for (var y = sy; y <= syEnd; y = y + 1u) {
        let row = base + y * srcW;
        for (var x = sx; x <= sxEnd; x = x + 1u) {
            m = max(m, hiZ[row + x]);
        }
    }

    hiZ[params.dst.x + gid.y * dstW + gid.x] = m;
}
