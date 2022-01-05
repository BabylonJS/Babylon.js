#ifdef SHEEN
    struct sheenOutParams
    {
        float sheenIntensity;
        vec3 sheenColor;
        float sheenRoughness;
    #ifdef SHEEN_LINKWITHALBEDO
        vec3 surfaceAlbedo;
    #endif
    #if defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
        float sheenAlbedoScaling;
    #endif
    #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
        vec3 finalSheenRadianceScaled;
    #endif
    #if DEBUGMODE > 0
        vec4 sheenMapData;
        vec3 sheenEnvironmentReflectance;
    #endif
    };

    #define pbr_inline
    #define inline
    void sheenBlock(
        in vec4 vSheenColor,
    #ifdef SHEEN_ROUGHNESS
        in float vSheenRoughness,
        #if defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_TEXTURE_ROUGHNESS_IDENTICAL) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
            in vec4 sheenMapRoughnessData,
        #endif
    #endif
        in float roughness,
    #ifdef SHEEN_TEXTURE
        in vec4 sheenMapData,
        in float sheenMapLevel,
    #endif
        in float reflectance,
    #ifdef SHEEN_LINKWITHALBEDO
        in vec3 baseColor,
        in vec3 surfaceAlbedo,
    #endif
    #ifdef ENVIRONMENTBRDF
        in float NdotV,
        in vec3 environmentBrdf,
    #endif
    #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
        in vec2 AARoughnessFactors,
        in vec3 vReflectionMicrosurfaceInfos,
        in vec2 vReflectionInfos,
        in vec3 vReflectionColor,
        in vec4 vLightingIntensity,
        #ifdef REFLECTIONMAP_3D
            in samplerCube reflectionSampler,
            in vec3 reflectionCoords,
        #else
            in sampler2D reflectionSampler,
            in vec2 reflectionCoords,
        #endif
        in float NdotVUnclamped,
        #ifndef LODBASEDMICROSFURACE
            #ifdef REFLECTIONMAP_3D
                in samplerCube reflectionSamplerLow,
                in samplerCube reflectionSamplerHigh,
            #else
                in sampler2D reflectionSamplerLow,
                in sampler2D reflectionSamplerHigh,
            #endif
        #endif
        #ifdef REALTIME_FILTERING
            in vec2 vReflectionFilteringInfo,
        #endif
        #if !defined(REFLECTIONMAP_SKYBOX) && defined(RADIANCEOCCLUSION)
            in float seo,
        #endif
        #if !defined(REFLECTIONMAP_SKYBOX) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
            in float eho,
        #endif
    #endif
        out sheenOutParams outParams
    )
    {
        float sheenIntensity = vSheenColor.a;

        #ifdef SHEEN_TEXTURE
            #if DEBUGMODE > 0
                outParams.sheenMapData = sheenMapData;
            #endif
        #endif

        #ifdef SHEEN_LINKWITHALBEDO
            float sheenFactor = pow5(1.0-sheenIntensity);
            vec3 sheenColor = baseColor.rgb*(1.0-sheenFactor);
            float sheenRoughness = sheenIntensity;
            outParams.surfaceAlbedo = surfaceAlbedo * sheenFactor;

            #ifdef SHEEN_TEXTURE
                sheenIntensity *= sheenMapData.a;
            #endif
        #else
            vec3 sheenColor = vSheenColor.rgb;
            #ifdef SHEEN_TEXTURE
                #ifdef SHEEN_GAMMATEXTURE
                    sheenColor.rgb *= toLinearSpace(sheenMapData.rgb);
                #else
                    sheenColor.rgb *= sheenMapData.rgb;
                #endif
                sheenColor.rgb *= sheenMapLevel;
            #endif
            
            #ifdef SHEEN_ROUGHNESS
                float sheenRoughness = vSheenRoughness;
                #ifdef SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE
                    #if defined(SHEEN_TEXTURE)
                        sheenRoughness *= sheenMapData.a;
                    #endif
                #elif defined(SHEEN_TEXTURE_ROUGHNESS)
                    #ifdef SHEEN_TEXTURE_ROUGHNESS_IDENTICAL
                        sheenRoughness *= sheenMapData.a;
                    #else
                        sheenRoughness *= sheenMapRoughnessData.a;
                    #endif
                #endif
            #else
                float sheenRoughness = roughness;
                #ifdef SHEEN_TEXTURE
                    sheenIntensity *= sheenMapData.a;
                #endif
            #endif

            // Sheen Lobe Layering.
            #if !defined(SHEEN_ALBEDOSCALING)
                sheenIntensity *= (1. - reflectance);
            #endif

            // Remap F0 and sheen.
            sheenColor *= sheenIntensity;
        #endif

        // _____________________________ Sheen Environment __________________________
        #ifdef ENVIRONMENTBRDF
                /*#ifdef SHEEN_SOFTER
                vec3 environmentSheenBrdf = vec3(0., 0., getBRDFLookupCharlieSheen(NdotV, sheenRoughness));
            #else*/
                #ifdef SHEEN_ROUGHNESS
                    vec3 environmentSheenBrdf = getBRDFLookup(NdotV, sheenRoughness);
                #else
                    vec3 environmentSheenBrdf = environmentBrdf;
                #endif
            /*#endif*/
        #endif

        #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
            float sheenAlphaG = convertRoughnessToAverageSlope(sheenRoughness);

            #ifdef SPECULARAA
                // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
                sheenAlphaG += AARoughnessFactors.y;
            #endif

            vec4 environmentSheenRadiance = vec4(0., 0., 0., 0.);

            sampleReflectionTexture(
                sheenAlphaG,
                vReflectionMicrosurfaceInfos,
                vReflectionInfos,
                vReflectionColor,
            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                NdotVUnclamped,
            #endif
            #ifdef LINEARSPECULARREFLECTION
                sheenRoughness,
            #endif
                reflectionSampler,
                reflectionCoords,
            #ifndef LODBASEDMICROSFURACE
                reflectionSamplerLow,
                reflectionSamplerHigh,
            #endif
            #ifdef REALTIME_FILTERING
                vReflectionFilteringInfo,
            #endif
                environmentSheenRadiance
            );

            vec3 sheenEnvironmentReflectance = getSheenReflectanceFromBRDFLookup(sheenColor, environmentSheenBrdf);

            #if !defined(REFLECTIONMAP_SKYBOX) && defined(RADIANCEOCCLUSION)
                sheenEnvironmentReflectance *= seo;
            #endif
            #if !defined(REFLECTIONMAP_SKYBOX) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
                sheenEnvironmentReflectance *= eho;
            #endif

            #if DEBUGMODE > 0
                outParams.sheenEnvironmentReflectance = sheenEnvironmentReflectance;
            #endif

            outParams.finalSheenRadianceScaled = 
                environmentSheenRadiance.rgb *
                sheenEnvironmentReflectance *
                vLightingIntensity.z;

            // #if defined(MS_BRDF_ENERGY_CONSERVATION)
                // The sheen does not use the same BRDF so not energy conservation is possible
                // Should be less a problem as it is usually not metallic
                // finalSheenScaled *= energyConservationFactor;
            // #endif
        #endif

        #if defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
            // Sheen Lobe Layering.
            // environmentSheenBrdf.b is (integral on hemisphere)[f_sheen*cos(theta)*dtheta*dphi], which happens to also be the directional albedo needed for albedo scaling.
            // See section 6.2.3 in https://dassaultsystemes-technology.github.io/EnterprisePBRShadingModel/spec-2021x.md.html#components/sheen
            outParams.sheenAlbedoScaling = 1.0 - sheenIntensity * max(max(sheenColor.r, sheenColor.g), sheenColor.b) * environmentSheenBrdf.b;
        #endif

        // _____________________________ Out parameters __________________________
        outParams.sheenIntensity = sheenIntensity;
        outParams.sheenColor = sheenColor;
        outParams.sheenRoughness = sheenRoughness;
    }
#endif
