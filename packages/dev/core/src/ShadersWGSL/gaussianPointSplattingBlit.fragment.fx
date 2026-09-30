// Screen UV indexing keeps the lookup independent of the render target size.
// With logarithmic depth, NDC z is converted back to clip w (vz = (ndc * m15 - m14) / (m10 - ndc * m11),
// w = m11 * vz + m15) and re-encoded like logDepthFragment. logarithmicDepthConstant <= 0 disables it.
uniform resolution: vec2f;
uniform projZ: vec4f;
uniform logarithmicDepthConstant: f32;

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
    let accumulated = accumBuffer[idx];

    if (accumulated.w < 0.0015) {
        discard;
    }
    // The color pass does not write depth; fragDepth is only the depth-test value.
    // Limitation: the whole accumulated mean is tested against the latest sample's depth, so where scene geometry
    // intersects the splats, occluded splats can bleed through or visible ones drop out (see pointSplattingRenderMode).
    // Mostly opaque splats show no visible artifacts.
    fragmentOutputs.color = vec4f(accumulated.rgb, accumulated.w);
    var depth = accumDepth[idx];
    if (uniforms.logarithmicDepthConstant > 0.0) {
        let vz = (depth * uniforms.projZ.w - uniforms.projZ.z) / (uniforms.projZ.x - depth * uniforms.projZ.y);
        let clipW = uniforms.projZ.y * vz + uniforms.projZ.w;
        depth = log2(max(0.000001, 1.0 + clipW)) * uniforms.logarithmicDepthConstant * 0.5;
    }
    fragmentOutputs.fragDepth = depth;

#define CUSTOM_FRAGMENT_MAIN_END
}
