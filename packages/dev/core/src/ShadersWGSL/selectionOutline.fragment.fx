// samplers
var maskSamplerSampler: sampler;
var maskSampler: texture_2d<f32>;
var depthSamplerSampler: sampler;
var depthSampler: texture_2d<f32>;

// varyings
varying vUV: vec2f;

// uniforms
uniform screenSize: vec2f;
uniform outlineColor: vec3f;
uniform outlineThickness: f32;
uniform occlusionStrength: f32;
uniform occlusionThreshold: f32;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    
#define CUSTOM_FRAGMENT_MAIN_BEGIN

    let texelSize: vec2f = 1.0 / uniforms.screenSize;
    let sampleOffset: vec2f = texelSize * uniforms.outlineThickness;

    // sample mask texture for edge detection and depth-based occlusion
    // sample mask texture at center and neighboring pixels
#if defined(OUTLINELAYER_SAMPLING_TRIDIRECTIONAL) || defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    let maskTopCenter: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(0.0, sampleOffset.y), 0.0).rg;
    let maskTopRight: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + sampleOffset, 0.0).rg;

    let maskMiddleCenter: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV, 0.0).rg;
    let maskMiddleRight: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(sampleOffset.x, 0.0), 0.0).rg;
#endif
#if defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    let maskTopLeft: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(-sampleOffset.x, sampleOffset.y), 0.0).rg;

    let maskMiddleLeft: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(-sampleOffset.x, 0.0), 0.0).rg;

    let maskBottomRight: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(sampleOffset.x, -sampleOffset.y), 0.0).rg;
    let maskBottomCenter: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(0.0, -sampleOffset.y), 0.0).rg;
    let maskBottomLeft: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(-sampleOffset.x, -sampleOffset.y), 0.0).rg;
#endif

    // compute outline mask
#ifdef OUTLINELAYER_SAMPLING_TRIDIRECTIONAL
    // gradient magnitude edge detection
    let gradient: vec3f = vec3f(
        maskMiddleCenter.r - maskMiddleRight.r,
        maskMiddleCenter.r - maskTopCenter.r,
        maskMiddleCenter.r - maskTopRight.r
    );
    let edgeStrength: f32 = length(gradient);
#elif defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    let gradientX: f32 =
        (maskTopLeft.r + 2.0 * maskMiddleLeft.r + maskBottomLeft.r) -
        (maskTopRight.r + 2.0 * maskMiddleRight.r + maskBottomRight.r);
    let gradientY: f32 =
        (maskBottomLeft.r + 2.0 * maskBottomCenter.r + maskBottomRight.r) -
        (maskTopLeft.r + 2.0 * maskTopCenter.r + maskTopRight.r);
    let edgeStrength: f32 = length(vec2f(gradientX, gradientY));
#endif
    let outlineMask: f32 = step(0.5, edgeStrength); // 0.5 is the outline threshold

    // sample depth texture for depth-based occlusion
#if defined(OUTLINELAYER_SAMPLING_TRIDIRECTIONAL) || defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    let depthTopCenter: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(0.0, sampleOffset.y), 0.0).r;
    let depthTopRight: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + sampleOffset, 0.0).r;

    let depthMiddleCenter: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV, 0.0).r;
    let depthMiddleRight: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(sampleOffset.x, 0.0), 0.0).r;
#endif
#if defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    let depthTopLeft: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(-sampleOffset.x, sampleOffset.y), 0.0).r;

    let depthMiddleLeft: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(-sampleOffset.x, 0.0), 0.0).r;

    let depthBottomRight: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(sampleOffset.x, -sampleOffset.y), 0.0).r;
    let depthBottomCenter: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(0.0, -sampleOffset.y), 0.0).r;
    let depthBottomLeft: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(-sampleOffset.x, -sampleOffset.y), 0.0).r;
#endif

    // compute occlusion factor based on depth differences
#if defined(OUTLINELAYER_SAMPLING_TRIDIRECTIONAL) || defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    let occlusionTopCenter: f32 = step(uniforms.occlusionThreshold, abs(maskTopCenter.g - depthTopCenter));
    let occlusionTopRight: f32 = step(uniforms.occlusionThreshold, abs(maskTopRight.g - depthTopRight));

    let occlusionMiddleCenter: f32 = step(uniforms.occlusionThreshold, abs(maskMiddleCenter.g - depthMiddleCenter));
    let occlusionMiddleRight: f32 = step(uniforms.occlusionThreshold, abs(maskMiddleRight.g - depthMiddleRight));
#endif
#if defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    let occlusionTopLeft: f32 = step(uniforms.occlusionThreshold, abs(maskTopLeft.g - depthTopLeft));

    let occlusionMiddleLeft: f32 = step(uniforms.occlusionThreshold, abs(maskMiddleLeft.g - depthMiddleLeft));

    let occlusionBottomRight: f32 = step(uniforms.occlusionThreshold, abs(maskBottomRight.g - depthBottomRight));
    let occlusionBottomCenter: f32 = step(uniforms.occlusionThreshold, abs(maskBottomCenter.g - depthBottomCenter));
    let occlusionBottomLeft: f32 = step(uniforms.occlusionThreshold, abs(maskBottomLeft.g - depthBottomLeft));
#endif

    var occlusionFactor: f32 = occlusionMiddleCenter;
#ifdef OUTLINELAYER_SAMPLING_TRIDIRECTIONAL
    occlusionFactor = min(occlusionFactor, occlusionTopCenter);
    occlusionFactor = min(occlusionFactor, occlusionTopRight);
    occlusionFactor = min(occlusionFactor, occlusionMiddleRight);
#elif defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    occlusionFactor = min(occlusionFactor, occlusionTopCenter);
    occlusionFactor = min(occlusionFactor, occlusionTopRight);
    occlusionFactor = min(occlusionFactor, occlusionTopLeft);
    occlusionFactor = min(occlusionFactor, occlusionMiddleRight);
    occlusionFactor = min(occlusionFactor, occlusionMiddleLeft);
    occlusionFactor = min(occlusionFactor, occlusionBottomRight);
    occlusionFactor = min(occlusionFactor, occlusionBottomCenter);
    occlusionFactor = min(occlusionFactor, occlusionBottomLeft);
#endif

    let finalOutlineMask: f32 = outlineMask * (1.0 - uniforms.occlusionStrength * occlusionFactor);

    fragmentOutputs.color = vec4f(uniforms.outlineColor, finalOutlineMask);

#define CUSTOM_FRAGMENT_MAIN_END
}
