// Attributes
attribute position: vec3f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform view: mat4x4f;
uniform viewProjection: mat4x4f;

#ifdef DIFFUSE
varying vDiffuseUV: vec2f;
#endif

#ifdef POINTSIZE
uniform pointSize: f32;
#endif

// Output
varying vPositionW: vec3f;

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif

#include<clipPlaneVertexDeclaration>

#include<logDepthDeclaration>
#include<fogVertexDeclaration>

// Fire
uniform time: f32;
uniform speed: f32;

#ifdef DIFFUSE
varying vDistortionCoords1: vec2f;
varying vDistortionCoords2: vec2f;
varying vDistortionCoords3: vec2f;
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

#ifdef VERTEXCOLOR
    var colorUpdated: vec4f = vertexInputs.color;
#endif

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

	var worldPos: vec4f = finalWorld *  vec4f(vertexInputs.position, 1.0);

	vertexOutputs.position = uniforms.viewProjection * worldPos;

	vertexOutputs.vPositionW =  worldPos.xyz;

	// Texture coordinates
#ifdef DIFFUSE
	vertexOutputs.vDiffuseUV = vec2f(vertexInputs.uv.x, vertexInputs.uv.y - 0.2);
#endif

	// Clip plane
#include<clipPlaneVertex>

#include<logDepthVertex>
	// Fog
#include<fogVertex>

	// Vertex color
#include<vertexColorMixing>

#ifdef DIFFUSE
	// Fire
	var layerSpeed: vec3f =  vec3f(-0.2, -0.52, -0.1) * uniforms.speed;

	vertexOutputs.vDistortionCoords1 = vec2f(vertexInputs.uv.x, vertexInputs.uv.y + layerSpeed.x * uniforms.time / 1000.0);
	vertexOutputs.vDistortionCoords2 = vec2f(vertexInputs.uv.x, vertexInputs.uv.y + layerSpeed.y * uniforms.time / 1000.0);
	vertexOutputs.vDistortionCoords3 = vec2f(vertexInputs.uv.x, vertexInputs.uv.y + layerSpeed.z * uniforms.time / 1000.0);
#endif

#define CUSTOM_VERTEX_MAIN_END
}
