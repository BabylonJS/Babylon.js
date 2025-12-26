#if defined(INSTANCES)
flat varying vSelectionId: f32;
#else
uniform selectionId: f32;
#endif
varying vViewPosZ: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#if defined(INSTANCES)
    var id: f32 = input.vSelectionId;
#else
    var id: f32 = uniforms.selectionId;
#endif

    fragmentOutputs.color = vec4(id, input.vViewPosZ, 0.0, 1.0);
}
