#include<__decl__defaultVertex>
// Attributes

#define CUSTOM_VERTEX_BEGIN

attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef TANGENT
attribute vec4 tangent;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<helperFunctions>

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

#ifdef PREPASS
varying vec3 vViewPos;
#endif

#ifdef MAINUV1
	varying vec2 vMainUV1;
#endif

#ifdef MAINUV2
	varying vec2 vMainUV2;
#endif

#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0
varying vec2 vDiffuseUV;
#endif

#if defined(DETAIL) && DETAILDIRECTUV == 0
varying vec2 vDetailUV;
#endif

#if defined(AMBIENT) && AMBIENTDIRECTUV == 0
varying vec2 vAmbientUV;
#endif

#if defined(OPACITY) && OPACITYDIRECTUV == 0
varying vec2 vOpacityUV;
#endif

#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0
varying vec2 vEmissiveUV;
#endif

#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0
varying vec2 vLightmapUV;
#endif

#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0
varying vec2 vSpecularUV;
#endif

#if defined(BUMP) && BUMPDIRECTUV == 0
varying vec2 vBumpUV;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<bumpVertexDeclaration>

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif

#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {
	
	#define CUSTOM_VERTEX_MAIN_BEGIN
	
	vec3 positionUpdated = position;
#ifdef NORMAL	
	vec3 normalUpdated = normal;
#endif
#ifdef TANGENT
	vec4 tangentUpdated = tangent;
#endif
#ifdef UV1
	vec2 uvUpdated = uv;
#endif

#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#ifdef REFLECTIONMAP_SKYBOX
	vPositionUVW = positionUpdated;
#endif 

#define CUSTOM_VERTEX_UPDATE_POSITION

#define CUSTOM_VERTEX_UPDATE_NORMAL

#include<instancesVertex>
#include<bonesVertex>

	vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

#ifdef NORMAL
	mat3 normalWorld = mat3(finalWorld);

    #if defined(INSTANCES) && defined(THIN_INSTANCES)
        vNormalW = normalUpdated / vec3(dot(normalWorld[0], normalWorld[0]), dot(normalWorld[1], normalWorld[1]), dot(normalWorld[2], normalWorld[2]));
        vNormalW = normalize(normalWorld * vNormalW);
    #else
        #ifdef NONUNIFORMSCALING
            normalWorld = transposeMat3(inverseMat3(normalWorld));
        #endif

        vNormalW = normalize(normalWorld * normalUpdated);
    #endif
#endif

#define CUSTOM_VERTEX_UPDATE_WORLDPOS

#ifdef MULTIVIEW
	if (gl_ViewID_OVR == 0u) {
		gl_Position = viewProjection * worldPos;
	} else {
		gl_Position = viewProjectionR * worldPos;
	}
#else
	gl_Position = viewProjection * worldPos;
#endif	

	vPositionW = vec3(worldPos);
	#ifdef PREPASS
	    vViewPos = (view * worldPos).rgb;
	#endif

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
	vDirectionW = normalize(vec3(finalWorld * vec4(positionUpdated, 0.0)));
#endif

	// Texture coordinates
#ifndef UV1
	vec2 uvUpdated = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif

#ifdef MAINUV1
	vMainUV1 = uvUpdated;
#endif

#ifdef MAINUV2
	vMainUV2 = uv2;
#endif

#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0
	if (vDiffuseInfos.x == 0.)
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(DETAIL) && DETAILDIRECTUV == 0
	if (vDetailInfos.x == 0.)
	{
		vDetailUV = vec2(detailMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vDetailUV = vec2(detailMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(AMBIENT) && AMBIENTDIRECTUV == 0
	if (vAmbientInfos.x == 0.)
	{
		vAmbientUV = vec2(ambientMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(OPACITY) && OPACITYDIRECTUV == 0
	if (vOpacityInfos.x == 0.)
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0
	if (vEmissiveInfos.x == 0.)
	{
		vEmissiveUV = vec2(emissiveMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0
	if (vLightmapInfos.x == 0.)
	{
		vLightmapUV = vec2(lightmapMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vLightmapUV = vec2(lightmapMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0
	if (vSpecularInfos.x == 0.)
	{
		vSpecularUV = vec2(specularMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vSpecularUV = vec2(specularMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(BUMP) && BUMPDIRECTUV == 0
	if (vBumpInfos.x == 0.)
	{
		vBumpUV = vec2(bumpMatrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else
	{
		vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#include<bumpVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

#ifdef VERTEXCOLOR
	// Vertex color
	vColor = color;
#endif

#include<pointCloudVertex>
#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END

}
