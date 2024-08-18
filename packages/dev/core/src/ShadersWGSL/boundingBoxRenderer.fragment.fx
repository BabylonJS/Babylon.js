uniform color: vec4f;


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	fragmentOutputs.color = uniforms.color;

#define CUSTOM_FRAGMENT_MAIN_END
}