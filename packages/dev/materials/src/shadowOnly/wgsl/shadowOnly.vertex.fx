// Attributes
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>

#include<sceneUboDeclaration>

#ifdef POINTSIZE
uniform pointSize: f32;
#endif

// Output
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif


#include<clipPlaneVertexDeclaration>

#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
varying vViewDepth: f32;
#endif

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

	var worldPos: vec4f = finalWorld *  vec4f(vertexInputs.position, 1.0);

	vertexOutputs.position = scene.viewProjection * worldPos;

	vertexOutputs.vPositionW =  worldPos.xyz;

#ifdef NORMAL
	vertexOutputs.vNormalW = normalize(( finalWorld *  vec4f(vertexInputs.normal, 0.0)).xyz);
#endif

	// Clip plane
#include<clipPlaneVertex>

#include<logDepthVertex>

    // Fog
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

#define CUSTOM_VERTEX_MAIN_END
}
