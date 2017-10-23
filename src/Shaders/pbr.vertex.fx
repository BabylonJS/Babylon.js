precision highp float;

#include<__decl__pbrVertex>

// Attributes
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
#ifdef MAINUV1
varying vec2 vMainUV1;
#endif
#ifdef MAINUV2
varying vec2 vMainUV2; 
#endif 
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<helperFunctions>
#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

#if defined(ALBEDO) && ALBEDODIRECTUV == 0
varying vec2 vAlbedoUV;
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

#if defined(REFLECTIVITY) && REFLECTIVITYDIRECTUV == 0
varying vec2 vReflectivityUV;
#endif

#if defined(MICROSURFACEMAP) && MICROSURFACEMAPDIRECTUV == 0
varying vec2 vMicroSurfaceSamplerUV;
#endif

#if defined(BUMP) && BUMPDIRECTUV == 0
varying vec2 vBumpUV;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
    varying vec3 vNormalW;
    #if defined(USESPHERICALFROMREFLECTIONMAP) && !defined(USESPHERICALINFRAGMENT)
        varying vec3 vEnvironmentIrradiance;
        
        #include<harmonicsFunctions>
    #endif
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

void main(void) {
	vec3 positionUpdated = position;
#ifdef NORMAL
	vec3 normalUpdated = normal;
#endif
#ifdef TANGENT
    vec4 tangentUpdated = tangent;
#endif

#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#ifdef REFLECTIONMAP_SKYBOX
    vPositionUVW = positionUpdated;
#endif 

#include<instancesVertex>
#include<bonesVertex>

    gl_Position = viewProjection * finalWorld * vec4(positionUpdated, 1.0);

    vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);
    vPositionW = vec3(worldPos);

#ifdef NORMAL
	mat3 normalWorld = mat3(finalWorld);

	#ifdef NONUNIFORMSCALING
		normalWorld = transposeMat3(inverseMat3(normalWorld));
	#endif

	vNormalW = normalize(normalWorld * normalUpdated);

    #if defined(USESPHERICALFROMREFLECTIONMAP) && !defined(USESPHERICALINFRAGMENT)
        vec3 reflectionVector = vec3(reflectionMatrix * vec4(vNormalW, 0)).xyz;
        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif
        vEnvironmentIrradiance = environmentIrradianceJones(reflectionVector);
    #endif
#endif

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
    vDirectionW = normalize(vec3(finalWorld * vec4(positionUpdated, 0.0)));
#endif

    // Texture coordinates
#ifndef UV1
    vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
    vec2 uv2 = vec2(0., 0.);
#endif

#ifdef MAINUV1
	vMainUV1 = uv;
#endif 

#ifdef MAINUV2
	vMainUV2 = uv2;
#endif 

#if defined(ALBEDO) && ALBEDODIRECTUV == 0 
    if (vAlbedoInfos.x == 0.)
    {
        vAlbedoUV = vec2(albedoMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vAlbedoUV = vec2(albedoMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(AMBIENT) && AMBIENTDIRECTUV == 0 
    if (vAmbientInfos.x == 0.)
    {
        vAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(OPACITY) && OPACITYDIRECTUV == 0 
    if (vOpacityInfos.x == 0.)
    {
        vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0 
    if (vEmissiveInfos.x == 0.)
    {
        vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0 
    if (vLightmapInfos.x == 0.)
    {
        vLightmapUV = vec2(lightmapMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vLightmapUV = vec2(lightmapMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(REFLECTIVITY) && REFLECTIVITYDIRECTUV == 0 
    if (vReflectivityInfos.x == 0.)
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(MICROSURFACEMAP) && MICROSURFACEMAPDIRECTUV == 0 
    if (vMicroSurfaceSamplerInfos.x == 0.)
    {
        vMicroSurfaceSamplerUV = vec2(microSurfaceSamplerMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vMicroSurfaceSamplerUV = vec2(microSurfaceSamplerMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(BUMP) && BUMPDIRECTUV == 0 
    if (vBumpInfos.x == 0.)
    {
        vBumpUV = vec2(bumpMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

    // TBN
#include<bumpVertex>

    // Clip plane
#include<clipPlaneVertex>

    // Fog
#include<fogVertex>

    // Shadows
#include<shadowsVertex>[0..maxSimultaneousLights]

    // Vertex color
#ifdef VERTEXCOLOR
    vColor = color;
#endif

    // Point size
#ifdef POINTSIZE
    gl_PointSize = pointSize;
#endif

    // Log. depth
#include<logDepthVertex>
}