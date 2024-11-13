#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

varying vColor: vec4f;
varying vPosition: vec2f;

#include<gaussianSplattingFragmentDeclaration>

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#include<clipPlaneFragment>

    fragmentOutputs.color = gaussianColor(input.vColor, input.vPosition);
}
