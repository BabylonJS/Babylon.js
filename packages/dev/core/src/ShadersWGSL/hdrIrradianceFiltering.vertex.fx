// Attributes
attribute position: vec2f;

// Output
varying direction: vec3f;

// Uniforms
uniform up: vec3f;
uniform right: vec3f;
uniform front: vec3f;


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN

	var view: mat3x3f =  mat3x3f(uniforms.up, uniforms.right, uniforms.front);
	vertexOutputs.direction = view * vec3f(vertexInputs.position, 1.0);
	vertexOutputs.position =  vec4f(vertexInputs.position, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}