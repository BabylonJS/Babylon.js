uniform vEyePosition: vec4f;

uniform vReflectionColor: vec3f;
uniform vAlbedoColor: vec4f;

// CUSTOM CONTROLS
uniform vLightingIntensity: vec4f;

uniform vReflectivityColor: vec4f;
uniform vMetallicReflectanceFactors: vec4f;
uniform vEmissiveColor: vec3f;

uniform visibility: f32;

uniform vAmbientColor: vec3f;

// Samplers
#ifdef ALBEDO
uniform vAlbedoInfos: vec2f;
#endif

#ifdef AMBIENT
uniform vAmbientInfos: vec4f;
#endif

#ifdef BUMP
uniform vBumpInfos: vec3f;
uniform vTangentSpaceParams: vec2f;
#endif

#ifdef OPACITY
uniform vOpacityInfos: vec2f;
#endif

#ifdef EMISSIVE
uniform vEmissiveInfos: vec2f;
#endif

#ifdef LIGHTMAP
uniform vLightmapInfos: vec2f;
#endif

#ifdef REFLECTIVITY
uniform vReflectivityInfos: vec3f;
#endif

#ifdef MICROSURFACEMAP
uniform vMicroSurfaceSamplerInfos: vec2f;
#endif

// Refraction Reflection
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(SS_REFRACTION) || defined(PREPASS)
uniform view: mat4x4f;
#endif

// Reflection
#ifdef REFLECTION
    uniform vReflectionInfos: vec2f;
    #ifdef REALTIME_FILTERING
        uniform vReflectionFilteringInfo: vec2f;
    #endif
    uniform reflectionMatrix: mat4x4f;
    uniform vReflectionMicrosurfaceInfos: vec3f;

    #if defined(USE_LOCAL_REFLECTIONMAP_CUBIC) && defined(REFLECTIONMAP_CUBIC)
	    uniform vReflectionPosition: vec3f;
	    uniform vReflectionSize: vec3f; 
    #endif
#endif

// Refraction
#if defined(SS_REFRACTION) && defined(SS_USE_LOCAL_REFRACTIONMAP_CUBIC)
    uniform vRefractionPosition: vec3f;
    uniform vRefractionSize: vec3f; 
#endif

// Clear Coat
#ifdef CLEARCOAT
    uniform vClearCoatParams: vec2f;
    uniform vClearCoatRefractionParams: vec4f;

    #if defined(CLEARCOAT_TEXTURE) || defined(CLEARCOAT_TEXTURE_ROUGHNESS)
        uniform vClearCoatInfos: vec4f;
    #endif

    #ifdef CLEARCOAT_TEXTURE
        uniform clearCoatMatrix: mat4x4f;
    #endif

    #ifdef CLEARCOAT_TEXTURE_ROUGHNESS
        uniform clearCoatRoughnessMatrix: mat4x4f;
    #endif

    #ifdef CLEARCOAT_BUMP
        uniform vClearCoatBumpInfos: vec2f;
        uniform vClearCoatTangentSpaceParams: vec2f;
        uniform clearCoatBumpMatrix: mat4x4f;
    #endif

    #ifdef CLEARCOAT_TINT
        uniform vClearCoatTintParams: vec4f;
        uniform clearCoatColorAtDistance: f32;

        #ifdef CLEARCOAT_TINT_TEXTURE
            uniform vClearCoatTintInfos: vec2f;
            uniform clearCoatTintMatrix: mat4x4f;
        #endif
    #endif
#endif

// Iridescence
#ifdef IRIDESCENCE
    uniform vIridescenceParams: vec4f;

    #if defined(IRIDESCENCE_TEXTURE) || defined(IRIDESCENCE_THICKNESS_TEXTURE)
        uniform vIridescenceInfos: vec4f;
    #endif

    #ifdef IRIDESCENCE_TEXTURE
        uniform iridescenceMatrix: mat4x4f;
    #endif

    #ifdef IRIDESCENCE_THICKNESS_TEXTURE
        uniform iridescenceThicknessMatrix: mat4x4f;
    #endif
