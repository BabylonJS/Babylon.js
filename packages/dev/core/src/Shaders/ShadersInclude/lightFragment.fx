#ifdef LIGHT{X}
    #if defined(SHADOWONLY) || defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else

        vec4 diffuse{X} = light{X}.vLightDiffuse;
        #define CUSTOM_LIGHT{X}_COLOR // Use to modify light color. Currently only supports diffuse.

        #ifdef PBR
            // Compute Pre Lighting infos
            #ifdef SPOTLIGHT{X}
                preInfo = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW, vPositionW);
            #elif defined(POINTLIGHT{X})
                preInfo = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW, vPositionW);
            #elif defined(HEMILIGHT{X})
                preInfo = computeHemisphericPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW);
            #elif defined(DIRLIGHT{X})
                preInfo = computeDirectionalPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW);
            #elif defined(AREALIGHT{X}) && defined(AREALIGHTSUPPORTED)
                preInfo = computeAreaPreLightingInfo(areaLightsLTC1Sampler, areaLightsLTC2Sampler, viewDirectionW, normalW, vPositionW, light{X}.vLightData, light{X}.vLightWidth.xyz, light{X}.vLightHeight.xyz, roughness);
            #endif

            preInfo.NdotV = NdotV;

            // Compute Attenuation infos
            #ifdef SPOTLIGHT{X}
                #ifdef LIGHT_FALLOFF_GLTF{X}
                    preInfo.attenuation = computeDistanceLightFalloff_GLTF(preInfo.lightDistanceSquared, light{X}.vLightFalloff.y);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X});
                    #else
                        preInfo.attenuation *= computeDirectionalLightFalloff_GLTF(light{X}.vLightDirection.xyz, preInfo.L, light{X}.vLightFalloff.z, light{X}.vLightFalloff.w);
                    #endif
                #elif defined(LIGHT_FALLOFF_PHYSICAL{X})
                    preInfo.attenuation = computeDistanceLightFalloff_Physical(preInfo.lightDistanceSquared);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X});
                    #else
                        preInfo.attenuation *= computeDirectionalLightFalloff_Physical(light{X}.vLightDirection.xyz, preInfo.L, light{X}.vLightDirection.w);
                    #endif
                #elif defined(LIGHT_FALLOFF_STANDARD{X})
                    preInfo.attenuation = computeDistanceLightFalloff_Standard(preInfo.lightOffset, light{X}.vLightFalloff.x);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X});
                    #else
                        preInfo.attenuation *= computeDirectionalLightFalloff_Standard(light{X}.vLightDirection.xyz, preInfo.L, light{X}.vLightDirection.w, light{X}.vLightData.w);
                    #endif
                #else
                    preInfo.attenuation = computeDistanceLightFalloff(preInfo.lightOffset, preInfo.lightDistanceSquared, light{X}.vLightFalloff.x, light{X}.vLightFalloff.y);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X});
                    #else
                        preInfo.attenuation *= computeDirectionalLightFalloff(light{X}.vLightDirection.xyz, preInfo.L, light{X}.vLightDirection.w, light{X}.vLightData.w, light{X}.vLightFalloff.z, light{X}.vLightFalloff.w);
                    #endif
                #endif
            #elif defined(POINTLIGHT{X})
                #ifdef LIGHT_FALLOFF_GLTF{X}
                    preInfo.attenuation = computeDistanceLightFalloff_GLTF(preInfo.lightDistanceSquared, light{X}.vLightFalloff.y);
                #elif defined(LIGHT_FALLOFF_PHYSICAL{X})
                    preInfo.attenuation = computeDistanceLightFalloff_Physical(preInfo.lightDistanceSquared);
                #elif defined(LIGHT_FALLOFF_STANDARD{X})
                    preInfo.attenuation = computeDistanceLightFalloff_Standard(preInfo.lightOffset, light{X}.vLightFalloff.x);
                #else
                    preInfo.attenuation = computeDistanceLightFalloff(preInfo.lightOffset, preInfo.lightDistanceSquared, light{X}.vLightFalloff.x, light{X}.vLightFalloff.y);
                #endif
            #else
                preInfo.attenuation = 1.0;
            #endif

            // Simulates Light radius for diffuse and spec term
            // clear coat is using a dedicated roughness
            #if defined(HEMILIGHT{X}) || defined(AREALIGHT{X})
                preInfo.roughness = roughness;
            #else
                preInfo.roughness = adjustRoughnessFromLightProperties(roughness, light{X}.vLightSpecular.a, preInfo.lightDistance);
            #endif
            preInfo.diffuseRoughness = diffuseRoughness;
            preInfo.surfaceAlbedo = surfaceAlbedo;

            #ifdef IRIDESCENCE
                preInfo.iridescenceIntensity = iridescenceIntensity;
            #endif

            // Diffuse contribution
            #ifdef SS_TRANSLUCENCY
                info.diffuseTransmission = vec3(0.0);
            #endif

            #ifdef HEMILIGHT{X}
                info.diffuse = computeHemisphericDiffuseLighting(preInfo, diffuse{X}.rgb, light{X}.vLightGround);
            #elif defined(AREALIGHT{X})
                info.diffuse = computeAreaDiffuseLighting(preInfo, diffuse{X}.rgb);
            #elif defined(SS_TRANSLUCENCY)
                #ifndef SS_TRANSLUCENCY_LEGACY
                    info.diffuse = computeDiffuseLighting(preInfo, diffuse{X}.rgb) * (1.0 - subSurfaceOut.translucencyIntensity);
                    info.diffuseTransmission = computeDiffuseTransmittedLighting(preInfo, diffuse{X}.rgb, subSurfaceOut.transmittance); // note subSurfaceOut.translucencyIntensity is already factored in subSurfaceOut.transmittance
                #else
                    info.diffuse = computeDiffuseTransmittedLighting(preInfo, diffuse{X}.rgb, subSurfaceOut.transmittance);
                #endif
            #else
                info.diffuse = computeDiffuseLighting(preInfo, diffuse{X}.rgb);
            #endif

            // Specular contribution
            #ifdef SPECULARTERM
                #if AREALIGHT{X}
                    info.specular = computeAreaSpecularLighting(preInfo, light{X}.vLightSpecular.rgb, clearcoatOut.specularEnvironmentR0, reflectivityOut.colorReflectanceF90);
                #else
                    // For OpenPBR, we use the F82 specular model for metallic materials and mix with the
                    // usual Schlick lobe.
                    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
                        {
                            vec3 metalFresnel = reflectivityOut.specularWeight * getF82Specular(preInfo.VdotH, clearcoatOut.specularEnvironmentR0, reflectivityOut.colorReflectanceF90, reflectivityOut.roughness);
                            vec3 dielectricFresnel = fresnelSchlickGGX(preInfo.VdotH, reflectivityOut.dielectricColorF0, reflectivityOut.colorReflectanceF90);
                            coloredFresnel = mix(dielectricFresnel, metalFresnel, reflectivityOut.metallic);
                        }
                    #else
                        coloredFresnel = fresnelSchlickGGX(preInfo.VdotH, clearcoatOut.specularEnvironmentR0, reflectivityOut.colorReflectanceF90);
                    #endif
                    #ifndef LEGACY_SPECULAR_ENERGY_CONSERVATION
                        {
                            // The diffuse contribution needs to be decreased by the average Fresnel for the hemisphere.
                            // We can approximate this with NdotH.
                            float NdotH = dot(normalW, preInfo.H);
                            vec3 fresnel = fresnelSchlickGGX(NdotH, vec3(reflectanceF0), specularEnvironmentR90);
                            info.diffuse *= (vec3(1.0) - fresnel);
                        }
                    #endif
                    #ifdef ANISOTROPIC
                        info.specular = computeAnisotropicSpecularLighting(preInfo, viewDirectionW, normalW, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactors.x, diffuse{X}.rgb);
                    #else
                        info.specular = computeSpecularLighting(preInfo, normalW, clearcoatOut.specularEnvironmentR0, coloredFresnel, AARoughnessFactors.x, diffuse{X}.rgb);
                    #endif
                #endif
            #endif

            #ifndef AREALIGHT{X}
                // Sheen contribution
                #ifdef SHEEN
                    #ifdef SHEEN_LINKWITHALBEDO
                        // BE Carefull: Sheen intensity is replacing the roughness value.
                        preInfo.roughness = sheenOut.sheenIntensity;
                    #else
                        #ifdef HEMILIGHT{X}
                            preInfo.roughness = sheenOut.sheenRoughness;
                        #else
                            preInfo.roughness = adjustRoughnessFromLightProperties(sheenOut.sheenRoughness, light{X}.vLightSpecular.a, preInfo.lightDistance);
                        #endif
                    #endif
                    info.sheen = computeSheenLighting(preInfo, normalW, sheenOut.sheenColor, specularEnvironmentR90, AARoughnessFactors.x, diffuse{X}.rgb);
                #endif

                // Clear Coat contribution
                #ifdef CLEARCOAT
                    // Simulates Light radius
                    #ifdef HEMILIGHT{X}
                        preInfo.roughness = clearcoatOut.clearCoatRoughness;
                    #else
                        preInfo.roughness = adjustRoughnessFromLightProperties(clearcoatOut.clearCoatRoughness, light{X}.vLightSpecular.a, preInfo.lightDistance);
                    #endif

                    info.clearCoat = computeClearCoatLighting(preInfo, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatAARoughnessFactors.x, clearcoatOut.clearCoatIntensity, diffuse{X}.rgb);

                    #ifdef CLEARCOAT_TINT
                        // Absorption
                        absorption = computeClearCoatLightingAbsorption(clearcoatOut.clearCoatNdotVRefract, preInfo.L, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatColor, clearcoatOut.clearCoatThickness, clearcoatOut.clearCoatIntensity);
                        info.diffuse *= absorption;
                        #ifdef SS_TRANSLUCENCY
                            info.diffuseTransmission *= absorption;
                        #endif
                        #ifdef SPECULARTERM
                            info.specular *= absorption;
                        #endif
                    #endif

                    // Apply energy conservation on diffuse and specular term.
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
            #endif
        #else
            #ifdef SPOTLIGHT{X}
                #ifdef IESLIGHTTEXTURE{X}
                    info = computeIESSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, diffuse{X}.a, glossiness, iesLightTexture{X});
                #else
                    info = computeSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, diffuse{X}.a, glossiness);
                #endif
            #elif defined(HEMILIGHT{X})
                info = computeHemisphericLighting(viewDirectionW, normalW, light{X}.vLightData, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, light{X}.vLightGround, glossiness);
            #elif defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
                info = computeLighting(viewDirectionW, normalW, light{X}.vLightData, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, diffuse{X}.a, glossiness);
            #elif defined(AREALIGHT{X}) && defined(AREALIGHTSUPPORTED)
                info = computeAreaLighting(areaLightsLTC1Sampler, areaLightsLTC2Sampler, viewDirectionW, normalW, vPositionW, light{X}.vLightData.xyz, light{X}.vLightWidth.rgb, light{X}.vLightHeight.rgb, diffuse{X}.rgb, light{X}.vLightSpecular.rgb,
                #ifdef AREALIGHTNOROUGHTNESS
                    0.5
                #else
                    vReflectionInfos.y
                #endif
                );
            #elif defined(CLUSTLIGHT{X}) && CLUSTLIGHT_MAX > 0
                info = computeClusteredLighting(lightMaskTexture{X}, viewDirectionW, normalW, light{X}.vLightData, light{X}.vLights, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, glossiness);
            #endif
        #endif

        #ifdef PROJECTEDLIGHTTEXTURE{X}
            info.diffuse *= computeProjectionTextureDiffuseLighting(projectionLightTexture{X}, textureProjectionMatrix{X}, vPositionW);
        #endif
    #endif

    #ifdef SHADOW{X}
        #ifdef SHADOWCSM{X}
            for (int i = 0; i < SHADOWCSMNUM_CASCADES{X}; i++)
            {
                #ifdef SHADOWCSM_RIGHTHANDED{X}
                    diff{X} = viewFrustumZ{X}[i] + vPositionFromCamera{X}.z;
                #else
                    diff{X} = viewFrustumZ{X}[i] - vPositionFromCamera{X}.z;
                #endif
                if (diff{X} >= 0.) {
                    index{X} = i;
                    break;
                }
            }

            #ifdef SHADOWCSMUSESHADOWMAXZ{X}
            if (index{X} >= 0)
            #endif
            {
                #if defined(SHADOWPCF{X})
                    #if defined(SHADOWLOWQUALITY{X})
                        shadow = computeShadowWithCSMPCF1(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #elif defined(SHADOWMEDIUMQUALITY{X})
                        shadow = computeShadowWithCSMPCF3(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #else
                        shadow = computeShadowWithCSMPCF5(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #endif
                #elif defined(SHADOWPCSS{X})
                    #if defined(SHADOWLOWQUALITY{X})
                        shadow = computeShadowWithCSMPCSS16(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                    #elif defined(SHADOWMEDIUMQUALITY{X})
                        shadow = computeShadowWithCSMPCSS32(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                    #else
                        shadow = computeShadowWithCSMPCSS64(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                    #endif
                #else
                    shadow = computeShadowCSM(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                #endif

                #ifdef SHADOWCSMDEBUG{X}
                    shadowDebug{X} = vec3(shadow) * vCascadeColorsMultiplier{X}[index{X}];
                #endif

                #ifndef SHADOWCSMNOBLEND{X}
                    float frustumLength = frustumLengths{X}[index{X}];
                    float diffRatio = clamp(diff{X} / frustumLength, 0., 1.) * cascadeBlendFactor{X};
                    if (index{X} < (SHADOWCSMNUM_CASCADES{X} - 1) && diffRatio < 1.)
                    {
                        index{X} += 1;
                        float nextShadow = 0.;
                        #if defined(SHADOWPCF{X})
                            #if defined(SHADOWLOWQUALITY{X})
                                nextShadow = computeShadowWithCSMPCF1(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #elif defined(SHADOWMEDIUMQUALITY{X})
                                nextShadow = computeShadowWithCSMPCF3(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #else
                                nextShadow = computeShadowWithCSMPCF5(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #endif
                        #elif defined(SHADOWPCSS{X})
                            #if defined(SHADOWLOWQUALITY{X})
                                nextShadow = computeShadowWithCSMPCSS16(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                            #elif defined(SHADOWMEDIUMQUALITY{X})
                                nextShadow = computeShadowWithCSMPCSS32(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                            #else
                                nextShadow = computeShadowWithCSMPCSS64(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                            #endif
                        #else
                            nextShadow = computeShadowCSM(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                        #endif

                        shadow = mix(nextShadow, shadow, diffRatio);
                        #ifdef SHADOWCSMDEBUG{X}
                            shadowDebug{X} = mix(vec3(nextShadow) * vCascadeColorsMultiplier{X}[index{X}], shadowDebug{X}, diffRatio);
                        #endif
                    }
                #endif
            }
        #elif defined(SHADOWCLOSEESM{X})
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithCloseESMCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow = computeShadowWithCloseESM(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWESM{X})
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithESMCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow = computeShadowWithESM(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPOISSON{X})
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithPoissonSamplingCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow = computeShadowWithPoissonSampling(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCF{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow = computeShadowWithPCF1(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow = computeShadowWithPCF3(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow = computeShadowWithPCF5(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCSS{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow = computeShadowWithPCSS16(vPositionFromLight{X}, vDepthMetric{X}, depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow = computeShadowWithPCSS32(vPositionFromLight{X}, vDepthMetric{X}, depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow = computeShadowWithPCSS64(vPositionFromLight{X}, vDepthMetric{X}, depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #else
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow = computeShadow(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #endif

        #ifdef SHADOWONLY
            #ifndef SHADOWINUSE
                #define SHADOWINUSE
            #endif
            globalShadow += shadow;
            shadowLightCount += 1.0;
        #endif
    #else
        shadow = 1.;
    #endif

    aggShadow += shadow;
    numLights += 1.0;

    #ifndef SHADOWONLY
        #ifdef CUSTOMUSERLIGHTING
            diffuseBase += computeCustomDiffuseLighting(info, diffuseBase, shadow);
            #ifdef SPECULARTERM
                specularBase += computeCustomSpecularLighting(info, specularBase, shadow);
            #endif
        #elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})
            diffuseBase += lightmapColor.rgb * shadow;
            #ifdef SPECULARTERM
                #ifndef LIGHTMAPNOSPECULAR{X}
                    specularBase += info.specular * shadow * lightmapColor.rgb;
                #endif
            #endif
            #ifdef CLEARCOAT
                #ifndef LIGHTMAPNOSPECULAR{X}
                    clearCoatBase += info.clearCoat.rgb * shadow * lightmapColor.rgb;
                #endif
            #endif
            #ifdef SHEEN
                #ifndef LIGHTMAPNOSPECULAR{X}
                    sheenBase += info.sheen.rgb * shadow;
                #endif
            #endif
        #else
            #ifdef SHADOWCSMDEBUG{X}
                diffuseBase += info.diffuse * shadowDebug{X};
            #else
                diffuseBase += info.diffuse * shadow;
            #endif
            #ifdef SS_TRANSLUCENCY
                diffuseTransmissionBase += info.diffuseTransmission * shadow;
            #endif
            #ifdef SPECULARTERM
                specularBase += info.specular * shadow;
            #endif
            #ifdef CLEARCOAT
                clearCoatBase += info.clearCoat.rgb * shadow;
            #endif
            #ifdef SHEEN
                sheenBase += info.sheen.rgb * shadow;
            #endif
        #endif
    #endif
#endif