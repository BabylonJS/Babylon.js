#ifdef REFLECTION
    struct reflectionOutParams
    {
        vec4 environmentRadiance;
        vec3 environmentIrradiance;
    #ifdef REFLECTIONMAP_3D
        vec3 reflectionCoords;
    #else
        vec2 reflectionCoords;
    #endif
    #ifdef SS_TRANSLUCENCY
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                vec3 irradianceVector;
            #endif
        #endif
    #endif
    };

    void reflectionBlock(
        const in vec3 vPositionW,
        const in vec3 normalW,
        const in float alphaG,
        const in vec3 vReflectionMicrosurfaceInfos,
        const in vec2 vReflectionInfos,
    #ifdef ANISOTROPIC
        const in anisotropicOutParams anisotropicOut,
    #endif
    #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
        const in float NdotVUnclamped,
    #endif
    #ifdef LINEARSPECULARREFLECTION
        const in float roughness,
    #endif
    #ifdef REFLECTIONMAP_3D
        const in samplerCube reflectionSampler,
    #else
        const in sampler2D reflectionSampler,
    #endif
    #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
        const in vec3 vEnvironmentIrradiance,
    #endif
    #ifdef USESPHERICALFROMREFLECTIONMAP
        #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
            const in mat4 reflectionMatrix,
        #endif
    #endif
    #ifdef USEIRRADIANCEMAP
        #ifdef REFLECTIONMAP_3D
            const in samplerCube irradianceSampler,
        #else
            const in sampler2D irradianceSampler,
        #endif
    #endif
        out reflectionOutParams outParams
    )
    {
        vec4 environmentRadiance = vec4(0., 0., 0., 0.);
        vec3 environmentIrradiance = vec3(0., 0., 0.);

        #ifdef ANISOTROPIC
            vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), anisotropicOut.anisotropicNormal);
        #else
            vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);
        #endif

        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef REFLECTIONMAP_3D
            vec3 reflectionCoords = reflectionVector;
        #else
            vec2 reflectionCoords = reflectionVector.xy;
            #ifdef REFLECTIONMAP_PROJECTION
                reflectionCoords /= reflectionVector.z;
            #endif
            reflectionCoords.y = 1.0 - reflectionCoords.y;
        #endif

        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
        #elif defined(LINEARSPECULARREFLECTION)
            float reflectionLOD = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, roughness);
        #else
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG);
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
                float automaticReflectionLOD = UNPACK_LOD(sampleReflection(reflectionSampler, reflectionCoords).a);
                float requestedReflectionLOD = max(automaticReflectionLOD, reflectionLOD);
            #else
                float requestedReflectionLOD = reflectionLOD;
            #endif

            environmentRadiance = sampleReflectionLod(reflectionSampler, reflectionCoords, requestedReflectionLOD);
        #else
            float lodReflectionNormalized = saturate(reflectionLOD / log2(vReflectionMicrosurfaceInfos.x));
            float lodReflectionNormalizedDoubled = lodReflectionNormalized * 2.0;

            vec4 environmentSpecularMid = sampleReflection(reflectionSampler, reflectionCoords);
            if(lodReflectionNormalizedDoubled < 1.0){
                environmentRadiance = mix(
                    sampleReflection(reflectionSamplerHigh, reflectionCoords),
                    environmentSpecularMid,
                    lodReflectionNormalizedDoubled
                );
            }else{
                environmentRadiance = mix(
                    environmentSpecularMid,
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

        // _____________________________ Irradiance ________________________________
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                environmentIrradiance = vEnvironmentIrradiance;
            #else
                #ifdef ANISOTROPIC
                    vec3 irradianceVector = vec3(reflectionMatrix * vec4(anisotropicOut.anisotropicNormal, 0)).xyz;
                #else
                    vec3 irradianceVector = vec3(reflectionMatrix * vec4(normalW, 0)).xyz;
                #endif

                #ifdef REFLECTIONMAP_OPPOSITEZ
                    irradianceVector.z *= -1.0;
                #endif

                environmentIrradiance = computeEnvironmentIrradiance(irradianceVector);

                #ifdef SS_TRANSLUCENCY
                    outParams.irradianceVector = irradianceVector;
                #endif
            #endif
        #elif defined(USEIRRADIANCEMAP)
            vec4 environmentIrradiance4 = sampleReflection(irradianceSampler, reflectionCoords);
            environmentIrradiance = environmentIrradiance4.rgb;
            #ifdef RGBDREFLECTION
                environmentIrradiance.rgb = fromRGBD(environmentIrradiance4);
            #endif

            #ifdef GAMMAREFLECTION
                environmentIrradiance.rgb = toLinearSpace(environmentIrradiance.rgb);
            #endif
        #endif

        // _____________________________ Levels _____________________________________
        environmentRadiance.rgb *= vReflectionInfos.x;
        environmentRadiance.rgb *= vReflectionColor.rgb;
        environmentIrradiance *= vReflectionColor.rgb;

        outParams.environmentRadiance = environmentRadiance;
        outParams.environmentIrradiance = environmentIrradiance;
        outParams.reflectionCoords = reflectionCoords;
    }
#endif
