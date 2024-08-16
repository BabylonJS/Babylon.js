#include<clipPlaneFragmentDeclaration>

uniform color: vec4f;

#include<logDepthDeclaration>

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<logDepthFragment>

    #include<clipPlaneFragment>
	fragmentOutputs.color = uniforms.color;

#define CUSTOM_FRAGMENT_MAIN_END
}