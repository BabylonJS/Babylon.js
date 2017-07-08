﻿precision highp float;

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
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

#ifdef ALBEDO
varying vec2 vAlbedoUV;
#endif

#ifdef AMBIENT
varying vec2 vAmbientUV;
#endif

#ifdef OPACITY
varying vec2 vOpacityUV;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
#endif

#ifdef LIGHTMAP
varying vec2 vLightmapUV;
#endif

#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) 
varying vec2 vReflectivityUV;
#endif

#ifdef MICROSURFACEMAP
varying vec2 vMicroSurfaceSamplerUV;
#endif

#ifdef BUMP
varying vec2 vBumpUV;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
    varying vec3 vNormalW;
    #ifdef USESPHERICALFROMREFLECTIONMAP
        varying vec3 vEnvironmentIrradiance;
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

#include<harmonicsFunctions>

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
    vNormalW = normalize(vec3(finalWorld * vec4(normalUpdated, 0.0)));
    #ifdef USESPHERICALFROMREFLECTIONMAP
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

#ifdef ALBEDO
    if (vAlbedoInfos.x == 0.)
    {
        vAlbedoUV = vec2(albedoMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vAlbedoUV = vec2(albedoMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#ifdef AMBIENT
    if (vAmbientInfos.x == 0.)
    {
        vAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#ifdef OPACITY
    if (vOpacityInfos.x == 0.)
    {
        vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#ifdef EMISSIVE
    if (vEmissiveInfos.x == 0.)
    {
        vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#ifdef LIGHTMAP
    if (vLightmapInfos.x == 0.)
    {
        vLightmapUV = vec2(lightmapMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vLightmapUV = vec2(lightmapMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) 
    if (vReflectivityInfos.x == 0.)
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#ifdef MICROSURFACEMAP
    if (vMicroSurfaceSamplerInfos.x == 0.)
    {
        vMicroSurfaceSamplerUV = vec2(microSurfaceSamplerMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vMicroSurfaceSamplerUV = vec2(microSurfaceSamplerMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#ifdef BUMP
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