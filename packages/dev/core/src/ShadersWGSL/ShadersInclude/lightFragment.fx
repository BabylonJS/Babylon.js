#ifdef LIGHT{X}
    #if defined(SHADOWONLY) || defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else

        var diffuse{X}: vec4f = light{X}.vLightDiffuse;
        #define CUSTOM_LIGHT{X}_COLOR // Use to modify light color. Currently only supports diffuse.

        #ifdef PBR
            // Compute Pre Lighting infos
            #ifdef SPOTLIGHT{X}
                preInfo = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW, fragmentInputs.vPositionW);
            #elif defined(POINTLIGHT{X})
                preInfo = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW, fragmentInputs.vPositionW);
            #elif defined(HEMILIGHT{X})
                preInfo = computeHemisphericPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW);
            #elif defined(DIRLIGHT{X})
                preInfo = computeDirectionalPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW);
            #elif defined(AREALIGHT{X}) && defined(AREALIGHTSUPPORTED)
                preInfo = computeAreaPreLightingInfo(areaLightsLTC1Sampler, areaLightsLTC1SamplerSampler, areaLightsLTC2Sampler, areaLightsLTC2SamplerSampler, viewDirectionW, normalW, fragmentInputs.vPositionW, light{X}.vLightData.xyz, light{X}.vLightWidth.xyz, light{X}.vLightHeight.xyz, roughness);
            #endif

            preInfo.NdotV = NdotV;

            // Compute Attenuation infos
            #ifdef SPOTLIGHT{X}
                #ifdef LIGHT_FALLOFF_GLTF{X}
                    preInfo.attenuation = computeDistanceLightFalloff_GLTF(preInfo.lightDistanceSquared, light{X}.vLightFalloff.y);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X}, iesLightTexture{X}Sampler);
                    #else
                        preInfo.attenuation *= computeDirectionalLightFalloff_GLTF(light{X}.vLightDirection.xyz, preInfo.L, light{X}.vLightFalloff.z, light{X}.vLightFalloff.w);
                    #endif
                #elif defined(LIGHT_FALLOFF_PHYSICAL{X})
                    preInfo.attenuation = computeDistanceLightFalloff_Physical(preInfo.lightDistanceSquared);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X}, iesLightTexture{X}Sampler);
                    #else
                        preInfo.attenuation *= computeDirectionalLightFalloff_Physical(light{X}.vLightDirection.xyz, preInfo.L, light{X}.vLightDirection.w);
                    #endif
                #elif defined(LIGHT_FALLOFF_STANDARD{X})
                    preInfo.attenuation = computeDistanceLightFalloff_Standard(preInfo.lightOffset, light{X}.vLightFalloff.x);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X}, iesLightTexture{X}Sampler);
                    #else
                        preInfo.attenuation *= computeDirectionalLightFalloff_Standard(light{X}.vLightDirection.xyz, preInfo.L, light{X}.vLightDirection.w, light{X}.vLightData.w);
                    #endif
                #else
                    preInfo.attenuation = computeDistanceLightFalloff(preInfo.lightOffset, preInfo.lightDistanceSquared, light{X}.vLightFalloff.x, light{X}.vLightFalloff.y);
                    #ifdef IESLIGHTTEXTURE{X}
                        preInfo.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo.L, iesLightTexture{X}, iesLightTexture{X}Sampler);
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

            #ifdef IRIDESCENCE
                preInfo.iridescenceIntensity = iridescenceIntensity;
            #endif

            // Diffuse contribution
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
                    info.diffuseTransmission = vec3f(0.0);
                #endif
            #else
                info.diffuse = computeDiffuseLighting(preInfo, diffuse{X}.rgb);
            #endif

            // Specular contribution
            #ifdef SPECULARTERM
                #if AREALIGHT{X}
                    info.specular = computeAreaSpecularLighting(preInfo, light{X}.vLightSpecular.rgb);
                #else
                    #ifdef ANISOTROPIC
                        info.specular = computeAnisotropicSpecularLighting(preInfo, viewDirectionW, normalW, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactors.x, diffuse{X}.rgb);
                    #else
                        info.specular = computeSpecularLighting(preInfo, normalW, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactors.x, diffuse{X}.rgb, uniforms.vReflectivityColor.b);
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
                    info = computeIESSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, diffuse{X}.a, glossiness, iesLightTexture{X}, iesLightTexture{X}Sampler);
                #else
                    info = computeSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, diffuse{X}.a, glossiness);
                #endif                
            #elif defined(HEMILIGHT{X})
                info = computeHemisphericLighting(viewDirectionW, normalW, light{X}.vLightData, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, light{X}.vLightGround, glossiness);
            #elif defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
                info = computeLighting(viewDirectionW, normalW, light{X}.vLightData, diffuse{X}.rgb, light{X}.vLightSpecular.rgb, diffuse{X}.a, glossiness);
            #elif define(AREALIGHT{X}) && defined(AREALIGHTSUPPORTED)
                    info = computeAreaLighting(areaLightsLTC1Sampler, areaLightsLTC1SamplerSampler, areaLightsLTC2Sampler, areaLightsLTC2SamplerSampler, viewDirectionW, normalW, fragmentInputs.vPositionW, light{X}.vLightData.xyz, light{X}.vLightWidth.xyz, light{X}.vLightHeight.xyz, diffuse{X}.rgb, light{X}.vLightSpecular.rgb,
                #ifdef AREALIGHTNOROUGHTNESS
                    0.5
                #else
                    uniforms.vReflectionInfos.y
                #endif
                    );
            #endif
        #endif

        #ifdef PROJECTEDLIGHTTEXTURE{X}
            info.diffuse *= computeProjectionTextureDiffuseLighting(projectionLightTexture{X}, projectionLightTexture{X}Sampler, uniforms.textureProjectionMatrix{X}, fragmentInputs.vPositionW);
        #endif
    #endif

    #ifdef SHADOW{X}
            #ifdef SHADOWCSMDEBUG{X}
                var shadowDebug{X}: vec3f;
            #endif
        #ifdef SHADOWCSM{X}
            #ifdef SHADOWCSMUSESHADOWMAXZ{X}
                var index{X}: i32 = -1;
            #else
                var index{X}: i32 = SHADOWCSMNUM_CASCADES{X} - 1;
            #endif

            var diff{X}: f32 = 0.;
            
            vPositionFromLight{X}[0] = fragmentInputs.vPositionFromLight{X}_0;
            vPositionFromLight{X}[1] = fragmentInputs.vPositionFromLight{X}_1;
            vPositionFromLight{X}[2] = fragmentInputs.vPositionFromLight{X}_2;
            vPositionFromLight{X}[3] = fragmentInputs.vPositionFromLight{X}_3;
                       
            vDepthMetric{X}[0] = fragmentInputs.vDepthMetric{X}_0;
            vDepthMetric{X}[1] = fragmentInputs.vDepthMetric{X}_1;
            vDepthMetric{X}[2] = fragmentInputs.vDepthMetric{X}_2;
            vDepthMetric{X}[3] = fragmentInputs.vDepthMetric{X}_3;
            
            for (var i:i32 = 0; i < SHADOWCSMNUM_CASCADES{X}; i++) 
            {
                #ifdef SHADOWCSM_RIGHTHANDED{X}
                    diff{X} = uniforms.viewFrustumZ{X}[i] + fragmentInputs.vPositionFromCamera{X}.z;
                #else
                    diff{X} = uniforms.viewFrustumZ{X}[i] - fragmentInputs.vPositionFromCamera{X}.z;
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
                        shadow = computeShadowWithCSMPCF1(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #elif defined(SHADOWMEDIUMQUALITY{X})
                        shadow = computeShadowWithCSMPCF3(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #else
                        shadow = computeShadowWithCSMPCF5(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #endif
                #elif defined(SHADOWPCSS{X})
                    #if defined(SHADOWLOWQUALITY{X})
                        shadow = computeShadowWithCSMPCSS16(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, uniforms.lightSizeUVCorrection{X}[index{X}], uniforms.depthCorrection{X}[index{X}], uniforms.penumbraDarkness{X});
                    #elif defined(SHADOWMEDIUMQUALITY{X})
                        shadow = computeShadowWithCSMPCSS32(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, uniforms.lightSizeUVCorrection{X}[index{X}], uniforms.depthCorrection{X}[index{X}], uniforms.penumbraDarkness{X});
                    #else
                        shadow = computeShadowWithCSMPCSS64(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, uniforms.lightSizeUVCorrection{X}[index{X}], uniforms.depthCorrection{X}[index{X}], uniforms.penumbraDarkness{X});
                    #endif
                #else
                    shadow = computeShadowCSM(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                #endif

                #ifdef SHADOWCSMDEBUG{X}
                    shadowDebug{X} = vec3f(shadow) * vCascadeColorsMultiplier{X}[index{X}];
                #endif

                #ifndef SHADOWCSMNOBLEND{X}
                    var frustumLength:f32 = uniforms.frustumLengths{X}[index{X}];
                    var diffRatio:f32 = clamp(diff{X} / frustumLength, 0., 1.) * uniforms.cascadeBlendFactor{X};
                    if (index{X} < (SHADOWCSMNUM_CASCADES{X} - 1) && diffRatio < 1.)
                    {
                        index{X} += 1;
                        var nextShadow: f32 = 0.;
                        #if defined(SHADOWPCF{X})
                            #if defined(SHADOWLOWQUALITY{X})
                                nextShadow = computeShadowWithCSMPCF1(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], , shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #elif defined(SHADOWMEDIUMQUALITY{X})
                                nextShadow = computeShadowWithCSMPCF3(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #else
                                nextShadow = computeShadowWithCSMPCF5(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #endif
                        #elif defined(SHADOWPCSS{X})
                            #if defined(SHADOWLOWQUALITY{X})
                                nextShadow = computeShadowWithCSMPCSS16(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, uniforms.lightSizeUVCorrection{X}[index{X}], uniforms.depthCorrection{X}[index{X}], uniforms.penumbraDarkness{X});
                            #elif defined(SHADOWMEDIUMQUALITY{X})
                                nextShadow = computeShadowWithCSMPCSS32(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, uniforms.lightSizeUVCorrection{X}[index{X}], uniforms.depthCorrection{X}[index{X}], uniforms.penumbraDarkness{X});
                            #else
                                nextShadow = computeShadowWithCSMPCSS64(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, uniforms.lightSizeUVCorrection{X}[index{X}], uniforms.depthCorrection{X}[index{X}], uniforms.penumbraDarkness{X});
                            #endif
                        #else
                            nextShadow = computeShadowCSM(index{X}, vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
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
                shadow = computeShadowWithCloseESMCube(fragmentInputs.vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow = computeShadowWithCloseESM(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWESM{X})
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithESMCube(fragmentInputs.vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow = computeShadowWithESM(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPOISSON{X})
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithPoissonSamplingCube(fragmentInputs.vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow = computeShadowWithPoissonSampling(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCF{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow = computeShadowWithPCF1(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow = computeShadowWithPCF3(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow = computeShadowWithPCF5(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCSS{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow = computeShadowWithPCSS16(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow = computeShadowWithPCSS32(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow = computeShadowWithPCSS64(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, depthTexture{X}, depthTexture{X}Sampler, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #else
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowCube(fragmentInputs.vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow = computeShadow(fragmentInputs.vPositionFromLight{X}, fragmentInputs.vDepthMetric{X}, shadowTexture{X}, shadowTexture{X}Sampler, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
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