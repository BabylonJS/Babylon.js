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
			#if defined(POINTLIGHT{X})
				notShadowLevel = computeShadowWithESMCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z);
			#else
				notShadowLevel = computeShadowWithESM(light{X}.vPositionFromLight, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z);
			#endif
        #else
            #ifdef SHADOWPCF{X}
                #if defined(POINTLIGHT{X})
                    notShadowLevel = computeShadowWithPCFCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x);
                #else
                    notShadowLevel = computeShadowWithPCF(vPositionFromLight{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x);
                #endif
            #else
                #if defined(POINTLIGHT{X})
                    notShadowLevel = computeShadowCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x);
                #else
                    notShadowLevel = computeShadow(vPositionFromLight{X}, shadowSampler{X}, light{X}.shadowsInfo.x);
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