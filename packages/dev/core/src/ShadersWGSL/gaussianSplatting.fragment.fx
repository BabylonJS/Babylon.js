#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

varying vColor: vec4f;
varying vPosition: vec2f;

#define CUSTOM_FRAGMENT_DEFINITIONS

#include<gaussianSplattingFragmentDeclaration>

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

    var finalColor: vec4f = gaussianColor(input.vColor, input.vPosition);

#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

    fragmentOutputs.color = finalColor;

#define CUSTOM_FRAGMENT_MAIN_END
}
