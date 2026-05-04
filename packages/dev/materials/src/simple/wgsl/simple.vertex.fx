// Attributes
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
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
uniform diffuseMatrix: mat4x4f;
uniform vDiffuseInfos: vec2f;
#endif

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

#ifdef VERTEXCOLOR
    var colorUpdated: vec4f = vertexInputs.color;
#endif

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

	var worldPos: vec4f = finalWorld *  vec4f(vertexInputs.position, 1.0);

	vertexOutputs.position = uniforms.viewProjection * worldPos;

	vertexOutputs.vPositionW =  worldPos.xyz;

#ifdef NORMAL
	vertexOutputs.vNormalW = normalize(( finalWorld *  vec4f(vertexInputs.normal, 0.0)).xyz);
#endif

	// Texture coordinates
#ifndef UV1
	var uv: vec2f =  vec2f(0., 0.);
#else
    var uv: vec2f = vertexInputs.uv;
#endif
#ifndef UV2
	var uv2: vec2f =  vec2f(0., 0.);
#else
    var uv2: vec2f = vertexInputs.uv2;
#endif

#ifdef DIFFUSE
	if (uniforms.vDiffuseInfos.x == 0.)
	{
		vertexOutputs.vDiffuseUV = (uniforms.diffuseMatrix *  vec4f(uv, 1.0, 0.0)).xy;
	}
	else
	{
		vertexOutputs.vDiffuseUV = (uniforms.diffuseMatrix *  vec4f(uv2, 1.0, 0.0)).xy;
	}
#endif

	// Clip plane
#include<clipPlaneVertex>

#include<logDepthVertex>

    // Fog
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

	// Vertex color
#include<vertexColorMixing>

#define CUSTOM_VERTEX_MAIN_END
}
