#ifdef REFLECTION
    struct reflectionOutParams
    {
        var environmentRadiance: vec4f;
        var environmentIrradiance: vec3f;
    #ifdef REFLECTIONMAP_3D
        var reflectionCoords: vec3f;
    #else
        var reflectionCoords: vec2f;
    #endif
    #ifdef SS_TRANSLUCENCY
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                var irradianceVector: vec3f;
            #endif
        #endif
    #endif
    };

    #define pbr_inline
    var createReflectionCoords: voidnull(
        in var vPositionW: vec3f,
        in var normalW: vec3f,
    #ifdef ANISOTROPIC
        in anisotropicOutParams anisotropicOut,
    #endif
    #ifdef REFLECTIONMAP_3D
        reflectionCoords: ptr<function, vec3f>
    #else
        reflectionCoords: ptr<function, vec2f>
    #endif
    )
    {
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
    }

    #define pbr_inline
    #define inline
    var sampleReflectionTexture: voidnull(
        in var alphaG: f32,
        in var vReflectionMicrosurfaceInfos: vec3f,
        in var vReflectionInfos: vec2f,
        in var vReflectionColor: vec3f,
    #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
        in var NdotVUnclamped: f32,
    #endif
    #ifdef LINEARSPECULARREFLECTION
        in var roughness: f32,
    #endif
    #ifdef REFLECTIONMAP_3D
        in samplerCube reflectionSampler,
        const reflectionCoords: vec3f,
    #else
        in sampler2D reflectionSampler,
        const reflectionCoords: vec2f,
    #endif
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
        environmentRadiance: ptr<function, vec4f>
    )
    {
        // _____________________________ 2D vs 3D Maps ________________________________
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            var reflectionLOD: f32 = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
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
                var automaticReflectionLOD: f32 = UNPACK_LOD(sampleReflection(reflectionSampler, reflectionCoords).a);
                var requestedReflectionLOD: f32 = max(automaticReflectionLOD, reflectionLOD);
            #else
                var requestedReflectionLOD: f32 = reflectionLOD;
            #endif
            #ifdef REALTIME_FILTERING
                environmentRadiance =  vec4f(radiance(alphaG, reflectionSampler, reflectionCoords, vReflectionFilteringInfo), 1.0);
            #else
                environmentRadiance = sampleReflectionLod(reflectionSampler, reflectionCoords, reflectionLOD);
            #endif
        #else
            var lodReflectionNormalized: f32 = saturate(reflectionLOD / log2(vReflectionMicrosurfaceInfos.x));
            var lodReflectionNormalizedDoubled: f32 = lodReflectionNormalized * 2.0;

            var environmentMid: vec4f = sampleReflection(reflectionSampler, reflectionCoords);
            if (lodReflectionNormalizedDoubled < 1.0){
                environmentRadiance = mix(
                    sampleReflection(reflectionSamplerHigh, reflectionCoords),
                    environmentMid,
                    lodReflectionNormalizedDoubled
                );
            } else {
                environmentRadiance = mix(
                    environmentMid,
                    sampleReflection(reflectionSamplerLow, reflectionCoords),
                    lodReflectionNormalizedDoubled - 1.0
                );
            }
        #endif

        #ifdef RGBDREFLECTION
            environmentRadiance.rgb = fromRGBD(environmentRadiance);
        #endif

        #ifdef GAMMAREFLECTION
            environmentRadiance.rgb = toLinearSpace(environmentRadiance.rgb);
        #endif

        // _____________________________ Levels _____________________________________
        environmentRadiance.rgb *= vReflectionInfos.x;
        environmentRadiance.rgb *= vReflectionColor.rgb;
    }

    #define pbr_inline
    #define inline
    var reflectionBlock: voidnull(
        in var vPositionW: vec3f,
        in var normalW: vec3f,
        in var alphaG: f32,
        in var vReflectionMicrosurfaceInfos: vec3f,
        in var vReflectionInfos: vec2f,
        in var vReflectionColor: vec3f,
    #ifdef ANISOTROPIC
        in anisotropicOutParams anisotropicOut,
    #endif
    #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
        in var NdotVUnclamped: f32,
    #endif
    #ifdef LINEARSPECULARREFLECTION
        in var roughness: f32,
    #endif
    #ifdef REFLECTIONMAP_3D
        in samplerCube reflectionSampler,
    #else
        in sampler2D reflectionSampler,
    #endif
    #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
        in var vEnvironmentIrradiance: vec3f,
    #endif
    #ifdef USESPHERICALFROMREFLECTIONMAP
        #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
            in var reflectionMatrix: mat4x4f,
        #endif
    #endif
    #ifdef USEIRRADIANCEMAP
        #ifdef REFLECTIONMAP_3D
            in samplerCube irradianceSampler,
        #else
            in sampler2D irradianceSampler,
        #endif
    #endif
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
        out reflectionOutParams outParams
    )
    {
        // _____________________________ Radiance ________________________________
        var environmentRadiance: vec4f =  vec4f(0., 0., 0., 0.);

        #ifdef REFLECTIONMAP_3D
            var reflectionCoords: vec3f =  vec3f(0.);
        #else
            var reflectionCoords: vec2f =  vec2f(0.);
        #endif

        createReflectionCoords(
            vPositionW,
            normalW,
        #ifdef ANISOTROPIC
            anisotropicOut,
        #endif
            reflectionCoords
        );

        sampleReflectionTexture(
            alphaG,
            vReflectionMicrosurfaceInfos,
            vReflectionInfos,
            vReflectionColor,
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            NdotVUnclamped,
        #endif
        #ifdef LINEARSPECULARREFLECTION
            roughness,
        #endif
        #ifdef REFLECTIONMAP_3D
            reflectionSampler,
            reflectionCoords,
        #else
            reflectionSampler,
            reflectionCoords,
        #endif
        #ifndef LODBASEDMICROSFURACE
            reflectionSamplerLow,
            reflectionSamplerHigh,
        #endif
        #ifdef REALTIME_FILTERING
            vReflectionFilteringInfo,
        #endif
            environmentRadiance
        );

        // _____________________________ Irradiance ________________________________
        var environmentIrradiance: vec3f =  vec3f(0., 0., 0.);

        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                environmentIrradiance = vEnvironmentIrradiance;
            #else
                #ifdef ANISOTROPIC
                    var irradianceVector: vec3f =  vec3f(reflectionMatrix *  vec4f(anisotropicOut.anisotropicNormal, 0)).xyz;
                #else
                    var irradianceVector: vec3f =  vec3f(reflectionMatrix *  vec4f(normalW, 0)).xyz;
                #endif

                #ifdef REFLECTIONMAP_OPPOSITEZ
                    irradianceVector.z *= -1.0;
                #endif

                #ifdef INVERTCUBICMAP
                    irradianceVector.y *= -1.0;
                #endif

                #if defined(REALTIME_FILTERING)
                    environmentIrradiance = irradiance(reflectionSampler, irradianceVector, vReflectionFilteringInfo);
                #else
                    environmentIrradiance = computeEnvironmentIrradiance(irradianceVector);
                #endif
                
                #ifdef SS_TRANSLUCENCY
                    outParams.irradianceVector = irradianceVector;
                #endif
            #endif
        #elif defined(USEIRRADIANCEMAP)
            var environmentIrradiance4: vec4f = sampleReflection(irradianceSampler, reflectionCoords);
            environmentIrradiance = environmentIrradiance4.rgb;
            #ifdef RGBDREFLECTION
                environmentIrradiance.rgb = fromRGBD(environmentIrradiance4);
            #endif

            #ifdef GAMMAREFLECTION
                environmentIrradiance.rgb = toLinearSpace(environmentIrradiance.rgb);
            #endif
        #endif

        environmentIrradiance *= vReflectionColor.rgb;
        outParams.environmentRadiance = environmentRadiance;
        outParams.environmentIrradiance = environmentIrradiance;
        outParams.reflectionCoords = reflectionCoords;
    }
#endif
