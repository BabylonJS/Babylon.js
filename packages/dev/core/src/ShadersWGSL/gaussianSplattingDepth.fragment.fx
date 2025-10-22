#include<gaussianSplattingFragmentDeclaration>
varying vPosition: vec2f;

// move discard logic to a function to avoid early return issues and parsing/compilation errors with last '}
fn checkDiscard(inPosition: vec2f) -> vec4f {
    var A : f32 = -dot(inPosition, inPosition);
    if (A < -1.) {
        discard;
    }
    return vec4f(0.0);
}
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = checkDiscard(fragmentInputs.vPosition);
}
