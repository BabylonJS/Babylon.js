// Attributes
attribute position: vec2f;

// Output
varying vUV: vec2f;

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
	const madd: vec2f =  vec2f(0.5, 0.5);

#define CUSTOM_VERTEX_MAIN_BEGIN

	vertexOutputs.vUV = input.position * madd + madd;
	vertexOutputs.position =  vec4f(input.position, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}