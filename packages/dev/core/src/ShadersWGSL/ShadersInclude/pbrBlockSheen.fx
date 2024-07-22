#ifdef SHEEN
    struct sheenOutParams
    {
        sheenIntensity: f32,
        sheenColor: vec3f,
        sheenRoughness: f32,
    #ifdef SHEEN_LINKWITHALBEDO
        surfaceAlbedo: vec3f,
    #endif
    #if defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
        sheenAlbedoScaling: f32,
    #endif
    #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
        finalSheenRadianceScaled: vec3f,
    #endif
    #if DEBUGMODE > 0
        #ifdef SHEEN_TEXTURE
            sheenMapData: vec4f,
        #endif
        #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
            sheenEnvironmentReflectance: vec3f
        #endif
    #endif
    };

    #define pbr_inline
    var sheenBlock: voidnull(
        in var vSheenColor: vec4f,
    #ifdef SHEEN_ROUGHNESS
        in var vSheenRoughness: f32,
        #if defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
            in var sheenMapRoughnessData: vec4f,
        #endif
    #endif
        in var roughness: f32,
    #ifdef SHEEN_TEXTURE
        in var sheenMapData: vec4f,
        in var sheenMapLevel: f32,
    #endif
        in var reflectance: f32,
    #ifdef SHEEN_LINKWITHALBEDO
        in var baseColor: vec3f,
        in var surfaceAlbedo: vec3f,
    #endif
    #ifdef ENVIRONMENTBRDF
        in var NdotV: f32,
        in var environmentBrdf: vec3f,
    #endif
    #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
        in var AARoughnessFactors: vec2f,
        in var vReflectionMicrosurfaceInfos: vec3f,
        in var vReflectionInfos: vec2f,
        in var vReflectionColor: vec3f,
        in var vLightingIntensity: vec4f,
        #ifdef REFLECTIONMAP_3D
            in samplerCube reflectionSampler,
            in var reflectionCoords: vec3f,
        #else
            in sampler2D reflectionSampler,
            in var reflectionCoords: vec2f,
        #endif
        in var NdotVUnclamped: f32,
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
            in var vReflectionFilteringInfo: vec2f,
        #endif
        #if !defined(REFLECTIONMAP_SKYBOX) && defined(RADIANCEOCCLUSION)
            in var seo: f32,
        #endif
        #if !defined(REFLECTIONMAP_SKYBOX) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
            in var eho: f32,
        #endif
    #endif
        out sheenOutParams outParams
    )
    {
        var sheenIntensity: f32 = vSheenColor.a;

        #ifdef SHEEN_TEXTURE
            #if DEBUGMODE > 0
                outParams.sheenMapData = sheenMapData;
            #endif
        #endif

        #ifdef SHEEN_LINKWITHALBEDO
            var sheenFactor: f32 = pow5(1.0-sheenIntensity);
            var sheenColor: vec3f = baseColor.rgb*(1.0-sheenFactor);
            var sheenRoughness: f32 = sheenIntensity;
            outParams.surfaceAlbedo = surfaceAlbedo * sheenFactor;

            #ifdef SHEEN_TEXTURE
                sheenIntensity *= sheenMapData.a;
            #endif
        #else
            var sheenColor: vec3f = vSheenColor.rgb;
            #ifdef SHEEN_TEXTURE
                #ifdef SHEEN_GAMMATEXTURE
                    sheenColor.rgb *= toLinearSpace(sheenMapData.rgb);
                #else
                    sheenColor.rgb *= sheenMapData.rgb;
                #endif
                sheenColor.rgb *= sheenMapLevel;
            #endif
            
            #ifdef SHEEN_ROUGHNESS
                var sheenRoughness: f32 = vSheenRoughness;
                #ifdef SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE
                    #if defined(SHEEN_TEXTURE)
                        sheenRoughness *= sheenMapData.a;
                    #endif
                #elif defined(SHEEN_TEXTURE_ROUGHNESS)
                    sheenRoughness *= sheenMapRoughnessData.a;
                #endif
            #else
                var sheenRoughness: f32 = roughness;
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
                var environmentSheenBrdf: vec3f =  vec3f(0., 0., getBRDFLookupCharlieSheen(NdotV, sheenRoughness));
            #else*/
                #ifdef SHEEN_ROUGHNESS
                    var environmentSheenBrdf: vec3f = getBRDFLookup(NdotV, sheenRoughness);
                #else
                    var environmentSheenBrdf: vec3f = environmentBrdf;
                #endif
            /*#endif*/
        #endif

        #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
            var sheenAlphaG: f32 = convertRoughnessToAverageSlope(sheenRoughness);

            #ifdef SPECULARAA
                // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
                sheenAlphaG += AARoughnessFactors.y;
            #endif

            var environmentSheenRadiance: vec4f =  vec4f(0., 0., 0., 0.);

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

            var sheenEnvironmentReflectance: vec3f = getSheenReflectanceFromBRDFLookup(sheenColor, environmentSheenBrdf);

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
