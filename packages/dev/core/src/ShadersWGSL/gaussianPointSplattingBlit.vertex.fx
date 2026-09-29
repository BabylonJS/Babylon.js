// Fullscreen triangle for the point-splatting blits. Positions are already clip-space; vScreenUv lets
// the fragment index storage buffers independently of the render target size.
attribute position: vec3f;

varying vScreenUv: vec2f;

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

    vertexOutputs.position = vec4f(vertexInputs.position.xy, 0.0, 1.0);
    vertexOutputs.vScreenUv = vertexInputs.position.xy * 0.5 + vec2f(0.5, 0.5);

#define CUSTOM_VERTEX_MAIN_END
}
