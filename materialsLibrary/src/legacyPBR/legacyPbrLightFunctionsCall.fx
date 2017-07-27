#ifdef LIGHT{X}
    #if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else
        #ifdef SPOTLIGHT{X}
            info = computeSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, roughness, NdotV, specularEnvironmentR90, NdotL);
        #endif
        #ifdef HEMILIGHT{X}
            info = computeHemisphericLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightGround, roughness, NdotV, specularEnvironmentR90, NdotL);
        #endif
        #if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
            info = computeLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, roughness, NdotV, specularEnvironmentR90, NdotL);
        #endif
    #endif
    
    #ifdef SHADOW{X}
        #ifdef SHADOWESM{X}
			#if defined(SHADOWCUBE{X})
				notShadowLevel = computeShadowWithESMCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
			#else
				notShadowLevel = computeShadowWithESM(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, 0.0);
			#endif
        #else
            #ifdef SHADOWPCF{X}
                #if defined(SHADOWCUBE{X})
                    notShadowLevel = computeShadowWithPCFCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.depthValues);
                #else
                    notShadowLevel = computeShadowWithPCF(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, 0.0);
                #endif
            #else
                #if defined(SHADOWCUBE{X})
                    notShadowLevel = computeShadowCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.depthValues);
                #else
                    notShadowLevel = computeShadow(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, 0.0);
                #endif
            #endif
        #endif
    #else
        notShadowLevel = 1.;
    #endif
    
    #if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})
	    lightDiffuseContribution += lightmapColor * notShadowLevel;
	    
        #ifdef SPECULARTERM
            #ifndef LIGHTMAPNOSPECULAR{X}
                lightSpecularContribution += info.specular * notShadowLevel * lightmapColor;
            #endif
        #endif
    #else
        lightDiffuseContribution += info.diffuse * notShadowLevel;
        
        #ifdef OVERLOADEDSHADOWVALUES
            if (NdotL < 0.000000000011)
            {
                notShadowLevel = 1.;
            }
            shadowedOnlyLightDiffuseContribution *= notShadowLevel;
        #endif

        #ifdef SPECULARTERM
            lightSpecularContribution += info.specular * notShadowLevel;
        #endif
    #endif
#endif