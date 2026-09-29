// Composites the resolved Gaussian Point Splatting accumulation into the scene. accumBuffer holds
// premultiplied color (rgb) and accumulated coverage (w); the material uses premultiplied-alpha
// blending, so outputting (premultColor, coverage) composites the splats over the scene as
// premultColor + scene * (1 - coverage) — soft, converged edges matching the classic alpha blend.
// The buffer is indexed by a resolution-independent screen UV (from the fullscreen triangle) scaled
// to the accumulation buffer's own resolution, so it works even when the render target's pixel size
// differs from the compute resolution (high-DPI / scaled targets).
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

    // Negligible coverage -> nothing here; discard so the scene shows through with no depth write.
    if (accumulated.w < 0.0015) {
        discard;
    }
    // Premultiplied color + coverage as alpha. The material does not write color-pass depth; fragDepth
    // is only the value used by the depth test, matching the classic transparent path.
    fragmentOutputs.color = vec4f(accumulated.rgb, accumulated.w);
    fragmentOutputs.fragDepth = accumDepth[idx];

#define CUSTOM_FRAGMENT_MAIN_END
}
