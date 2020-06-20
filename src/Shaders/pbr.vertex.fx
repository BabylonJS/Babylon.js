precision highp float;

#include<__decl__pbrVertex>

#define CUSTOM_VERTEX_BEGIN

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

#if defined(REFLECTIVITY) && REFLECTIVITYDIRECTUV == 0
varying vec2 vReflectivityUV;
#endif

#if defined(MICROSURFACEMAP) && MICROSURFACEMAPDIRECTUV == 0
varying vec2 vMicroSurfaceSamplerUV;
#endif

#if defined(METALLIC_REFLECTANCE) && METALLIC_REFLECTANCEDIRECTUV == 0
varying vec2 vMetallicReflectanceUV;
#endif

#if defined(BUMP) && BUMPDIRECTUV == 0
varying vec2 vBumpUV;
#endif

#ifdef CLEARCOAT
    #if defined(CLEARCOAT_TEXTURE) && CLEARCOAT_TEXTUREDIRECTUV == 0 
        varying vec2 vClearCoatUV;
    #endif

    #if defined(CLEARCOAT_BUMP) && CLEARCOAT_BUMPDIRECTUV == 0 
        varying vec2 vClearCoatBumpUV;
    #endif

    #if defined(CLEARCOAT_TINT_TEXTURE) && CLEARCOAT_TINT_TEXTUREDIRECTUV == 0 
        varying vec2 vClearCoatTintUV;
    #endif
#endif

#ifdef SHEEN
    #if defined(SHEEN_TEXTURE) && SHEEN_TEXTUREDIRECTUV == 0 
        varying vec2 vSheenUV;
    #endif
#endif

#ifdef ANISOTROPIC
    #if defined(ANISOTROPIC_TEXTURE) && ANISOTROPIC_TEXTUREDIRECTUV == 0 
        varying vec2 vAnisotropyUV;
    #endif
#endif

#ifdef SUBSURFACE
    #if defined(SS_THICKNESSANDMASK_TEXTURE) && SS_THICKNESSANDMASK_TEXTUREDIRECTUV == 0 
        varying vec2 vThicknessUV;
    #endif
#endif

// Output
varying vec3 vPositionW;
#if DEBUGMODE > 0
    varying vec4 vClipSpacePosition;
#endif
#ifdef NORMAL
    varying vec3 vNormalW;
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
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
    vPositionW = vec3(worldPos);

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

    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        vec3 reflectionVector = vec3(reflectionMatrix * vec4(vNormalW, 0)).xyz;
        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif
        vEnvironmentIrradiance = computeEnvironmentIrradiance(reflectionVector);
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

#if DEBUGMODE > 0
    vClipSpacePosition = gl_Position;
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

#if defined(ALBEDO) && ALBEDODIRECTUV == 0 
    if (vAlbedoInfos.x == 0.)
    {
        vAlbedoUV = vec2(albedoMatrix * vec4(uvUpdated, 1.0, 0.0));
    }
    else
    {
        vAlbedoUV = vec2(albedoMatrix * vec4(uv2, 1.0, 0.0));
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

#if defined(REFLECTIVITY) && REFLECTIVITYDIRECTUV == 0 
    if (vReflectivityInfos.x == 0.)
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uvUpdated, 1.0, 0.0));
    }
    else
    {
        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(MICROSURFACEMAP) && MICROSURFACEMAPDIRECTUV == 0 
    if (vMicroSurfaceSamplerInfos.x == 0.)
    {
        vMicroSurfaceSamplerUV = vec2(microSurfaceSamplerMatrix * vec4(uvUpdated, 1.0, 0.0));
    }
    else
    {
        vMicroSurfaceSamplerUV = vec2(microSurfaceSamplerMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

#if defined(METALLIC_REFLECTANCE) && METALLIC_REFLECTANCEDIRECTUV == 0 
    if (vMetallicReflectanceInfos.x == 0.)
    {
        vMetallicReflectanceUV = vec2(metallicReflectanceMatrix * vec4(uvUpdated, 1.0, 0.0));
    }
    else
    {
        vMetallicReflectanceUV = vec2(metallicReflectanceMatrix * vec4(uv2, 1.0, 0.0));
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

#ifdef CLEARCOAT
    #if defined(CLEARCOAT_TEXTURE) && CLEARCOAT_TEXTUREDIRECTUV == 0 
        if (vClearCoatInfos.x == 0.)
        {
            vClearCoatUV = vec2(clearCoatMatrix * vec4(uvUpdated, 1.0, 0.0));
        }
        else
        {
            vClearCoatUV = vec2(clearCoatMatrix * vec4(uv2, 1.0, 0.0));
        }
    #endif

    #if defined(CLEARCOAT_BUMP) && CLEARCOAT_BUMPDIRECTUV == 0 
        if (vClearCoatBumpInfos.x == 0.)
        {
            vClearCoatBumpUV = vec2(clearCoatBumpMatrix * vec4(uvUpdated, 1.0, 0.0));
        }
        else
        {
            vClearCoatBumpUV = vec2(clearCoatBumpMatrix * vec4(uv2, 1.0, 0.0));
        }
    #endif

    #if defined(CLEARCOAT_TINT_TEXTURE) && CLEARCOAT_TINT_TEXTUREDIRECTUV == 0 
        if (vClearCoatTintInfos.x == 0.)
        {
            vClearCoatTintUV = vec2(clearCoatTintMatrix * vec4(uvUpdated, 1.0, 0.0));
        }
        else
        {
            vClearCoatTintUV = vec2(clearCoatTintMatrix * vec4(uv2, 1.0, 0.0));
        }
    #endif
#endif

#ifdef SHEEN
    #if defined(SHEEN_TEXTURE) && SHEEN_TEXTUREDIRECTUV == 0 
        if (vSheenInfos.x == 0.)
        {
            vSheenUV = vec2(sheenMatrix * vec4(uvUpdated, 1.0, 0.0));
        }
        else
        {
            vSheenUV = vec2(sheenMatrix * vec4(uv2, 1.0, 0.0));
        }
    #endif
#endif

#ifdef ANISOTROPIC
    #if defined(ANISOTROPIC_TEXTURE) && ANISOTROPIC_TEXTUREDIRECTUV == 0 
        if (vAnisotropyInfos.x == 0.)
        {
            vAnisotropyUV = vec2(anisotropyMatrix * vec4(uvUpdated, 1.0, 0.0));
        }
        else
        {
            vAnisotropyUV = vec2(anisotropyMatrix * vec4(uv2, 1.0, 0.0));
        }
    #endif
#endif

#ifdef SUBSURFACE
    #if defined(SS_THICKNESSANDMASK_TEXTURE) && SS_THICKNESSANDMASK_TEXTUREDIRECTUV == 0 
        if (vThicknessInfos.x == 0.)
        {
            vThicknessUV = vec2(thicknessMatrix * vec4(uvUpdated, 1.0, 0.0));
        }
        else
        {
            vThicknessUV = vec2(thicknessMatrix * vec4(uv2, 1.0, 0.0));
        }
    #endif
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

#define CUSTOM_VERTEX_MAIN_END

}