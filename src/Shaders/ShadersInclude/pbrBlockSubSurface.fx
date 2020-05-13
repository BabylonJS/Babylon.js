struct subSurfaceOutParams
{
    vec3 specularEnvironmentReflectance;
#ifdef SS_REFRACTION
    vec3 finalRefraction;
    vec3 surfaceAlbedo;
    #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
        float alpha;
    #endif
    #ifdef REFLECTION
        float refractionFactorForIrradiance;
    #endif
#endif
#ifdef SS_TRANSLUCENCY
    vec3 transmittance;
    #ifdef REFLECTION
        vec3 refractionIrradiance;
    #endif
#endif
#if DEBUGMODE > 0
    vec4 thicknessMap;
    vec4 environmentRefraction;
    vec3 refractionTransmittance;
#endif
};

#ifdef SUBSURFACE
    #define inline
    void subSurfaceBlock(
        const in vec3 vSubSurfaceIntensity,
        const in vec2 vThicknessParam,
        const in vec4 vTintColor,
        const in vec3 normalW,
        const in vec3 specularEnvironmentReflectance,
    #ifdef SS_THICKNESSANDMASK_TEXTURE
        const in vec4 thicknessMap,
    #endif
    #ifdef REFLECTION
        #ifdef SS_TRANSLUCENCY
            const in mat4 reflectionMatrix,
            #ifdef USESPHERICALFROMREFLECTIONMAP
                #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                    const in vec3 irradianceVector_,
                #endif
            #endif
            #ifdef USEIRRADIANCEMAP
                #ifdef REFLECTIONMAP_3D
                    const in samplerCube irradianceSampler,
                #else
                    const in sampler2D irradianceSampler,
                #endif
            #endif
        #endif
    #endif
    #ifdef SS_REFRACTION
        const in vec3 vPositionW,
        const in vec3 viewDirectionW,
        const in mat4 view,
        const in vec3 surfaceAlbedo,
        const in vec4 vRefractionInfos,
        const in mat4 refractionMatrix,
        const in vec3 vRefractionMicrosurfaceInfos,
        const in vec4 vLightingIntensity,
        #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
            const in float alpha,
        #endif
        #ifdef SS_LODINREFRACTIONALPHA
            const in float NdotVUnclamped,
        #endif
        #ifdef SS_LINEARSPECULARREFRACTION
            const in float roughness,
        #else
            const in float alphaG,
        #endif
        #ifdef SS_REFRACTIONMAP_3D
            const in samplerCube refractionSampler,
            #ifndef LODBASEDMICROSFURACE
                const in samplerCube refractionSamplerLow,
                const in samplerCube refractionSamplerHigh,
            #endif
        #else
            const in sampler2D refractionSampler,
            #ifndef LODBASEDMICROSFURACE
                const in sampler2D refractionSamplerLow,
                const in sampler2D refractionSamplerHigh,
            #endif
        #endif
        #ifdef ANISOTROPIC
            const in anisotropicOutParams anisotropicOut,
        #endif
    #endif
    #ifdef SS_TRANSLUCENCY
        const in vec3 vDiffusionDistance,
    #endif
        out subSurfaceOutParams outParams
    )
    {
        outParams.specularEnvironmentReflectance = specularEnvironmentReflectance;

    // ______________________________________________________________________________________
    // _____________________________ Intensities & thickness ________________________________
    // ______________________________________________________________________________________
    #ifdef SS_REFRACTION
        float refractionIntensity = vSubSurfaceIntensity.x;
        #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
            refractionIntensity *= (1.0 - alpha);
            // Put alpha back to 1;
            outParams.alpha = 1.0;
        #endif
    #endif
    #ifdef SS_TRANSLUCENCY
        float translucencyIntensity = vSubSurfaceIntensity.y;
    #endif
    #ifdef SS_SCATTERING
        float scatteringIntensity = vSubSurfaceIntensity.z;
    #endif

    #ifdef SS_THICKNESSANDMASK_TEXTURE
        float thickness = thicknessMap.r * vThicknessParam.y + vThicknessParam.x;

        #if DEBUGMODE > 0
            outParams.thicknessMap = thicknessMap;
        #endif

        #ifdef SS_MASK_FROM_THICKNESS_TEXTURE
            #ifdef SS_REFRACTION
                refractionIntensity *= thicknessMap.g;
            #endif
            #ifdef SS_TRANSLUCENCY
                translucencyIntensity *= thicknessMap.b;
            #endif
            #ifdef SS_SCATTERING
                scatteringIntensity *= thicknessMap.a;
            #endif
        #endif
    #else
        float thickness = vThicknessParam.y;
    #endif

    // _________________________________________________________________________________________
    // _____________________________ Translucency transmittance ________________________________
    // _________________________________________________________________________________________
    #ifdef SS_TRANSLUCENCY
        thickness = maxEps(thickness);
        vec3 transmittance = transmittanceBRDF_Burley(vTintColor.rgb, vDiffusionDistance, thickness);
        transmittance *= translucencyIntensity;
        outParams.transmittance = transmittance;
    #endif

    // _____________________________________________________________________________________
    // _____________________________ Refraction environment ________________________________
    // _____________________________________________________________________________________
    #ifdef SS_REFRACTION
        vec4 environmentRefraction = vec4(0., 0., 0., 0.);

        #ifdef ANISOTROPIC
            vec3 refractionVector = refract(-viewDirectionW, anisotropicOut.anisotropicNormal, vRefractionInfos.y);
        #else
            vec3 refractionVector = refract(-viewDirectionW, normalW, vRefractionInfos.y);
        #endif

        #ifdef SS_REFRACTIONMAP_OPPOSITEZ
            refractionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef SS_REFRACTIONMAP_3D
            refractionVector.y = refractionVector.y * vRefractionInfos.w;
            vec3 refractionCoords = refractionVector;
            refractionCoords = vec3(refractionMatrix * vec4(refractionCoords, 0));
        #else
            vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));
            vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;
            refractionCoords.y = 1.0 - refractionCoords.y;
        #endif

        #ifdef SS_LODINREFRACTIONALPHA
            float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
        #elif defined(SS_LINEARSPECULARREFRACTION)
            float refractionLOD = getLinearLodFromRoughness(vRefractionMicrosurfaceInfos.x, roughness);
        #else
            float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG);
        #endif

        #ifdef LODBASEDMICROSFURACE
            // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
            refractionLOD = refractionLOD * vRefractionMicrosurfaceInfos.y + vRefractionMicrosurfaceInfos.z;

            #ifdef SS_LODINREFRACTIONALPHA
                // Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection
                // is constrained to appropriate LOD levels in order to prevent aliasing.
                // The environment map is first sampled without custom LOD selection to determine
                // the hardware-selected LOD, and this is then used to constrain the final LOD selection
                // so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry
                // where the normal is varying rapidly).

                // Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
                // manual calculation via derivatives is also possible, but for simplicity we use the 
                // hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
                float automaticRefractionLOD = UNPACK_LOD(sampleRefraction(refractionSampler, refractionCoords).a);
                float requestedRefractionLOD = max(automaticRefractionLOD, refractionLOD);
            #else
                float requestedRefractionLOD = refractionLOD;
            #endif

            #ifdef REALTIME_FILTERING
                #ifdef SS_LINEARSPECULARREFRACTION
                    environmentRefraction = vec4(radiance(roughness, refractionSampler, refractionCoords, vRefractionFilteringInfo), 1.0);
                #else
                    environmentRefraction = vec4(radiance(alphaG, refractionSampler, refractionCoords, vRefractionFilteringInfo), 1.0);
                #endif
            #else
                environmentRefraction = sampleRefractionLod(refractionSampler, refractionCoords, requestedRefractionLOD);
            #endif
        #else
            float lodRefractionNormalized = saturate(refractionLOD / log2(vRefractionMicrosurfaceInfos.x));
            float lodRefractionNormalizedDoubled = lodRefractionNormalized * 2.0;

            vec4 environmentRefractionMid = sampleRefraction(refractionSampler, refractionCoords);
            if (lodRefractionNormalizedDoubled < 1.0){
                environmentRefraction = mix(
                    sampleRefraction(refractionSamplerHigh, refractionCoords),
                    environmentRefractionMid,
                    lodRefractionNormalizedDoubled
                );
            } else {
                environmentRefraction = mix(
                    environmentRefractionMid,
                    sampleRefraction(refractionSamplerLow, refractionCoords),
                    lodRefractionNormalizedDoubled - 1.0
                );
            }
        #endif

        #ifdef SS_RGBDREFRACTION
            environmentRefraction.rgb = fromRGBD(environmentRefraction);
        #endif

        #ifdef SS_GAMMAREFRACTION
            environmentRefraction.rgb = toLinearSpace(environmentRefraction.rgb);
        #endif

        // _____________________________ Levels _____________________________________
        environmentRefraction.rgb *= vRefractionInfos.x;
    #endif

    // _______________________________________________________________________________
    // _____________________________ Final Refraction ________________________________
    // _______________________________________________________________________________
    #ifdef SS_REFRACTION
        vec3 refractionTransmittance = vec3(refractionIntensity);
        #ifdef SS_THICKNESSANDMASK_TEXTURE
            vec3 volumeAlbedo = computeColorAtDistanceInMedia(vTintColor.rgb, vTintColor.w);

            // // Simulate Flat Surface
            // thickness /=  dot(refractionVector, -normalW);

            // // Simulate Curved Surface
            // float NdotRefract = dot(normalW, refractionVector);
            // thickness *= -NdotRefract;

            refractionTransmittance *= cocaLambert(volumeAlbedo, thickness);
        #elif defined(SS_LINKREFRACTIONTOTRANSPARENCY)
            // Tint the material with albedo.
            float maxChannel = max(max(surfaceAlbedo.r, surfaceAlbedo.g), surfaceAlbedo.b);
            vec3 volumeAlbedo = saturate(maxChannel * surfaceAlbedo);

            // Tint reflectance
            environmentRefraction.rgb *= volumeAlbedo;
        #else
            // Compute tint from min distance only.
            vec3 volumeAlbedo = computeColorAtDistanceInMedia(vTintColor.rgb, vTintColor.w);
            refractionTransmittance *= cocaLambert(volumeAlbedo, vThicknessParam.y);
        #endif

        // Decrease Albedo Contribution
        outParams.surfaceAlbedo = surfaceAlbedo * (1. - refractionIntensity);

        #ifdef REFLECTION
            // Decrease irradiance Contribution
            outParams.refractionFactorForIrradiance = (1. - refractionIntensity);
            //environmentIrradiance *= (1. - refractionIntensity);
        #endif

        // Add Multiple internal bounces.
        vec3 bounceSpecularEnvironmentReflectance = (2.0 * specularEnvironmentReflectance) / (1.0 + specularEnvironmentReflectance);
        outParams.specularEnvironmentReflectance = mix(bounceSpecularEnvironmentReflectance, specularEnvironmentReflectance, refractionIntensity);

        // In theory T = 1 - R.
        refractionTransmittance *= 1.0 - outParams.specularEnvironmentReflectance;

        #if DEBUGMODE > 0
            outParams.refractionTransmittance = refractionTransmittance;
        #endif

        outParams.finalRefraction = environmentRefraction.rgb * refractionTransmittance * vLightingIntensity.z;

        #if DEBUGMODE > 0
            outParams.environmentRefraction = environmentRefraction;
        #endif
    #endif

    // __________________________________________________________________________________
    // _______________________________  IBL Translucency ________________________________
    // __________________________________________________________________________________
    #if defined(REFLECTION) && defined(SS_TRANSLUCENCY)
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX) || !defined(USESPHERICALFROMREFLECTIONMAP)
            vec3 irradianceVector = vec3(reflectionMatrix * vec4(normalW, 0)).xyz;
            #ifdef REFLECTIONMAP_OPPOSITEZ
                irradianceVector.z *= -1.0;
            #endif
            #ifdef INVERTCUBICMAP
                irradianceVector.y *= -1.0;
            #endif
        #else
            vec3 irradianceVector = irradianceVector_;
        #endif

        #if defined(USESPHERICALFROMREFLECTIONMAP)
            #if defined(WEBGL2) && defined(REALTIME_FILTERING)
                vec3 refractionIrradiance = irradiance(reflectionSampler, -irradianceVector, vReflectionFilteringInfo);
            #else
                vec3 refractionIrradiance = computeEnvironmentIrradiance(-irradianceVector);
            #endif
        #elif defined(USEIRRADIANCEMAP)
            #ifdef REFLECTIONMAP_3D
                vec3 irradianceCoords = irradianceVector;
            #else
                vec2 irradianceCoords = irradianceVector.xy;
                #ifdef REFLECTIONMAP_PROJECTION
                    irradianceCoords /= irradianceVector.z;
                #endif
                irradianceCoords.y = 1.0 - irradianceCoords.y;
            #endif

            vec4 refractionIrradiance = sampleReflection(irradianceSampler, -irradianceCoords);
            #ifdef RGBDREFLECTION
                refractionIrradiance.rgb = fromRGBD(refractionIrradiance);
            #endif

            #ifdef GAMMAREFLECTION
                refractionIrradiance.rgb = toLinearSpace(refractionIrradiance.rgb);
            #endif
        #else
            vec4 refractionIrradiance = vec4(0.);
        #endif

        refractionIrradiance.rgb *= transmittance;
        outParams.refractionIrradiance = refractionIrradiance.rgb;
    #endif
    }
#endif

