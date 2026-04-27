#include<backgroundUboDeclaration>

#include<helperFunctions>

// Attributes
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>

// Output
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#ifdef MAINUV1
varying vMainUV1: vec2f;
#endif
#ifdef MAINUV2
varying vMainUV2: vec2f;
#endif

#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0
varying vDiffuseUV: vec2f;
#endif

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<lightVxUboDeclaration>[0..maxSimultaneousLights]

#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#endif

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif

#include<logDepthDeclaration>

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN


#ifdef REFLECTIONMAP_SKYBOX
    vertexOutputs.vPositionUVW = vertexInputs.position;
#endif

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

#ifdef MULTIVIEW
	if (gl_ViewID_OVR == 0u) {
		vertexOutputs.position = scene.viewProjection * finalWorld *  vec4f(vertexInputs.position, 1.0);
	} else {
		vertexOutputs.position = scene.viewProjectionR * finalWorld *  vec4f(vertexInputs.position, 1.0);
	}
#else
	vertexOutputs.position = scene.viewProjection * finalWorld *  vec4f(vertexInputs.position, 1.0);
#endif

	var worldPos: vec4f = finalWorld *  vec4f(vertexInputs.position, 1.0);
	vertexOutputs.vPositionW =  worldPos.xyz;

#ifdef NORMAL
	var normalWorld: mat3x3f = mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);

	#ifdef NONUNIFORMSCALING
		normalWorld = transposeMat3(inverseMat3(normalWorld));
	#endif

	vertexOutputs.vNormalW = normalize(normalWorld * vertexInputs.normal);
#endif

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
    vertexOutputs.vDirectionW = normalize((finalWorld * vec4f(vertexInputs.position, 0.0)).xyz);


    #ifdef EQUIRECTANGULAR_RELFECTION_FOV
        var screenToWorld: mat3x3f = inverseMat3( mat3x3f(finalWorld * scene.viewProjection));
        var segment: vec3f = mix(vertexOutputs.vDirectionW, screenToWorld *  vec3f(0.0,0.0, 1.0), abs(fFovMultiplier - 1.0));
        if (fFovMultiplier <= 1.0) {
            vertexOutputs.vDirectionW = normalize(segment);
        } else {
            vertexOutputs.vDirectionW = normalize(vertexOutputs.vDirectionW + (vertexOutputs.vDirectionW - segment));
        }
    #endif
#endif

#ifndef UV1
    var uv: vec2f = vec2f(0., 0.);
#else
    var uv = vertexInputs.uv;
#endif
#ifndef UV2
    var uv2: vec2f = vec2f(0., 0.);
#else
    var uv2 = vertexInputs.uv2;
#endif

#ifdef MAINUV1
	vertexOutputs.vMainUV1 = uv;
#endif

#ifdef MAINUV2
	vertexOutputs.vMainUV2 = uv2;
#endif

#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0
    if (uniforms.vDiffuseInfos.x == 0.)
    {
        vertexOutputs.vDiffuseUV =  (uniforms.diffuseMatrix *  vec4f(uv, 1.0, 0.0)).xy;
    }
    else
    {
        vertexOutputs.vDiffuseUV =  (uniforms.diffuseMatrix *  vec4f(uv2, 1.0, 0.0)).xy;
    }
#endif

    // Clip plane
#include<clipPlaneVertex>

    // Fog
#include<fogVertex>

    // Shadows
#include<shadowsVertex>[0..maxSimultaneousLights]

    // Vertex color
#ifdef VERTEXCOLOR
    vertexOutputs.vColor = vertexInputs.color;
#endif

#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END
}
