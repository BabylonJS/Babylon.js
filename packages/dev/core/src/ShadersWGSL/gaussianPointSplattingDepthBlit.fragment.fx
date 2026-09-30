// DepthRenderer stores (clipZ + depthValues.x) / depthValues.y (clipZ negated for reverse depth). From NDC z:
//   ndc = (m10 * vz + m14) / (m11 * vz + m15)  =>  vz = (ndc * m15 - m14) / (m10 - ndc * m11)
//   clipZ = m10 * vz + m14
// Valid for perspective and orthographic cameras.
uniform resolution: vec2f;
uniform depthValues: vec2f;
uniform projZ: vec4f;
uniform inverseProjection: mat4x4f;
uniform useInverseProjection: f32;
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

    // accumDepth is meaningless without coverage.
    if (accumBuffer[idx].w < 0.0015) {
        discard;
    }

    let ndc = accumDepth[idx];
    var clipZ : f32;
    if (uniforms.useInverseProjection > 0.5) {
        let ndcXY = (vec2f(pixel) + 0.5) / res * 2.0 - 1.0;
        let unprojected = uniforms.inverseProjection * vec4f(ndcXY, ndc, 1.0);
        clipZ = ndc / unprojected.w;
    } else {
        let denom = uniforms.projZ.x - ndc * uniforms.projZ.y;
        let vz = (ndc * uniforms.projZ.w - uniforms.projZ.z) / denom;
        clipZ = uniforms.projZ.x * vz + uniforms.projZ.z;
    }
    let signedClipZ = select(clipZ, -clipZ, uniforms.reverseDepth > 0.5);
    let metric = (signedClipZ + uniforms.depthValues.x) / uniforms.depthValues.y;

    fragmentOutputs.color = vec4f(metric, 0.0, 0.0, 1.0);
    fragmentOutputs.fragDepth = ndc;

#define CUSTOM_FRAGMENT_MAIN_END
}
