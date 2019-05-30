#ifdef ENVIRONMENTBRDF
    #ifdef WEBGPU
        layout(set = 2, binding = 1) uniform texture2D environmentBrdfSamplerTexture;
        layout(set = 2, binding = 2) uniform sampler environmentBrdfSamplerSampler;
        #define environmentBrdfSampler sampler2D(environmentBrdfSamplerTexture, environmentBrdfSamplerSampler)
    #else
        uniform sampler2D environmentBrdfSampler;
    #endif
#endif

// Reflection
#ifdef REFLECTION
    #ifdef REFLECTIONMAP_3D
        #define sampleReflection(s, c) textureCube(s, c)

        #ifdef WEBGPU
            layout(set = 2, binding = 3) uniform textureCube reflectionSamplerTexture;
            layout(set = 2, binding = 4) uniform sampler reflectionSamplerSampler;
            #define reflectionSampler samplerCube(reflectionSamplerTexture, reflectionSamplerSampler)
        #else
            uniform samplerCube reflectionSampler;
        #endif

        #ifdef LODBASEDMICROSFURACE
            #define sampleReflectionLod(s, c, l) textureCubeLodEXT(s, c, l)
        #else
            uniform samplerCube reflectionSamplerLow;
            uniform samplerCube reflectionSamplerHigh;
        #endif

        #ifdef USEIRRADIANCEMAP
            uniform samplerCube irradianceSampler;
        #endif
    #else
        #define sampleReflection(s, c) texture2D(s, c)

        uniform sampler2D reflectionSampler;

        #ifdef LODBASEDMICROSFURACE
            #define sampleReflectionLod(s, c, l) texture2DLodEXT(s, c, l)
        #else
            uniform samplerCube reflectionSamplerLow;
            uniform samplerCube reflectionSamplerHigh;
        #endif

        #ifdef USEIRRADIANCEMAP
            uniform samplerCube irradianceSampler;
        #endif
    #endif

    #ifdef REFLECTIONMAP_SKYBOX
        #ifdef WEBGPU
            layout(location = 4) in vec3 vPositionUVW;
        #else
            varying vec3 vPositionUVW;
        #endif
    #else
        #if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
            varying vec3 vDirectionW;
        #endif
    #endif
#endif

#ifdef ALBEDO
    #if ALBEDODIRECTUV == 1
        #define vAlbedoUV vMainUV1
    #elif ALBEDODIRECTUV == 2
        #define vAlbedoUV vMainUV2
    #else
        varying vec2 vAlbedoUV;
    #endif

    #ifdef WEBGPU
        layout(set = 2, binding = 5) uniform texture2D albedoSamplerTexture;
        layout(set = 2, binding = 6) uniform sampler albedoSamplerSampler;
        #define albedoSampler sampler2D(albedoSamplerTexture, albedoSamplerSampler)
    #else
        uniform sampler2D albedoSampler;
    #endif
#endif

#ifdef REFLECTIVITY
    #if REFLECTIVITYDIRECTUV == 1
        #define vReflectivityUV vMainUV1
    #elif REFLECTIVITYDIRECTUV == 2
        #define vReflectivityUV vMainUV2
    #else
        varying vec2 vReflectivityUV;
    #endif

    #ifdef WEBGPU
        layout(set = 2, binding = 7) uniform texture2D reflectivitySamplerTexture;
        layout(set = 2, binding = 8) uniform sampler reflectivitySamplerSampler;
        #define reflectivitySampler sampler2D(reflectivitySamplerTexture, reflectivitySamplerSampler)
    #else
        uniform sampler2D reflectivitySampler;
    #endif
#endif

#ifdef AMBIENT
    #if AMBIENTDIRECTUV == 1
        #define vAmbientUV vMainUV1
    #elif AMBIENTDIRECTUV == 2
        #define vAmbientUV vMainUV2
    #else
        varying vec2 vAmbientUV;
    #endif

    #ifdef WEBGPU
        layout(set = 2, binding = 9) uniform texture2D ambientSamplerTexture;
        layout(set = 2, binding = 10) uniform sampler ambientSamplerSampler;
        #define ambientSampler sampler2D(ambientSamplerTexture, ambientSamplerSampler)
    #else
        uniform sampler2D ambientSampler;
    #endif
#endif

#ifdef EMISSIVE
    #if EMISSIVEDIRECTUV == 1
        #define vEmissiveUV vMainUV1
    #elif EMISSIVEDIRECTUV == 2
        #define vEmissiveUV vMainUV2
    #else
        varying vec2 vEmissiveUV;
    #endif

    #ifdef WEBGPU
        layout(set = 2, binding = 11) uniform texture2D emissiveSamplerTexture;
        layout(set = 2, binding = 12) uniform sampler emissiveSamplerSampler;
        #define emissiveSampler sampler2D(emissiveSamplerTexture, emissiveSamplerSampler)
    #else
        uniform sampler2D emissiveSampler;
    #endif
#endif

