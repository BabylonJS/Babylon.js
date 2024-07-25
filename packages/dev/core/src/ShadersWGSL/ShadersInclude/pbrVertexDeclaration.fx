uniform view: mat4x4f;
uniform viewProjection: mat4x4f;

#ifdef ALBEDO
uniform albedoMatrix: mat4x4f;
uniform vAlbedoInfos: vec2f;
#endif

#ifdef AMBIENT
uniform ambientMatrix: mat4x4f;
uniform vAmbientInfos: vec4f;
#endif

#ifdef OPACITY
uniform opacityMatrix: mat4x4f;
uniform vOpacityInfos: vec2f;
#endif

#ifdef EMISSIVE
uniform vEmissiveInfos: vec2f;
uniform emissiveMatrix: mat4x4f;
#endif

#ifdef LIGHTMAP
uniform vLightmapInfos: vec2f;
uniform lightmapMatrix: mat4x4f;
#endif

#ifdef REFLECTIVITY 
uniform vReflectivityInfos: vec3f;
uniform reflectivityMatrix: mat4x4f;
#endif

#ifdef METALLIC_REFLECTANCE
    uniform vMetallicReflectanceInfos: vec2f;
    uniform metallicReflectanceMatrix: mat4x4f;
#endif
#ifdef REFLECTANCE
    uniform vReflectanceInfos: vec2f;
    uniform reflectanceMatrix: mat4x4f;
#endif

#ifdef MICROSURFACEMAP
uniform vMicroSurfaceSamplerInfos: vec2f;
uniform microSurfaceSamplerMatrix: mat4x4f;
#endif

#ifdef BUMP
uniform vBumpInfos: vec3f;
uniform bumpMatrix: mat4x4f;
#endif

#ifdef POINTSIZE
uniform pointSize: f32;
#endif

// Reflection
#ifdef REFLECTION
    uniform vReflectionInfos: vec2f;
    uniform reflectionMatrix: mat4x4f;
#endif

// Clear Coat
#ifdef CLEARCOAT
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
        uniform clearCoatBumpMatrix: mat4x4f;
    #endif

    #ifdef CLEARCOAT_TINT_TEXTURE
        uniform vClearCoatTintInfos: vec2f;
        uniform clearCoatTintMatrix: mat4x4f;
    #endif
#endif

// Iridescence
#ifdef IRIDESCENCE
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
    #ifdef ANISOTROPIC_TEXTURE
        uniform vAnisotropyInfos: vec2f;
        uniform anisotropyMatrix: mat4x4f;
    #endif
#endif

// Sheen
#ifdef SHEEN
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

// Sub Surface
#ifdef SUBSURFACE
    #ifdef SS_REFRACTION
        uniform vRefractionInfos: vec4f;
        uniform refractionMatrix: mat4x4f;
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

    #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
        uniform vTranslucencyColorInfos: vec2f;
        uniform translucencyColorMatrix: mat4x4f;
    #endif
#endif

#ifdef NORMAL
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
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
    #endif
#endif

#ifdef DETAIL
uniform vDetailInfos: vec4f;
uniform detailMatrix: mat4x4f;
#endif

#include<decalVertexDeclaration>

#define ADDITIONAL_VERTEX_DECLARATION
