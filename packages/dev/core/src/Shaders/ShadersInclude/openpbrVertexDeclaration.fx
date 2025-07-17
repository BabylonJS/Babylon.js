uniform mat4 view;
uniform mat4 viewProjection;
uniform vec4 vEyePosition;
#ifdef MULTIVIEW
	mat4 viewProjectionR;
#endif

#ifdef ALBEDO
uniform vec2 vBaseColorInfos;
uniform mat4 baseColorMatrix;
#endif

#ifdef BASE_WEIGHT
uniform mat4 baseWeightMatrix;
uniform vec2 vBaseWeightInfos;
#endif

uniform float vBaseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
uniform mat4 baseDiffuseRoughnessMatrix;
uniform vec2 vBaseDiffuseRoughnessInfos;
#endif

#ifdef AMBIENT
uniform mat4 ambientMatrix;
uniform vec4 vAmbientInfos;
#endif

#ifdef OPACITY
uniform mat4 opacityMatrix;
uniform vec2 vOpacityInfos;
#endif

#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;
uniform mat4 emissiveMatrix;
#endif

#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;
uniform mat4 lightmapMatrix;
#endif

#ifdef METALLIC_ROUGHNESS
uniform vec2 vBaseMetalRoughInfos;
uniform mat4 baseMetalRoughMatrix;
#endif

#ifdef METALLIC_REFLECTANCE
    uniform vec2 vMetallicReflectanceInfos;
    uniform mat4 metallicReflectanceMatrix;
#endif
#ifdef REFLECTANCE
    uniform vec2 vReflectanceInfos;
    uniform mat4 reflectanceMatrix;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

uniform vec4 cameraInfo;

// Reflection
#ifdef REFLECTION
    uniform vec2 vReflectionInfos;
    uniform mat4 reflectionMatrix;
#endif

// Clear Coat
#ifdef CLEARCOAT
    #if defined(CLEARCOAT_TEXTURE) || defined(CLEARCOAT_TEXTURE_ROUGHNESS)
        uniform vec4 vClearCoatInfos;
    #endif

    #ifdef CLEARCOAT_TEXTURE
        uniform mat4 clearCoatMatrix;
    #endif

    #ifdef CLEARCOAT_TEXTURE_ROUGHNESS
        uniform mat4 clearCoatRoughnessMatrix;
    #endif

    #ifdef CLEARCOAT_BUMP
        uniform vec2 vClearCoatBumpInfos;
        uniform mat4 clearCoatBumpMatrix;
    #endif

    #ifdef CLEARCOAT_TINT_TEXTURE
        uniform vec2 vClearCoatTintInfos;
        uniform mat4 clearCoatTintMatrix;
    #endif
#endif

// Iridescence
#ifdef IRIDESCENCE
    #if defined(IRIDESCENCE_TEXTURE) || defined(IRIDESCENCE_THICKNESS_TEXTURE)
        uniform vec4 vIridescenceInfos;
    #endif

    #ifdef IRIDESCENCE_TEXTURE
        uniform mat4 iridescenceMatrix;
    #endif

    #ifdef IRIDESCENCE_THICKNESS_TEXTURE
        uniform mat4 iridescenceThicknessMatrix;
    #endif
#endif

// Anisotropy
#ifdef ANISOTROPIC
    #ifdef ANISOTROPIC_TEXTURE
        uniform vec2 vAnisotropyInfos;
        uniform mat4 anisotropyMatrix;
    #endif
#endif

// Sheen
#ifdef SHEEN
    #if defined(SHEEN_TEXTURE) || defined(SHEEN_TEXTURE_ROUGHNESS)
        uniform vec4 vSheenInfos;
    #endif

    #ifdef SHEEN_TEXTURE
        uniform mat4 sheenMatrix;
    #endif

    #ifdef SHEEN_TEXTURE_ROUGHNESS
        uniform mat4 sheenRoughnessMatrix;
    #endif
#endif

// Sub Surface
#ifdef SUBSURFACE
    #ifdef SS_REFRACTION
        uniform vec4 vRefractionInfos;
        uniform mat4 refractionMatrix;
    #endif

    #ifdef SS_THICKNESSANDMASK_TEXTURE
        uniform vec2 vThicknessInfos;
        uniform mat4 thicknessMatrix;
    #endif

    #ifdef SS_REFRACTIONINTENSITY_TEXTURE
        uniform vec2 vRefractionIntensityInfos;
        uniform mat4 refractionIntensityMatrix;
    #endif

    #ifdef SS_TRANSLUCENCYINTENSITY_TEXTURE
        uniform vec2 vTranslucencyIntensityInfos;
        uniform mat4 translucencyIntensityMatrix;
    #endif

    #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
        uniform vec2 vTranslucencyColorInfos;
        uniform mat4 translucencyColorMatrix;
    #endif
#endif

#ifdef NORMAL
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #ifdef SPHERICAL_HARMONICS
                uniform vec3 vSphericalL00;
                uniform vec3 vSphericalL1_1;
                uniform vec3 vSphericalL10;
                uniform vec3 vSphericalL11;
                uniform vec3 vSphericalL2_2;
                uniform vec3 vSphericalL2_1;
                uniform vec3 vSphericalL20;
                uniform vec3 vSphericalL21;
                uniform vec3 vSphericalL22;
            #else
                uniform vec3 vSphericalX;
                uniform vec3 vSphericalY;
                uniform vec3 vSphericalZ;
                uniform vec3 vSphericalXX_ZZ;
                uniform vec3 vSphericalYY_ZZ;
                uniform vec3 vSphericalZZ;
                uniform vec3 vSphericalXY;
                uniform vec3 vSphericalYZ;
                uniform vec3 vSphericalZX;
            #endif
        #endif
    #endif
#endif

#ifdef DETAIL
uniform vec4 vDetailInfos;
uniform mat4 detailMatrix;
#endif

#include<decalVertexDeclaration>

#define ADDITIONAL_VERTEX_DECLARATION
