
#if defined(INSTANCES)
varying vMeshID: f32;
#else
uniform meshID: f32;
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var id: i32;
#if defined(INSTANCES)
    id = i32(input.vMeshID);
#else
	id = i32(uniforms.meshID);
#endif

    fragmentOutputs.color = vec4f(
        f32((id >> 16) & 0xFF),
        f32((id >> 8) & 0xFF),
        f32(id & 0xFF),
        255.0
    ) / 255.0;
}
