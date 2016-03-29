﻿precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
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

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef ALBEDO
varying vec2 vAlbedoUV;
uniform mat4 albedoMatrix;
uniform vec2 vAlbedoInfos;
#endif

#ifdef AMBIENT
varying vec2 vAmbientUV;
uniform mat4 ambientMatrix;
uniform vec2 vAmbientInfos;
#endif

#ifdef OPACITY
varying vec2 vOpacityUV;
uniform mat4 opacityMatrix;
uniform vec2 vOpacityInfos;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
uniform vec2 vEmissiveInfos;
uniform mat4 emissiveMatrix;
#endif

#ifdef LIGHTMAP
varying vec2 vLightmapUV;
uniform vec2 vLightmapInfos;
uniform mat4 lightmapMatrix;
#endif

#if defined(REFLECTIVITY)
varying vec2 vReflectivityUV;
uniform vec2 vReflectivityInfos;
uniform mat4 reflectivityMatrix;
#endif

#ifdef BUMP
varying vec2 vBumpUV;
uniform vec3 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif


#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<shadowsVertexDeclaration>

#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
varying vec3 vDirectionW;
#endif

#include<logDepthDeclaration>

void main(void) {
#ifdef REFLECTIONMAP_SKYBOX
    vPositionUVW = position;
#endif 

#include<instancesVertex>
#include<bonesVertex>

    gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

    vec4 worldPos = finalWorld * vec4(position, 1.0);
    vPositionW = vec3(worldPos);

#ifdef NORMAL
    vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
    vDirectionW = normalize(vec3(finalWorld * vec4(position, 0.0)));
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

#if defined(REFLECTIVITY)
    if (vReflectivityInfos.x == 0.)
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));
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

    // Clip plane
#include<clipPlaneVertex>

    // Fog
#include<fogVertex>

    // Shadows
#include<shadowsVertex>

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