#endif

// Anisotropy
#ifdef ANISOTROPIC
    uniform vAnisotropy: vec3f;

    #ifdef ANISOTROPIC_TEXTURE
        uniform vAnisotropyInfos: vec2f;
        uniform anisotropyMatrix: mat4x4f;
    #endif
#endif

// Sheen
#ifdef SHEEN
    uniform vSheenColor: vec4f;
    #ifdef SHEEN_ROUGHNESS
        uniform vSheenRoughness: f32;
    #endif

    #if defined(SHEEN_TEXTURE) || defined(SHEEN_TEXTURE_ROUGHNESS)
        uniform vSheenInfos: vec4f;
    #endif

    #ifdef SHEEN_TEXTURE
        uniform sheenMatrix: mat4x4f;
    #endif

    #ifdef SHEEN_TEXTURE_ROUGHNESS
        uniform sheenRoughnessMatrix: mat4x4f;
    #endif
#endif

// SubSurface
#ifdef SUBSURFACE
    #ifdef SS_REFRACTION
        uniform vRefractionMicrosurfaceInfos: vec4f;
        uniform vRefractionInfos: vec4f;
        uniform refractionMatrix: mat4x4f;
        #ifdef REALTIME_FILTERING
            uniform vRefractionFilteringInfo: vec2f;
        #endif
        #ifdef SS_DISPERSION
            uniform dispersion: f32;
        #endif
    #endif

    #ifdef SS_THICKNESSANDMASK_TEXTURE
        uniform vThicknessInfos: vec2f;
        uniform thicknessMatrix: mat4x4f;
    #endif

    #ifdef SS_REFRACTIONINTENSITY_TEXTURE
        uniform vRefractionIntensityInfos: vec2f;
        uniform refractionIntensityMatrix: mat4x4f;
    #endif

    #ifdef SS_TRANSLUCENCYINTENSITY_TEXTURE
        uniform vTranslucencyIntensityInfos: vec2f;
        uniform translucencyIntensityMatrix: mat4x4f;
    #endif

    uniform vThicknessParam: vec2f;
    uniform vDiffusionDistance: vec3f;
    uniform vTintColor: vec4f;
    uniform vSubSurfaceIntensity: vec3f;

    uniform vTranslucencyColor: vec4f;

    #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
        uniform vTranslucencyColorInfos: vec2f;
        uniform translucencyColorMatrix: mat4x4f;
    #endif
#endif

#ifdef PREPASS
    #ifdef SS_SCATTERING
        uniform scatteringDiffusionProfile: f32;
    #endif
#endif

#if DEBUGMODE > 0
    uniform vDebugMode: vec2f;
#endif

#ifdef DETAIL
    uniform vDetailInfos: vec4f;
#endif

#include<decalFragmentDeclaration>

#ifdef USESPHERICALFROMREFLECTIONMAP
    #ifdef SPHERICAL_HARMONICS
        uniform vSphericalL00: vec3f;
        uniform vSphericalL1_1: vec3f;
        uniform vSphericalL10: vec3f;
        uniform vSphericalL11: vec3f;
        uniform vSphericalL2_2: vec3f;
        uniform vSphericalL2_1: vec3f;
        uniform vSphericalL20: vec3f;
        uniform vSphericalL21: vec3f;
        uniform vSphericalL22: vec3f;
    #else
        uniform vSphericalX: vec3f;
        uniform vSphericalY: vec3f;
        uniform vSphericalZ: vec3f;
        uniform vSphericalXX_ZZ: vec3f;
        uniform vSphericalYY_ZZ: vec3f;
        uniform vSphericalZZ: vec3f;
        uniform vSphericalXY: vec3f;
        uniform vSphericalYZ: vec3f;
        uniform vSphericalZX: vec3f;
    #endif
#endif

#define ADDITIONAL_FRAGMENT_DECLARATION
