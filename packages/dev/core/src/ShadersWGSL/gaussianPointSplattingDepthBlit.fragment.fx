// Writes resolved point-splatting depth into a DepthRenderer map. accumBuffer.w rejects empty pixels;
// accumDepth stores the resolved nearest-surface NDC z.
//
// DepthRenderer stores (clipZ + depthValues.x) / depthValues.y in red (negating clipZ for reverse depth),
// matching the classic Gaussian Splatting depth material. Recover clipZ from NDC z with:
//   ndc = (m10 * vz + m14) / (m11 * vz + m15)  =>  vz = (ndc * m15 - m14) / (m10 - ndc * m11)
//   clipZ = m10 * vz + m14
// Valid for both perspective (m11 = +/-1, m15 = 0) and orthographic (m11 = 0, m15 = 1) cameras.
//
// fragDepth uses raw NDC z so the blit z-tests against ordinary meshes already in the depth map.
uniform resolution: vec2f;
uniform depthValues: vec2f;
uniform projZ: vec4f;
uniform reverseDepth: f32;

varying vScreenUv: vec2f;

var<storage, read> accumBuffer : array<vec4f>;
var<storage, read> accumDepth : array<f32>;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

    let res = uniforms.resolution;
    let uv = clamp(fragmentInputs.vScreenUv, vec2f(0.0, 0.0), vec2f(0.99999, 0.99999));
    let pixel = vec2u(uv * res);
    let idx = pixel.y * u32(res.x) + pixel.x;

    // No coverage -> no surface here; discard so the map keeps whatever ordinary geometry wrote (the
    // accumDepth miss value of 1.0 is meaningless and must never reach the map).
    if (accumBuffer[idx].w < 0.0015) {
        discard;
    }

    let ndc = accumDepth[idx];
    let denom = uniforms.projZ.x - ndc * uniforms.projZ.y;
    let vz = (ndc * uniforms.projZ.w - uniforms.projZ.z) / denom;
    let clipZ = uniforms.projZ.x * vz + uniforms.projZ.z;
    let signedClipZ = select(clipZ, -clipZ, uniforms.reverseDepth > 0.5);
    let metric = (signedClipZ + uniforms.depthValues.x) / uniforms.depthValues.y;

    fragmentOutputs.color = vec4f(metric, 0.0, 0.0, 1.0);
    fragmentOutputs.fragDepth = ndc;

#define CUSTOM_FRAGMENT_MAIN_END
}