#ifdef BUMP
    #if BUMPDIRECTUV == 1
        #define vBumpUV vMainUV1
    #elif BUMPDIRECTUV == 2
        #define vBumpUV vMainUV2
    #else
        varying vec2 vBumpUV;
    #endif

    #ifdef WEBGPU
        layout(set = 2, binding = 13) uniform texture2D bumpSamplerTexture;
        layout(set = 2, binding = 14) uniform sampler bumpSamplerSampler;
        #define bumpSampler sampler2D(bumpSamplerTexture, bumpSamplerSampler)
    #else
        uniform sampler2D bumpSampler;
    #endif
#endif

#ifdef OPACITY
    #if OPACITYDIRECTUV == 1
        #define vOpacityUV vMainUV1
    #elif OPACITYDIRECTUV == 2
        #define vOpacityUV vMainUV2
    #else
        varying vec2 vOpacityUV;
    #endif
    uniform sampler2D opacitySampler;
#endif

#ifdef LIGHTMAP
    #if LIGHTMAPDIRECTUV == 1
        #define vLightmapUV vMainUV1
    #elif LIGHTMAPDIRECTUV == 2
        #define vLightmapUV vMainUV2
    #else
        varying vec2 vLightmapUV;
    #endif
    uniform sampler2D lightmapSampler;
#endif

#ifdef MICROSURFACEMAP
    #if MICROSURFACEMAPDIRECTUV == 1
        #define vMicroSurfaceSamplerUV vMainUV1
    #elif MICROSURFACEMAPDIRECTUV == 2
        #define vMicroSurfaceSamplerUV vMainUV2
    #else
        varying vec2 vMicroSurfaceSamplerUV;
    #endif
    uniform sampler2D microSurfaceSampler;
#endif

#ifdef CLEARCOAT
    #ifdef CLEARCOAT_TEXTURE
        #if CLEARCOAT_TEXTUREDIRECTUV == 1
            #define vClearCoatUV vMainUV1
        #elif CLEARCOAT_TEXTUREDIRECTUV == 2
            #define vClearCoatUV vMainUV2
        #else
            varying vec2 vClearCoatUV;
        #endif
        uniform sampler2D clearCoatSampler;
    #endif

    #ifdef CLEARCOAT_BUMP
        #if CLEARCOAT_BUMPDIRECTUV == 1
            #define vClearCoatBumpUV vMainUV1
        #elif CLEARCOAT_BUMPDIRECTUV == 2
            #define vClearCoatBumpUV vMainUV2
        #else
            varying vec2 vClearCoatBumpUV;
        #endif
        uniform sampler2D clearCoatBumpSampler;
    #endif

    #ifdef CLEARCOAT_TINT_TEXTURE
        #if CLEARCOAT_TINT_TEXTUREDIRECTUV == 1
            #define vClearCoatTintUV vMainUV1
        #elif CLEARCOAT_TINT_TEXTUREDIRECTUV == 2
            #define vClearCoatTintUV vMainUV2
        #else
            varying vec2 vClearCoatTintUV;
        #endif
        uniform sampler2D clearCoatTintSampler;
    #endif
#endif

#ifdef SHEEN
    #ifdef SHEEN_TEXTURE
        #if SHEEN_TEXTUREDIRECTUV == 1
            #define vSheenUV vMainUV1
        #elif SHEEN_TEXTUREDIRECTUV == 2
            #define vSheenUV vMainUV2
        #else
            varying vec2 vSheenUV;
        #endif
        uniform sampler2D sheenSampler;
    #endif
#endif

#ifdef ANISOTROPIC
    #ifdef ANISOTROPIC_TEXTURE
        #if ANISOTROPIC_TEXTUREDIRECTUV == 1
            #define vAnisotropyUV vMainUV1
        #elif ANISOTROPIC_TEXTUREDIRECTUV == 2
            #define vAnisotropyUV vMainUV2
        #else
            varying vec2 vAnisotropyUV;
        #endif
        uniform sampler2D anisotropySampler;
    #endif
#endif

// SUBSURFACE
#ifdef SUBSURFACE
    #ifdef SS_REFRACTION
        #ifdef SS_REFRACTIONMAP_3D
            #define sampleRefraction(s, c) textureCube(s, c)
            
            uniform samplerCube refractionSampler;

            #ifdef LODBASEDMICROSFURACE
                #define sampleRefractionLod(s, c, l) textureCubeLodEXT(s, c, l)
            #else
                uniform samplerCube refractionSamplerLow;
                uniform samplerCube refractionSamplerHigh;
            #endif
        #else
            #define sampleRefraction(s, c) texture2D(s, c)
            
            uniform sampler2D refractionSampler;

            #ifdef LODBASEDMICROSFURACE
                #define sampleRefractionLod(s, c, l) texture2DLodEXT(s, c, l)
            #else
                uniform samplerCube refractionSamplerLow;
                uniform samplerCube refractionSamplerHigh;
            #endif
        #endif
    #endif

    #ifdef SS_THICKNESSANDMASK_TEXTURE
        #if SS_THICKNESSANDMASK_TEXTUREDIRECTUV == 1
            #define vThicknessUV vMainUV1
        #elif SS_THICKNESSANDMASK_TEXTUREDIRECTUV == 2
            #define vThicknessUV vMainUV2
        #else
            varying vec2 vThicknessUV;
        #endif
        uniform sampler2D thicknessSampler;
    #endif
#endif