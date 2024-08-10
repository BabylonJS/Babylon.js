// Attributes
attribute position: vec2f;
uniform texelSize: vec2f;

// Output
varying vUV: vec2f;
varying sampleCoordS: vec2f;
varying sampleCoordE: vec2f;
varying sampleCoordN: vec2f;
varying sampleCoordW: vec2f;
varying sampleCoordNW: vec2f;
varying sampleCoordSE: vec2f;
varying sampleCoordNE: vec2f;
varying sampleCoordSW: vec2f;

const madd: vec2f =  vec2f(0.5, 0.5);

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN
	
	vertexOutputs.vUV = (input.position * madd + madd);

	vertexOutputs.sampleCoordS = vertexOutputs.vUV +  vec2f( 0.0, 1.0) * uniforms.texelSize;
	vertexOutputs.sampleCoordE = vertexOutputs.vUV +  vec2f( 1.0, 0.0) * uniforms.texelSize;
	vertexOutputs.sampleCoordN = vertexOutputs.vUV +  vec2f( 0.0,-1.0) * uniforms.texelSize;
	vertexOutputs.sampleCoordW = vertexOutputs.vUV +  vec2f(-1.0, 0.0) * uniforms.texelSize;

	vertexOutputs.sampleCoordNW = vertexOutputs.vUV +  vec2f(-1.0,-1.0) * uniforms.texelSize;
	vertexOutputs.sampleCoordSE = vertexOutputs.vUV +  vec2f( 1.0, 1.0) * uniforms.texelSize;
	vertexOutputs.sampleCoordNE = vertexOutputs.vUV +  vec2f( 1.0,-1.0) * uniforms.texelSize;
	vertexOutputs.sampleCoordSW = vertexOutputs.vUV +  vec2f(-1.0, 1.0) * uniforms.texelSize;

	vertexOutputs.position = vec4f(input.position, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}