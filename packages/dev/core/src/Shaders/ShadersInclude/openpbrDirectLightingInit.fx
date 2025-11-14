#ifdef LIGHT{X}
    preLightingInfo preInfo{X};
    preLightingInfo preInfoCoat{X};
    // openpbrLightingInfo info{X};
    vec4 lightColor{X} = light{X}.vLightDiffuse;
    float shadow{X} = 1.;
    #if defined(SHADOWONLY) || defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else

        #define CUSTOM_LIGHT{X}_COLOR // Use to modify light color. Currently only supports diffuse.

        // Compute Pre Lighting infos
        #ifdef SPOTLIGHT{X}
            preInfo{X} = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW, vPositionW);
            preInfoCoat{X} = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, coatNormalW, vPositionW);
        #elif defined(POINTLIGHT{X})
            preInfo{X} = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW, vPositionW);
            preInfoCoat{X} = computePointAndSpotPreLightingInfo(light{X}.vLightData, viewDirectionW, coatNormalW, vPositionW);
        #elif defined(HEMILIGHT{X})
            preInfo{X} = computeHemisphericPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW);
            preInfoCoat{X} = computeHemisphericPreLightingInfo(light{X}.vLightData, viewDirectionW, coatNormalW);
        #elif defined(DIRLIGHT{X})
            preInfo{X} = computeDirectionalPreLightingInfo(light{X}.vLightData, viewDirectionW, normalW);
            preInfoCoat{X} = computeDirectionalPreLightingInfo(light{X}.vLightData, viewDirectionW, coatNormalW);
        #elif defined(AREALIGHT{X}) && defined(AREALIGHTSUPPORTED)
            preInfo{X} = computeAreaPreLightingInfo(areaLightsLTC1Sampler, areaLightsLTC2Sampler, viewDirectionW, normalW, vPositionW, light{X}.vLightData, light{X}.vLightWidth.xyz, light{X}.vLightHeight.xyz, specular_roughness);
            preInfoCoat{X} = computeAreaPreLightingInfo(areaLightsLTC1Sampler, areaLightsLTC2Sampler, viewDirectionW, coatNormalW, vPositionW, light{X}.vLightData, light{X}.vLightWidth.xyz, light{X}.vLightHeight.xyz, coat_roughness);
        #endif

        preInfo{X}.NdotV = baseGeoInfo.NdotV;
        preInfoCoat{X}.NdotV = coatGeoInfo.NdotV;

        // Compute Attenuation infos
        #ifdef SPOTLIGHT{X}
            #ifdef LIGHT_FALLOFF_GLTF{X}
                preInfo{X}.attenuation = computeDistanceLightFalloff_GLTF(preInfo{X}.lightDistanceSquared, light{X}.vLightFalloff.y);
                #ifdef IESLIGHTTEXTURE{X}
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo{X}.L, iesLightTexture{X});
                #else
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff_GLTF(light{X}.vLightDirection.xyz, preInfo{X}.L, light{X}.vLightFalloff.z, light{X}.vLightFalloff.w);
                #endif
            #elif defined(LIGHT_FALLOFF_PHYSICAL{X})
                preInfo{X}.attenuation = computeDistanceLightFalloff_Physical(preInfo{X}.lightDistanceSquared);
                #ifdef IESLIGHTTEXTURE{X}
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo{X}.L, iesLightTexture{X});
                #else
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff_Physical(light{X}.vLightDirection.xyz, preInfo{X}.L, light{X}.vLightDirection.w);
                #endif
            #elif defined(LIGHT_FALLOFF_STANDARD{X})
                preInfo{X}.attenuation = computeDistanceLightFalloff_Standard(preInfo{X}.lightOffset, light{X}.vLightFalloff.x);
                #ifdef IESLIGHTTEXTURE{X}
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo{X}.L, iesLightTexture{X});
                #else
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff_Standard(light{X}.vLightDirection.xyz, preInfo{X}.L, light{X}.vLightDirection.w, light{X}.vLightData.w);
                #endif
            #else
                preInfo{X}.attenuation = computeDistanceLightFalloff(preInfo{X}.lightOffset, preInfo{X}.lightDistanceSquared, light{X}.vLightFalloff.x, light{X}.vLightFalloff.y);
                #ifdef IESLIGHTTEXTURE{X}
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz, preInfo{X}.L, iesLightTexture{X});
                #else
                    preInfo{X}.attenuation *= computeDirectionalLightFalloff(light{X}.vLightDirection.xyz, preInfo{X}.L, light{X}.vLightDirection.w, light{X}.vLightData.w, light{X}.vLightFalloff.z, light{X}.vLightFalloff.w);
                #endif
            #endif
        #elif defined(POINTLIGHT{X})
            #ifdef LIGHT_FALLOFF_GLTF{X}
                preInfo{X}.attenuation = computeDistanceLightFalloff_GLTF(preInfo{X}.lightDistanceSquared, light{X}.vLightFalloff.y);
            #elif defined(LIGHT_FALLOFF_PHYSICAL{X})
                preInfo{X}.attenuation = computeDistanceLightFalloff_Physical(preInfo{X}.lightDistanceSquared);
            #elif defined(LIGHT_FALLOFF_STANDARD{X})
                preInfo{X}.attenuation = computeDistanceLightFalloff_Standard(preInfo{X}.lightOffset, light{X}.vLightFalloff.x);
            #else
                preInfo{X}.attenuation = computeDistanceLightFalloff(preInfo{X}.lightOffset, preInfo{X}.lightDistanceSquared, light{X}.vLightFalloff.x, light{X}.vLightFalloff.y);
            #endif
        #else
            preInfo{X}.attenuation = 1.0;
        #endif

        preInfoCoat{X}.attenuation = preInfo{X}.attenuation;

        // Simulates Light radius for diffuse and spec term
        // clear coat is using a dedicated roughness
        #if defined(HEMILIGHT{X}) || defined(AREALIGHT{X})
            preInfo{X}.roughness = specular_roughness;
            preInfoCoat{X}.roughness = coat_roughness;
        #else
            preInfo{X}.roughness = adjustRoughnessFromLightProperties(specular_roughness, light{X}.vLightSpecular.a, preInfo{X}.lightDistance);
            preInfoCoat{X}.roughness = adjustRoughnessFromLightProperties(coat_roughness, light{X}.vLightSpecular.a, preInfoCoat{X}.lightDistance);
        #endif
        preInfo{X}.diffuseRoughness = base_diffuse_roughness;
        preInfo{X}.surfaceAlbedo = base_color.rgb;
    #endif
#endif