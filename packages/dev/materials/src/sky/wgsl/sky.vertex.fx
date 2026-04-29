// Attributes
attribute position: vec3f;

#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif

// Uniforms
uniform world: mat4x4f;
uniform view: mat4x4f;
uniform viewProjection: mat4x4f;

#ifdef POINTSIZE
uniform pointSize: f32;
#endif

// Output
varying vPositionW: vec3f;

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif

#include<logDepthDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

	vertexOutputs.position = uniforms.viewProjection * uniforms.world *  vec4f(vertexInputs.position, 1.0);

	var worldPos: vec4f = uniforms.world *  vec4f(vertexInputs.position, 1.0);
	vertexOutputs.vPositionW =  worldPos.xyz;

	// Clip plane
#include<clipPlaneVertex>

#include<logDepthVertex>

	// Fog
#include<fogVertex>

	// Vertex color
#ifdef VERTEXCOLOR
	vertexOutputs.vColor = vertexInputs.color;
#endif

#define CUSTOM_VERTEX_MAIN_END
}
