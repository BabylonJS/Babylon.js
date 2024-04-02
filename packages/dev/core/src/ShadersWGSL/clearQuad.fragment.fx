uniform color: vec4f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	fragmentOutputs.color = uniforms.color;
}
