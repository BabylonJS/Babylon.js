// Attributes
attribute position: vec3f;
attribute normal: vec3f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif

#include<instancesDeclaration>

// Uniforms
#include<sceneUboDeclaration>

// Varying
varying vPosition: vec3f;
varying vNormal: vec3f;

#include<logDepthDeclaration>
#include<fogVertexDeclaration>

#ifdef OPACITY
varying vOpacityUV: vec2f;
uniform opacityMatrix: mat4x4f;
uniform vOpacityInfos: vec2f;
#endif

#include<clipPlaneVertexDeclaration>

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

	#include<instancesVertex>

    var worldPos: vec4f = finalWorld *  vec4f(vertexInputs.position, 1.0);

    #include<fogVertex>

    var cameraSpacePosition: vec4f = scene.view * worldPos;
    vertexOutputs.position = scene.projection * cameraSpacePosition;

#ifdef OPACITY
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
	if (uniforms.vOpacityInfos.x == 0.)
	{
		vertexOutputs.vOpacityUV = (uniforms.opacityMatrix *  vec4f(uv, 1.0, 0.0)).xy;
	}
	else
	{
		vertexOutputs.vOpacityUV = (uniforms.opacityMatrix *  vec4f(uv2, 1.0, 0.0)).xy;
	}
#endif

	// Clip plane
	#include<clipPlaneVertex>

	#include<logDepthVertex>

    vertexOutputs.vPosition = vertexInputs.position;
    vertexOutputs.vNormal = vertexInputs.normal;

#define CUSTOM_VERTEX_MAIN_END
}
