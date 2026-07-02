// Gaussian Splatting GPU culling - flag pass (post-sort).
//
// For each already-sorted render slot, fetches the splat center, projects it to clip space with the same
// local->clip matrix and the same 1.2*w frustum bounds the vertex shader uses (gaussianSplatting.fx), and
// writes a visibility flag. Because the test matches the vertex shader exactly, culled splats are precisely
// those the shader would clip anyway (no edge popping). The flag is written to two buffers: one preserved for
// the compaction pass, one to be exclusive-scanned into output offsets.

struct Params {
    count : u32,
    pad0 : u32,
    pad1 : u32,
    pad2 : u32,
    clip0 : vec4f,
    clip1 : vec4f,
    clip2 : vec4f,
    clip3 : vec4f,
};

@group(0) @binding(0) var<storage, read> positions : array<f32>;
@group(0) @binding(1) var<storage, read> sortedIndex : array<f32>;
@group(0) @binding(2) var<storage, read_write> flag : array<u32>;
@group(0) @binding(3) var<storage, read_write> offsets : array<u32>;
@group(0) @binding(4) var<uniform> params : Params;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let i = gid.x;
    if (i >= params.count) {
        return;
    }
    let src = u32(sortedIndex[i] + 0.5);
    let o = src * 4u;
    // clip = M * (x,y,z,1) built from the local->clip matrix columns.
    let clipPos = params.clip0 * positions[o] + params.clip1 * positions[o + 1u] + params.clip2 * positions[o + 2u] + params.clip3;
    let bounds = 1.2 * clipPos.w;
    var visible = 1u;
    if (clipPos.z < 0.0 || clipPos.x < -bounds || clipPos.x > bounds || clipPos.y < -bounds || clipPos.y > bounds) {
        visible = 0u;
    }
    flag[i] = visible;
    offsets[i] = visible;
}
