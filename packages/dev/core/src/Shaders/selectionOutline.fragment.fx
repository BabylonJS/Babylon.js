// samplers
uniform sampler2D maskSampler;
uniform sampler2D depthSampler;

// varyings
varying vec2 vUV;

// uniforms
uniform vec2 screenSize;
uniform vec3 outlineColor;
uniform float outlineThickness;
uniform float occlusionStrength;
uniform float occlusionThreshold;

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {
    
#define CUSTOM_FRAGMENT_MAIN_BEGIN

    vec2 texelSize = 1.0 / screenSize;
    vec2 sampleOffset = texelSize * outlineThickness;

    // sample mask texture for edge detection and depth-based occlusion

    // sample mask texture at center and neighboring pixels
#if defined(OUTLINELAYER_SAMPLING_TRIDIRECTIONAL) || defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    vec2 maskTopCenter = texture2D(maskSampler, vUV + vec2(0.0, sampleOffset.y)).rg;
    vec2 maskTopRight = texture2D(maskSampler, vUV + sampleOffset).rg;

    vec2 maskMiddleCenter = texture2D(maskSampler, vUV).rg;
    vec2 maskMiddleRight = texture2D(maskSampler, vUV + vec2(sampleOffset.x, 0.0)).rg;
#endif
#if defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    vec2 maskTopLeft = texture2D(maskSampler, vUV + vec2(-sampleOffset.x, sampleOffset.y)).rg;

    vec2 maskMiddleLeft = texture2D(maskSampler, vUV + vec2(-sampleOffset.x, 0.0)).rg;

    vec2 maskBottomRight = texture2D(maskSampler, vUV + vec2(sampleOffset.x, -sampleOffset.y)).rg;
    vec2 maskBottomCenter = texture2D(maskSampler, vUV + vec2(0.0, -sampleOffset.y)).rg;
    vec2 maskBottomLeft = texture2D(maskSampler, vUV + vec2(-sampleOffset.x, -sampleOffset.y)).rg;
#endif
    
    // compute outline mask
#ifdef OUTLINELAYER_SAMPLING_TRIDIRECTIONAL
    // gradient magnitude edge detection
    vec3 gradient = vec3(
        maskMiddleCenter.r - maskMiddleRight.r,
        maskMiddleCenter.r - maskTopCenter.r,
        maskMiddleCenter.r - maskTopRight.r
    );
    float edgeStrength = length(gradient);
#elif defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    float gradientX = 
        (maskTopLeft.r + 2.0 * maskMiddleLeft.r + maskBottomLeft.r) -
        (maskTopRight.r + 2.0 * maskMiddleRight.r + maskBottomRight.r);
    float gradientY = 
        (maskBottomLeft.r + 2.0 * maskBottomCenter.r + maskBottomRight.r) -
        (maskTopLeft.r + 2.0 * maskTopCenter.r + maskTopRight.r);
    float edgeStrength = length(vec2(gradientX, gradientY));
#endif
    float outlineMask = step(0.5, edgeStrength); // 0.5 is the outline threshold

    // sample depth texture for depth-based occlusion
#if defined(OUTLINELAYER_SAMPLING_TRIDIRECTIONAL) || defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    float depthTopCenter = texture2D(depthSampler, vUV + vec2(0.0, sampleOffset.y)).r;
    float depthTopRight = texture2D(depthSampler, vUV + sampleOffset).r;

    float depthMiddleCenter = texture2D(depthSampler, vUV).r;
    float depthMiddleRight = texture2D(depthSampler, vUV + vec2(sampleOffset.x, 0.0)).r;
#endif
#if defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    float depthTopLeft = texture2D(depthSampler, vUV + vec2(-sampleOffset.x, sampleOffset.y)).r;

    float depthMiddleLeft = texture2D(depthSampler, vUV + vec2(-sampleOffset.x, 0.0)).r;

    float depthBottomRight = texture2D(depthSampler, vUV + vec2(sampleOffset.x, -sampleOffset.y)).r;
    float depthBottomCenter = texture2D(depthSampler, vUV + vec2(0.0, -sampleOffset.y)).r;
    float depthBottomLeft = texture2D(depthSampler, vUV + vec2(-sampleOffset.x, -sampleOffset.y)).r;
#endif

    // compute occlusion factor based on depth differences
#if defined(OUTLINELAYER_SAMPLING_TRIDIRECTIONAL) || defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    float occlusionTopCenter = step(occlusionThreshold, abs(maskTopCenter.g - depthTopCenter));
    float occlusionTopRight = step(occlusionThreshold, abs(maskTopRight.g - depthTopRight));

    float occlusionMiddleCenter = step(occlusionThreshold, abs(maskMiddleCenter.g - depthMiddleCenter));
    float occlusionMiddleRight = step(occlusionThreshold, abs(maskMiddleRight.g - depthMiddleRight));
#endif
#if defined(OUTLINELAYER_SAMPLING_OCTADIRECTIONAL)
    float occlusionTopLeft = step(occlusionThreshold, abs(maskTopLeft.g - depthTopLeft));

    float occlusionMiddleLeft = step(occlusionThreshold, abs(maskMiddleLeft.g - depthMiddleLeft));

    float occlusionBottomRight = step(occlusionThreshold, abs(maskBottomRight.g - depthBottomRight));
    float occlusionBottomCenter = step(occlusionThreshold, abs(maskBottomCenter.g - depthBottomCenter));
    float occlusionBottomLeft = step(occlusionThreshold, abs(maskBottomLeft.g - depthBottomLeft));
#endif

    float occlusionFactor = occlusionMiddleCenter;
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

    float finalOutlineMask = outlineMask * (1.0 - occlusionStrength * occlusionFactor);

    gl_FragColor = vec4(outlineColor, finalOutlineMask);

#define CUSTOM_FRAGMENT_MAIN_END
}
