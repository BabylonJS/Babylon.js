uniform mat4 view;
uniform mat4 viewProjection;

uniform mat4 world;

#ifdef ALBEDO
uniform mat4 albedoMatrix;
uniform vec2 vAlbedoInfos;
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

#ifdef REFLECTIVITY 
uniform vec3 vReflectivityInfos;
uniform mat4 reflectivityMatrix;
#endif

#ifdef METALLIC_REFLECTANCE
uniform vec2 vMetallicReflectanceInfos;
uniform mat4 metallicReflectanceMatrix;
#endif

#ifdef MICROSURFACEMAP
uniform vec2 vMicroSurfaceSamplerInfos;
uniform mat4 microSurfaceSamplerMatrix;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Reflection
#ifdef REFLECTION
    uniform vec2 vReflectionInfos;
    uniform mat4 reflectionMatrix;
#endif

// Clear Coat
#ifdef CLEARCOAT
    #ifdef CLEARCOAT_TEXTURE
        uniform vec2 vClearCoatInfos;
        uniform mat4 clearCoatMatrix;
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

// Anisotropy
#ifdef ANISOTROPIC
    #ifdef ANISOTROPIC_TEXTURE
        uniform vec2 vAnisotropyInfos;
        uniform mat4 anisotropyMatrix;
    #endif
#endif

// Sheen
#ifdef SHEEN
    #ifdef SHEEN_TEXTURE
        uniform vec2 vSheenInfos;
        uniform mat4 sheenMatrix;
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

