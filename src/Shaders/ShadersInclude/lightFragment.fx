#ifdef LIGHT{X}
    #if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))
        //No light calculation
    #else
        #ifdef PBR
            #ifdef SPOTLIGHT{X}
                spotInfo = computeSpotLightingInfo(light{X}.vLightData);

                #ifdef LIGHT_FALLOFF_GLTF{X}
                    spotInfo.attenuation = computeDistanceLightFalloff_GLTF(spotInfo.lightDistanceSquared, light{X}.vLightFalloff.y);
                    spotInfo.attenuation *= computeDirectionalLightFalloff_GLTF(light{X}.vLightDirection.xyz, spotInfo.directionToLightCenterW, light{X}.vLightFalloff.z, light{X}.vLightFalloff.w);
                #elif defined(LIGHT_FALLOFF_PHYSICAL{X})
                    spotInfo.attenuation = computeDistanceLightFalloff_Physical(spotInfo.lightDistanceSquared);
                    spotInfo.attenuation *= computeDirectionalLightFalloff_Physical(light{X}.vLightDirection.xyz, spotInfo.directionToLightCenterW, light{X}.vLightDirection.w);
                #elif defined(LIGHT_FALLOFF_STANDARD{X})
                    spotInfo.attenuation = computeDistanceLightFalloff_Standard(spotInfo.lightOffset, light{X}.vLightFalloff.x);
                    spotInfo.attenuation *= computeDirectionalLightFalloff_Standard(light{X}.vLightDirection.xyz, spotInfo.directionToLightCenterW, light{X}.vLightDirection.w, light{X}.vLightData.w);
                #else
                    spotInfo.attenuation = computeDistanceLightFalloff(spotInfo.lightOffset, spotInfo.lightDistanceSquared, light{X}.vLightFalloff.x, light{X}.vLightFalloff.y);
                    spotInfo.attenuation *= computeDirectionalLightFalloff(light{X}.vLightDirection.xyz, spotInfo.directionToLightCenterW, light{X}.vLightDirection.w, light{X}.vLightData.w, light{X}.vLightFalloff.z, light{X}.vLightFalloff.w);
                #endif

                info = computeSpotLighting(spotInfo, viewDirectionW, normalW, light{X}.vLightDirection, light{X}.vLightDiffuse.rgb, light{X}.vLightDiffuse.a, roughness, NdotV, specularEnvironmentR0, specularEnvironmentR90, geometricRoughnessFactor, NdotL);
            #elif defined(POINTLIGHT{X})
                pointInfo = computePointLightingInfo(light{X}.vLightData);

                #ifdef LIGHT_FALLOFF_GLTF{X}
                    pointInfo.attenuation = computeDistanceLightFalloff_GLTF(pointInfo.lightDistanceSquared, light{X}.vLightFalloff.y);
                #elif defined(LIGHT_FALLOFF_PHYSICAL{X})
                    pointInfo.attenuation = computeDistanceLightFalloff_Physical(pointInfo.lightDistanceSquared);
                #elif defined(LIGHT_FALLOFF_STANDARD{X})
                    pointInfo.attenuation = computeDistanceLightFalloff_Standard(pointInfo.lightOffset, light{X}.vLightFalloff.x);
                #else
                    pointInfo.attenuation = computeDistanceLightFalloff(pointInfo.lightOffset, pointInfo.lightDistanceSquared, light{X}.vLightFalloff.x, light{X}.vLightFalloff.y);
                #endif
                
                info = computePointLighting(pointInfo, viewDirectionW, normalW, light{X}.vLightDiffuse.rgb, light{X}.vLightDiffuse.a, roughness, NdotV, specularEnvironmentR0, specularEnvironmentR90, geometricRoughnessFactor, NdotL);
            #elif defined(HEMILIGHT{X})
                info = computeHemisphericLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightGround, roughness, NdotV, specularEnvironmentR0, specularEnvironmentR90, geometricRoughnessFactor, NdotL);
            #elif defined(DIRLIGHT{X})
                info = computeDirectionalLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, roughness, NdotV, specularEnvironmentR0, specularEnvironmentR90, geometricRoughnessFactor, NdotL);
            #endif
        #else
            #ifdef SPOTLIGHT{X}
                info = computeSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, glossiness);
            #elif defined(HEMILIGHT{X})
                info = computeHemisphericLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightGround, glossiness);
            #elif defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
                info = computeLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, glossiness);
            #endif
        #endif
        #ifdef PROJECTEDLIGHTTEXTURE{X}
            info.diffuse *= computeProjectionTextureDiffuseLighting(projectionLightSampler{X}, textureProjectionMatrix{X});
        #endif
    #endif
    #ifdef SHADOW{X}
        #ifdef SHADOWCLOSEESM{X}
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithCloseESMCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow = computeShadowWithCloseESM(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWESM{X})
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithESMCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow = computeShadowWithESM(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPOISSON{X})
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowWithPoissonSamplingCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow = computeShadowWithPoissonSampling(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCF{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow = computeShadowWithPCF1(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow = computeShadowWithPCF3(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow = computeShadowWithPCF5(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCSS{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow = computeShadowWithPCSS16(vPositionFromLight{X}, vDepthMetric{X}, depthSampler{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow = computeShadowWithPCSS32(vPositionFromLight{X}, vDepthMetric{X}, depthSampler{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow = computeShadowWithPCSS64(vPositionFromLight{X}, vDepthMetric{X}, depthSampler{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #else
            #if defined(SHADOWCUBE{X})
                shadow = computeShadowCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow = computeShadow(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
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

    #ifndef SHADOWONLY
        #ifdef CUSTOMUSERLIGHTING
            diffuseBase += computeCustomDiffuseLighting(info, diffuseBase, shadow);
            #ifdef SPECULARTERM
                specularBase += computeCustomSpecularLighting(info, specularBase, shadow);
            #endif
        #elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})
            diffuseBase += lightmapColor * shadow;
            #ifdef SPECULARTERM
                #ifndef LIGHTMAPNOSPECULAR{X}
                    specularBase += info.specular * shadow * lightmapColor;
                #endif
            #endif
        #else
            diffuseBase += info.diffuse * shadow;
            #ifdef SPECULARTERM
                specularBase += info.specular * shadow;
            #endif
        #endif
    #endif
#endif