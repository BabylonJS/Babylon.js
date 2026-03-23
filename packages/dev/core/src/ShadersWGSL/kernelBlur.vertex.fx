// Attributes
attribute position: vec2f;

// Uniform
uniform delta: vec2f;

// Output
varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
	const madd: vec2f =  vec2f(0.5, 0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN

	vertexOutputs.sampleCenter = (vertexInputs.position * madd + madd);

	#include<kernelBlurVertex>[0..varyingCount]

	vertexOutputs.position =  vec4f(vertexInputs.position, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}