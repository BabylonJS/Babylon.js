// Attributes
attribute position: vec2f;

// Uniforms
uniform scale: vec2f;
uniform offset: vec2f;
uniform textureMatrix: mat4x4f;

// Output
varying vUV: vec2f;

const madd: vec2f =  vec2f(0.5, 0.5);

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN

	var shiftedPosition: vec2f = vertexInputs.position * uniforms.scale + uniforms.offset;
	vertexOutputs.vUV = (uniforms.textureMatrix *  vec4f(shiftedPosition * madd + madd, 1.0, 0.0)).xy;
	vertexOutputs.position =  vec4f(shiftedPosition, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END

}