uniform depthValue: f32;

const pos = array(
    vec2f(-1.0, 1.0),
    vec2f(1.0, 1.0),
    vec2f(-1.0, -1.0),
    vec2f(1.0, -1.0)
);


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN
    vertexOutputs.position = vec4f(pos[vertexInputs.vertexIndex], uniforms.depthValue, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}
