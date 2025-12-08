#include<gaussianSplattingFragmentDeclaration>
varying vPosition: vec2f;
varying vColor: vec4f;

// move discard logic to a function to avoid early return issues and parsing/compilation errors with last '}
fn checkDiscard(inPosition: vec2f, inColor: vec4f) -> vec4f {
    var A : f32 = -dot(inPosition, inPosition);
    var alpha : f32 = exp(A) * inColor.a;
#if defined(SM_SOFTTRANSPARENTSHADOW) && SM_SOFTTRANSPARENTSHADOW == 1
    if (A < -4.) {
        discard;
    }
#else
    if (A < -1.) {
        discard;
    }
#endif
    return vec4f(inColor.rgb, alpha);
}

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = checkDiscard(fragmentInputs.vPosition, fragmentInputs.vColor);
#if defined(SM_SOFTTRANSPARENTSHADOW) && SM_SOFTTRANSPARENTSHADOW == 1
    var alpha : f32 = fragmentOutputs.color.a;
#endif
}
