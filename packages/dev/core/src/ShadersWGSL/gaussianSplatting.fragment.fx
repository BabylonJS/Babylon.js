#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

#ifdef GPUPICKER_PACK_DEPTH
#include<packingFunctions>
#endif

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

#ifdef GPUPICKER_DEPTH
    fragmentOutputs.fragData0 = finalColor;
    #ifdef GPUPICKER_PACK_DEPTH
    fragmentOutputs.fragData1 = pack(fragmentInputs.position.z);
    #else
    fragmentOutputs.fragData1 = vec4f(fragmentInputs.position.z, 0.0, 0.0, 1.0);
    #endif
#else
    fragmentOutputs.color = finalColor;
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}
