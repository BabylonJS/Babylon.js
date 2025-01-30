#ifdef REFLECTION
    struct reflectionOutParams
    {
        environmentRadiance: vec4f
        , environmentIrradiance: vec3f
    #ifdef REFLECTIONMAP_3D
        , reflectionCoords: vec3f
    #else
        , reflectionCoords: vec2f
    #endif
    #ifdef SS_TRANSLUCENCY
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                , irradianceVector: vec3f
            #endif
        #endif
    #endif
    };

    #define pbr_inline
    #ifdef REFLECTIONMAP_3D
        fn createReflectionCoords(
            vPositionW: vec3f,
            normalW: vec3f,
        #ifdef ANISOTROPIC
            anisotropicOut: anisotropicOutParams,
        #endif
        ) -> vec3f
        {
            var reflectionCoords: vec3f;
    #else
        fn createReflectionCoords(
            vPositionW: vec3f,
            normalW: vec3f,
        #ifdef ANISOTROPIC
            anisotropicOut: anisotropicOutParams,
        #endif
        ) -> vec2f
        {    
            var reflectionCoords: vec2f;
    #endif
        #ifdef ANISOTROPIC
            var reflectionVector: vec3f = computeReflectionCoords( vec4f(vPositionW, 1.0), anisotropicOut.anisotropicNormal);
        #else
            var reflectionVector: vec3f = computeReflectionCoords( vec4f(vPositionW, 1.0), normalW);
        #endif

        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef REFLECTIONMAP_3D
            reflectionCoords = reflectionVector;
        #else
            reflectionCoords = reflectionVector.xy;
            #ifdef REFLECTIONMAP_PROJECTION
                reflectionCoords /= reflectionVector.z;
            #endif
            reflectionCoords.y = 1.0 - reflectionCoords.y;
        #endif

        return reflectionCoords;
    }

    #define pbr_inline
    fn sampleReflectionTexture(
        alphaG: f32
        , vReflectionMicrosurfaceInfos: vec3f
        , vReflectionInfos: vec2f
        , vReflectionColor: vec3f
    #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
        , NdotVUnclamped: f32
    #endif
    #ifdef LINEARSPECULARREFLECTION
        , roughness: f32
    #endif
    #ifdef REFLECTIONMAP_3D
        , reflectionSampler: texture_cube<f32>
        , reflectionSamplerSampler: sampler
        , reflectionCoords: vec3f
    #else
        , reflectionSampler: texture_2d<f32>
        , reflectionSamplerSampler: sampler
        , reflectionCoords: vec2f
    #endif
    #ifndef LODBASEDMICROSFURACE
        #ifdef REFLECTIONMAP_3D
            , reflectionLowSampler: texture_cube<f32>
            , reflectionLowSamplerSampler: sampler
            , reflectionHighSampler: texture_cube<f32>
            , reflectionHighSamplerSampler: sampler
        #else
            , reflectionLowSampler: texture_2d<f32>
            , reflectionLowSamplerSampler: sampler
            , reflectionHighSampler: texture_2d<f32>
            , reflectionHighSamplerSampler: sampler
        #endif
    #endif
    #ifdef REALTIME_FILTERING
        , vReflectionFilteringInfo: vec2f
    #endif        
    ) -> vec4f
    {
        var environmentRadiance: vec4f;
        // _____________________________ 2D vs 3D Maps ________________________________
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            var reflectionLOD: f32 = getLodFromAlphaGNdotV(vReflectionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
        #elif defined(LINEARSPECULARREFLECTION)
            var reflectionLOD: f32 = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, roughness);
        #else
            var reflectionLOD: f32 = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG);
        #endif

        #ifdef LODBASEDMICROSFURACE
            // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
            reflectionLOD = reflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;

            #ifdef LODINREFLECTIONALPHA
                // Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection
                // is constrained to appropriate LOD levels in order to prevent aliasing.
                // The environment map is first sampled without custom LOD selection to determine
                // the hardware-selected LOD, and this is then used to constrain the final LOD selection
                // so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry
                // where the normal is varying rapidly).

                // Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
                // manual calculation via derivatives is also possible, but for simplicity we use the
                // hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
                var automaticReflectionLOD: f32 = UNPACK_LOD(textureSample(reflectionSampler, reflectionSamplerSampler, reflectionCoords).a);
                var requestedReflectionLOD: f32 = max(automaticReflectionLOD, reflectionLOD);
            #else
                var requestedReflectionLOD: f32 = reflectionLOD;
            #endif
            #ifdef REALTIME_FILTERING
                environmentRadiance =  vec4f(radiance(alphaG, reflectionSampler, reflectionSamplerSampler, reflectionCoords, vReflectionFilteringInfo), 1.0);
            #else
                environmentRadiance = textureSampleLevel(reflectionSampler, reflectionSamplerSampler, reflectionCoords, reflectionLOD);
            #endif
        #else
            var lodReflectionNormalized: f32 = saturate(reflectionLOD / log2(vReflectionMicrosurfaceInfos.x));
            var lodReflectionNormalizedDoubled: f32 = lodReflectionNormalized * 2.0;

            var environmentMid: vec4f = textureSample(reflectionSampler, reflectionSamplerSampler, reflectionCoords);
            if (lodReflectionNormalizedDoubled < 1.0){
                environmentRadiance = mix(
                    textureSample(reflectionHighSampler, reflectionHighSamplerSampler, reflectionCoords),
                    environmentMid,
                    lodReflectionNormalizedDoubled
                );
            } else {
                environmentRadiance = mix(
                    environmentMid,
                    textureSample(reflectionLowSampler, reflectionLowSamplerSampler, reflectionCoords),
                    lodReflectionNormalizedDoubled - 1.0
                );
            }
        #endif

        var envRadiance = environmentRadiance.rgb;

        #ifdef RGBDREFLECTION
            envRadiance = fromRGBD(environmentRadiance);
        #endif

        #ifdef GAMMAREFLECTION
            envRadiance = toLinearSpaceVec3(environmentRadiance.rgb);
        #endif

        // _____________________________ Levels _____________________________________
        envRadiance *= vReflectionInfos.x;
        envRadiance *= vReflectionColor.rgb;

        return vec4f(envRadiance, environmentRadiance.a);
    }

    #define pbr_inline
    fn reflectionBlock(
        vPositionW: vec3f
        , normalW: vec3f
        , alphaG: f32
        , vReflectionMicrosurfaceInfos: vec3f
        , vReflectionInfos: vec2f
        , vReflectionColor: vec3f
    #ifdef ANISOTROPIC
        , anisotropicOut: anisotropicOutParams
    #endif
    #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
        , NdotVUnclamped: f32
    #endif
    #ifdef LINEARSPECULARREFLECTION
        , roughness: f32
    #endif
    #ifdef REFLECTIONMAP_3D
        , reflectionSampler: texture_cube<f32>
        , reflectionSamplerSampler: sampler
    #else
        , reflectionSampler: texture_2d<f32>
        , reflectionSamplerSampler: sampler
    #endif
    #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
        , vEnvironmentIrradiance: vec3f
    #endif
    #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
        , reflectionMatrix: mat4x4f
    #endif
    #ifdef USEIRRADIANCEMAP
        #ifdef REFLECTIONMAP_3D
            , irradianceSampler: texture_cube<f32>
            , irradianceSamplerSampler: sampler        
        #else
            , irradianceSampler: texture_2d<f32>
            , irradianceSamplerSampler: sampler        
        #endif
    #endif
    #ifndef LODBASEDMICROSFURACE
        #ifdef REFLECTIONMAP_3D
            , reflectionLowSampler: texture_cube<f32>
            , reflectionLowSamplerSampler: sampler            
            , reflectionHighSampler: texture_cube<f32>
            , reflectionHighSamplerSampler: sampler   
        #else
            , reflectionLowSampler: texture_2d<f32>
            , reflectionLowSamplerSampler: sampler            
            , reflectionHighSampler: texture_2d<f32>
            , reflectionHighSamplerSampler: sampler   
        #endif
    #endif
    #ifdef REALTIME_FILTERING
        , vReflectionFilteringInfo: vec2f
        #ifdef IBL_CDF_FILTERING
            , icdfSampler: texture_2d<f32>
            , icdfSamplerSampler: sampler
        #endif
    #endif
    ) -> reflectionOutParams
    {
        var outParams: reflectionOutParams;
        // _____________________________ Radiance ________________________________
        var environmentRadiance: vec4f =  vec4f(0., 0., 0., 0.);

        #ifdef REFLECTIONMAP_3D
            var reflectionCoords: vec3f =  vec3f(0.);
        #else
            var reflectionCoords: vec2f =  vec2f(0.);
        #endif

        reflectionCoords = createReflectionCoords(
            vPositionW,
            normalW,
        #ifdef ANISOTROPIC
            anisotropicOut,
        #endif            
        );

        environmentRadiance = sampleReflectionTexture(
            alphaG
            , vReflectionMicrosurfaceInfos
            , vReflectionInfos
            , vReflectionColor
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            , NdotVUnclamped
        #endif
        #ifdef LINEARSPECULARREFLECTION
            , roughness
        #endif
        #ifdef REFLECTIONMAP_3D
            , reflectionSampler
            , reflectionSamplerSampler
            , reflectionCoords
        #else
            , reflectionSampler
            , reflectionSamplerSampler
            , reflectionCoords
        #endif
        #ifndef LODBASEDMICROSFURACE
            , reflectionLowSampler
            , reflectionLowSamplerSampler
            , reflectionHighSampler
            , reflectionHighSamplerSampler
        #endif
        #ifdef REALTIME_FILTERING
            , vReflectionFilteringInfo
        #endif            
        );

        // _____________________________ Irradiance ________________________________
        var environmentIrradiance: vec3f =  vec3f(0., 0., 0.);

        #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
            #ifdef ANISOTROPIC
                var irradianceVector: vec3f =  (reflectionMatrix *  vec4f(anisotropicOut.anisotropicNormal, 0)).xyz;
            #else
                var irradianceVector: vec3f =  (reflectionMatrix *  vec4f(normalW, 0)).xyz;
            #endif

            #ifdef REFLECTIONMAP_OPPOSITEZ
                irradianceVector.z *= -1.0;
            #endif

            #ifdef INVERTCUBICMAP
                irradianceVector.y *= -1.0;
            #endif
        #endif
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                environmentIrradiance = vEnvironmentIrradiance;
            #else
                #if defined(REALTIME_FILTERING)
                    environmentIrradiance = irradiance(reflectionSampler, reflectionSamplerSampler, irradianceVector, vReflectionFilteringInfo
                    #ifdef IBL_CDF_FILTERING
                        , icdfSampler
                        , icdfSamplerSampler
                    #endif
                    );
                #else
                    environmentIrradiance = computeEnvironmentIrradiance(irradianceVector);
                #endif

                #ifdef SS_TRANSLUCENCY
                    outParams.irradianceVector = irradianceVector;
                #endif
            #endif
        #elif defined(USEIRRADIANCEMAP)
            #ifdef REFLECTIONMAP_3D
                var environmentIrradiance4: vec4f = textureSample(irradianceSampler, irradianceSamplerSampler, irradianceVector);
            #else
                var environmentIrradiance4: vec4f = textureSample(irradianceSampler, irradianceSamplerSampler, reflectionCoords);
            #endif
            environmentIrradiance = environmentIrradiance4.rgb;
            #ifdef RGBDREFLECTION
                environmentIrradiance = fromRGBD(environmentIrradiance4);
            #endif

            #ifdef GAMMAREFLECTION
                environmentIrradiance = toLinearSpaceVec3(environmentIrradiance.rgb);
            #endif
        #endif

        environmentIrradiance *= vReflectionColor.rgb;
        #ifdef MIX_IBL_RADIANCE_WITH_IRRADIANCE
            outParams.environmentRadiance = vec4f(mix(environmentRadiance.rgb, environmentIrradiance, alphaG), environmentRadiance.a);
        #else
            outParams.environmentRadiance = environmentRadiance;
        #endif
        outParams.environmentIrradiance = environmentIrradiance;
        outParams.reflectionCoords = reflectionCoords;

        return outParams;
    }
#endif
