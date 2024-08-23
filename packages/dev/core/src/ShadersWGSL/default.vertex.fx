#include<defaultUboDeclaration>
// Attributes

#define CUSTOM_VERTEX_BEGIN

attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#ifdef TANGENT
attribute tangent: vec4f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#include<uvAttributeDeclaration>[2..7]
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif

#include<helperFunctions>

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>
#include<prePassVertexDeclaration>

#include<mainUVVaryingDeclaration>[1..7]

#include<samplerVertexDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)
#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient)
#include<samplerVertexDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive)
#include<samplerVertexDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap)
#if defined(SPECULARTERM)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular)
#endif
#include<samplerVertexDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)

// Output
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif

#include<bumpVertexDeclaration>

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

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

	var positionUpdated: vec3f = vertexInputs.position;
#ifdef NORMAL
	var normalUpdated: vec3f = vertexInputs.normal;
#endif
#ifdef TANGENT
	var tangentUpdated: vec4f = vertexInputs.tangent;
#endif
#ifdef UV1
	var uvUpdated: vec2f = vertexInputs.uv;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#ifdef REFLECTIONMAP_SKYBOX
	vertexOutputs.vPositionUVW = positionUpdated;
#endif

#define CUSTOM_VERTEX_UPDATE_POSITION

#define CUSTOM_VERTEX_UPDATE_NORMAL

#include<instancesVertex>

#if defined(PREPASS) && (defined(PREPASS_VELOCITY) && !defined(BONES_VELOCITY_ENABLED) || defined(PREPASS_VELOCITY_LINEAR))
        // Compute velocity before bones computation
        vertexOutputs.vCurrentPosition =
            scene.viewProjection * finalWorld * vec4f(positionUpdated, 1.0);
        vertexOutputs.vPreviousPosition = uniforms.previousViewProjection *
                                          finalPreviousWorld *
                                          vec4f(positionUpdated, 1.0);
#endif

#include<bonesVertex>
#include<bakedVertexAnimation>

	var worldPos: vec4f = finalWorld * vec4f(positionUpdated, 1.0);

#ifdef NORMAL
	var normalWorld: mat3x3f =  mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);

    #if defined(INSTANCES) && defined(THIN_INSTANCES)
        vertexOutputs.vNormalW = normalUpdated /  vec3f(dot(normalWorld[0], normalWorld[0]), dot(normalWorld[1], normalWorld[1]), dot(normalWorld[2], normalWorld[2]));
        vertexOutputs.vNormalW = normalize(normalWorld * vertexOutputs.vNormalW);
    #else
        #ifdef NONUNIFORMSCALING
            normalWorld = transposeMat3(inverseMat3(normalWorld));
        #endif

        vertexOutputs.vNormalW = normalize(normalWorld * normalUpdated);
    #endif
#endif

#define CUSTOM_VERTEX_UPDATE_WORLDPOS

#ifdef MULTIVIEW
	if (gl_ViewID_OVR == 0u) {
		vertexOutputs.position = scene.viewProjection * worldPos;
	} else {
		vertexOutputs.position = scene.viewProjectionR * worldPos;
	}
#else
	vertexOutputs.position = scene.viewProjection * worldPos;
#endif

	vertexOutputs.vPositionW =  worldPos.xyz;

#include<prePassVertex>

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
	vertexOutputs.vDirectionW = normalize((finalWorld *  vec4f(positionUpdated, 0.0)).xyz);
#endif

	// Texture coordinates
#ifndef UV1
	var uvUpdated: vec2f = vec2f(0., 0.);
#endif
#ifdef MAINUV1
	vertexOutputs.vMainUV1 = uvUpdated;
#endif
    #include<uvVariableDeclaration>[2..7]

    #include<samplerVertexImplementation>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_MATRIXNAME_,diffuse,_INFONAME_,DiffuseInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_MATRIXNAME_,ambient,_INFONAME_,AmbientInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_MATRIXNAME_,opacity,_INFONAME_,OpacityInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_MATRIXNAME_,emissive,_INFONAME_,EmissiveInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_MATRIXNAME_,lightmap,_INFONAME_,LightmapInfos.x)
    #if defined(SPECULARTERM)
    #include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_MATRIXNAME_,specular,_INFONAME_,SpecularInfos.x)
    #endif
    #include<samplerVertexImplementation>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_MATRIXNAME_,bump,_INFONAME_,BumpInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)

#include<bumpVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

#include<vertexColorMixing>

#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END

}
