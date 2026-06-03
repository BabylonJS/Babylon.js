uniform color: vec3f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = vec4f(uniforms.color, 1.0);
}
