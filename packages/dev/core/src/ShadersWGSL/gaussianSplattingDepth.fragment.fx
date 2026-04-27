#include<gaussianSplattingFragmentDeclaration>
varying vPosition: vec2f;
varying vColor: vec4f;

#ifdef DEPTH_RENDER
varying vDepthMetric: f32;
#endif

// move discard logic to a function to avoid early return issues and parsing/compilation errors with last '}
fn checkDiscard(inPosition: vec2f, inColor: vec4f) -> vec4f {
    var A : f32 = -dot(inPosition, inPosition);
    var alpha : f32 = exp(A) * inColor.a;
#if (defined(SM_SOFTTRANSPARENTSHADOW) && SM_SOFTTRANSPARENTSHADOW == 1) ||    \
    (defined(DEPTH_RENDER) && defined(ALPHA_BLENDED_DEPTH))
    if (A < -4.) {
        discard;
    }
#else
    if (A < -inColor.a) {
        discard;
    }
#endif
#ifdef DEPTH_RENDER
    var opacity : f32 = 1.0;
#ifdef ALPHA_BLENDED_DEPTH
    opacity = alpha;
#endif
    return vec4f(fragmentInputs.vDepthMetric, 0.0, 0.0, opacity);
#else
    return vec4f(inColor.rgb, alpha);
#endif
}

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = checkDiscard(fragmentInputs.vPosition, fragmentInputs.vColor);
#if (defined(SM_SOFTTRANSPARENTSHADOW) && SM_SOFTTRANSPARENTSHADOW == 1) ||    \
    (defined(DEPTH_RENDER) && defined(ALPHA_BLENDED_DEPTH))
    var alpha : f32 = fragmentOutputs.color.a;
#endif
}
