varying vPosition: vec2f;
flat varying vMeshID: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    // Gaussian discard
    var A: f32 = -dot(input.vPosition, input.vPosition);
    if (A < -4.0) {
        discard;
    }

    // Encode picking ID into RGB
    var id: i32 = i32(input.vMeshID);
    var color = vec3f(
        f32((id >> 16) & 0xFF),
        f32((id >> 8) & 0xFF),
        f32(id & 0xFF),
    ) / 255.0;
    fragmentOutputs.color = vec4f(color, 1.0);
}
