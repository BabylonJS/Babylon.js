#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
#include<clusteredLightingFunctions>

#define inline
    lightingInfo computeClusteredLighting(
        sampler2D lightDataTexture,
        sampler2D tileMaskTexture,
        vec4 lightData,
        ivec2 sliceRange,
        vec3 V,
        vec3 N,
        vec3 posW,
        vec3 surfaceAlbedo,
        reflectivityOutParams reflectivityOut
        #ifdef IRIDESCENCE
            , float iridescenceIntensity
        #endif
        #ifdef SS_TRANSLUCENCY
            , subSurfaceOutParams subSurfaceOut
        #endif
        #ifdef SPECULARTERM
            , float AARoughnessFactor
        #endif
        #ifdef ANISOTROPIC
            , anisotropicOutParams anisotropicOut
        #endif
        #ifdef SHEEN
            , sheenOutParams sheenOut
        #endif
        #ifdef CLEARCOAT
            , clearcoatOutParams clearcoatOut
        #endif
    ) {
        float NdotV = absEps(dot(N, V));
#include<pbrBlockReflectance0>
        #ifdef CLEARCOAT
            specularEnvironmentR0 = clearcoatOut.specularEnvironmentR0;
        #endif

        lightingInfo result;
        ivec2 tilePosition = ivec2(gl_FragCoord.xy * lightData.xy);
        int maskHeight = int(lightData.z);
        tilePosition.y = min(tilePosition.y, maskHeight - 1);

        ivec2 batchRange = sliceRange / CLUSTLIGHT_BATCH;
        int batchOffset = batchRange.x * CLUSTLIGHT_BATCH;
        tilePosition.y += maskHeight * batchRange.x;

        for (int i = batchRange.x; i <= batchRange.y; i += 1) {
            uint mask = uint(texelFetch(tileMaskTexture, tilePosition, 0).r);
            tilePosition.y += maskHeight;
            // Mask out the bits outside the range
            int maskOffset = max(sliceRange.x - batchOffset, 0);
            int maskWidth = min(sliceRange.y - batchOffset + 1, CLUSTLIGHT_BATCH);
            mask = extractBits(mask, maskOffset, maskWidth);

            while (mask != 0u) {
                // This gets the lowest set bit
                uint bit = mask & -mask;
                mask ^= bit;
                int position = onlyBitPosition(bit);
                ClusteredLight light = getClusteredLight(lightDataTexture, batchOffset + maskOffset + position);

                preLightingInfo preInfo = computePointAndSpotPreLightingInfo(light.vLightData, V, N, posW);
                preInfo.NdotV = NdotV;

                // Compute Attenuation infos
                preInfo.attenuation = computeDistanceLightFalloff(preInfo.lightOffset, preInfo.lightDistanceSquared, light.vLightFalloff.x, light.vLightFalloff.y);
                // Assume an angle greater than 180º is a point light
                if (light.vLightDirection.w >= 0.0) {
                    preInfo.attenuation *= computeDirectionalLightFalloff(light.vLightDirection.xyz, preInfo.L, light.vLightDirection.w, light.vLightData.w, light.vLightFalloff.z, light.vLightFalloff.w);
                }

                preInfo.roughness = adjustRoughnessFromLightProperties(reflectivityOut.roughness, light.vLightSpecular.a, preInfo.lightDistance);
                preInfo.diffuseRoughness = reflectivityOut.diffuseRoughness;
                preInfo.surfaceAlbedo = surfaceAlbedo;

                #ifdef IRIDESCENCE
                    preInfo.iridescenceIntensity = iridescenceIntensity;
                #endif
                lightingInfo info;

                // Diffuse contribution
                #ifdef SS_TRANSLUCENCY
                    #ifdef SS_TRANSLUCENCY_LEGACY
                        info.diffuse = computeDiffuseTransmittedLighting(preInfo, light.vLightDiffuse.rgb, subSurfaceOut.transmittance);
                        info.diffuseTransmission = vec3(0);
                    #else
                        info.diffuse = computeDiffuseLighting(preInfo, light.vLightDiffuse.rgb) * (1.0 - subSurfaceOut.translucencyIntensity);
                        info.diffuseTransmission = computeDiffuseTransmittedLighting(preInfo, light.vLightDiffuse.rgb, subSurfaceOut.transmittance);
                    #endif
                #else
                    info.diffuse = computeDiffuseLighting(preInfo, light.vLightDiffuse.rgb);
                #endif

                // Specular contribution
                #ifdef SPECULARTERM
                    #if CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR
                        vec3 metalFresnel = reflectivityOut.specularWeight * getF82Specular(preInfo.VdotH, specularEnvironmentR0, reflectivityOut.colorReflectanceF90, reflectivityOut.roughness);
                        vec3 dielectricFresnel = fresnelSchlickGGX(preInfo.VdotH, reflectivityOut.dielectricColorF0, reflectivityOut.colorReflectanceF90);
                        vec3 coloredFresnel = mix(dielectricFresnel, metalFresnel, reflectivityOut.metallic);
                    #else
                        vec3 coloredFresnel = fresnelSchlickGGX(preInfo.VdotH, specularEnvironmentR0, reflectivityOut.colorReflectanceF90);
                    #endif
                    #ifndef LEGACY_SPECULAR_ENERGY_CONSERVATION
                        float NdotH = dot(N, preInfo.H);
                        vec3 fresnel = fresnelSchlickGGX(NdotH, vec3(reflectanceF0), specularEnvironmentR90);
                        info.diffuse *= (vec3(1.0) - fresnel);
                    #endif
                    #ifdef ANISOTROPIC
                        info.specular = computeAnisotropicSpecularLighting(preInfo, V, N, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactor, light.vLightDiffuse.rgb);
                    #else
                        info.specular = computeSpecularLighting(preInfo, N, specularEnvironmentR0, coloredFresnel, AARoughnessFactor, light.vLightDiffuse.rgb);
                    #endif
                #endif

                // Sheen contribution
                #ifdef SHEEN
                    #ifdef SHEEN_LINKWITHALBEDO
                        preInfo.roughness = sheenOut.sheenIntensity;
                    #else
                        preInfo.roughness = adjustRoughnessFromLightProperties(sheenOut.sheenRoughness, light.vLightSpecular.a, preInfo.lightDistance);
                    #endif
                    info.sheen = computeSheenLighting(preInfo, normalW, sheenOut.sheenColor, specularEnvironmentR90, AARoughnessFactor, light.vLightDiffuse.rgb);
                #endif

                // Clear Coat contribution
                #ifdef CLEARCOAT
                    preInfo.roughness = adjustRoughnessFromLightProperties(clearcoatOut.clearCoatRoughness, light.vLightSpecular.a, preInfo.lightDistance);
                    info.clearCoat = computeClearCoatLighting(preInfo, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatAARoughnessFactors.x, clearcoatOut.clearCoatIntensity, light.vLightDiffuse.rgb);

                    #ifdef CLEARCOAT_TINT
                        // Absorption
                        float absorption = computeClearCoatLightingAbsorption(clearcoatOut.clearCoatNdotVRefract, preInfo.L, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatColor, clearcoatOut.clearCoatThickness, clearcoatOut.clearCoatIntensity);
                        info.diffuse *= absorption;
                        #ifdef SS_TRANSLUCENCY
                            info.diffuseTransmission *= absorption;
                        #endif
                        #ifdef SPECULARTERM
                            info.specular *= absorption;
                        #endif
                    #endif

                    info.diffuse *= info.clearCoat.w;
                    #ifdef SS_TRANSLUCENCY
                        info.diffuseTransmission *= info.clearCoat.w;
                    #endif
                    #ifdef SPECULARTERM
                        info.specular *= info.clearCoat.w;
                    #endif
                    #ifdef SHEEN
                        info.sheen *= info.clearCoat.w;
                    #endif
                #endif

                // Apply contributions to result
                result.diffuse += info.diffuse;
                #ifdef SS_TRANSLUCENCY
                    result.diffuseTransmission += info.diffuseTransmission;
                #endif
                #ifdef SPECULARTERM
                    result.specular += info.specular;
                #endif
                #ifdef CLEARCOAT
                    result.clearCoat += info.clearCoat;
                #endif
                #ifdef SHEEN
                    result.sheen += info.sheen;
                #endif
            }
            batchOffset += CLUSTLIGHT_BATCH;
        }
        return result;
    }
#endif
