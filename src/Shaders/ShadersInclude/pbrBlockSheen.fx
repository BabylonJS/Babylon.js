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

    #define inline
    void sheenBlock(
        const in vec4 vSheenColor,
    #ifdef SHEEN_ROUGHNESS
        const in float vSheenRoughness,
    #endif
        const in float roughness,
    #ifdef SHEEN_TEXTURE
        const in vec4 sheenMapData,
    #endif
        const in float reflectance,
    #ifdef SHEEN_LINKWITHALBEDO
        const in vec3 baseColor,
        const in vec3 surfaceAlbedo,
    #endif
    #ifdef ENVIRONMENTBRDF
        const in float NdotV,
        const in vec3 environmentBrdf,
    #endif
    #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
        const in vec2 AARoughnessFactors,
        const in vec3 vReflectionMicrosurfaceInfos,
        const in vec2 vReflectionInfos,
        const in vec3 vReflectionColor,
        const in vec4 vLightingIntensity,
        #ifdef REFLECTIONMAP_3D
            const in samplerCube reflectionSampler,
            const in vec3 reflectionCoords,
        #else
            const in sampler2D reflectionSampler,
            const in vec2 reflectionCoords,
        #endif
        const in float NdotVUnclamped,
        #ifndef LODBASEDMICROSFURACE
            #ifdef REFLECTIONMAP_3D
                const in samplerCube reflectionSamplerLow,
                const in samplerCube reflectionSamplerHigh,
            #else
                const in sampler2D reflectionSamplerLow,
                const in sampler2D reflectionSamplerHigh,
            #endif
        #endif
        #if !defined(REFLECTIONMAP_SKYBOX) && defined(RADIANCEOCCLUSION)
            const in float seo,
        #endif
        #if !defined(REFLECTIONMAP_SKYBOX) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
            const in float eho,
        #endif
    #endif
        out sheenOutParams outParams
    )
    {
        float sheenIntensity = vSheenColor.a;

        #ifdef SHEEN_TEXTURE
            sheenIntensity *= sheenMapData.a;
            #if DEBUGMODE > 0
                outParams.sheenMapData = sheenMapData;
            #endif
        #endif

        #ifdef SHEEN_LINKWITHALBEDO
            float sheenFactor = pow5(1.0-sheenIntensity);
            vec3 sheenColor = baseColor.rgb*(1.0-sheenFactor);
            float sheenRoughness = sheenIntensity;
            outParams.surfaceAlbedo = surfaceAlbedo * sheenFactor;
        #else
            vec3 sheenColor = vSheenColor.rgb;
            #ifdef SHEEN_TEXTURE
                sheenColor.rgb *= sheenMapData.rgb;
            #endif
            
            #ifdef SHEEN_ROUGHNESS
                float sheenRoughness = vSheenRoughness;
            #else
                float sheenRoughness = roughness;
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
