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
#endif
