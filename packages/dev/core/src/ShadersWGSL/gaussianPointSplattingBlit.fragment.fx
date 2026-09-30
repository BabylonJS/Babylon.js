// Screen UV indexing keeps the lookup independent of the render target size.
uniform resolution: vec2f;

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
    // Limitation: the whole accumulated mean is tested against the latest sample's depth, so samples that
    // scene geometry occludes still contribute to it.
    fragmentOutputs.color = vec4f(accumulated.rgb, accumulated.w);
    fragmentOutputs.fragDepth = accumDepth[idx];

#define CUSTOM_FRAGMENT_MAIN_END
}
