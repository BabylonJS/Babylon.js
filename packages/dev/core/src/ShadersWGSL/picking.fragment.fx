
#if defined(INSTANCES)
varying vMeshID: f32;
#else
uniform meshID: f32;
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var id: i32;
#if defined(INSTANCES)
    id = i32(input.vMeshID + 0.5); // + 0.5 to avoid precision issues
#else
	id = i32(uniforms.meshID + 0.5); // + 0.5 to avoid precision issues
#endif
    var color = vec3f(
        f32((id >> 16) & 0xFF),
        f32((id >> 8) & 0xFF),
        f32(id & 0xFF),
    ) / 255.0;
    fragmentOutputs.color = vec4f(color, 1.0);
}
