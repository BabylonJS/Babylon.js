#ifdef LIGHT{X}
    #if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else
        #ifndef SPECULARTERM
            vec3 vLightSpecular{X} = vec3(0.0);
        #endif
        #ifdef SPOTLIGHT{X}
            info = computeSpotLighting(viewDirectionW, normalW, vLightData{X}, vLightDirection{X}, vLightDiffuse{X}.rgb, vLightSpecular{X}, vLightDiffuse{X}.a, roughness, NdotV, specularEnvironmentR90, NdotL);
        #endif
        #ifdef HEMILIGHT{X}
            info = computeHemisphericLighting(viewDirectionW, normalW, vLightData{X}, vLightDiffuse{X}.rgb, vLightSpecular{X}, vLightGround{X}, roughness, NdotV, specularEnvironmentR90, NdotL);
        #endif
        #if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
            info = computeLighting(viewDirectionW, normalW, vLightData{X}, vLightDiffuse{X}.rgb, vLightSpecular{X}, vLightDiffuse{X}.a, roughness, NdotV, specularEnvironmentR90, NdotL);
        #endif
    #endif
    
    #ifdef SHADOW{X}
        #ifdef SHADOWVSM{X}
            notShadowLevel = computeShadowWithVSM(vPositionFromLight{X}, shadowSampler{X}, shadowsInfo{X}.z, shadowsInfo{X}.x);
        #else
            #ifdef SHADOWPCF{X}
                #if defined(POINTLIGHT{X})
                    notShadowLevel = computeShadowWithPCFCube(vLightData{X}.xyz, shadowSampler{X}, shadowsInfo{X}.y, shadowsInfo{X}.z, shadowsInfo{X}.x);
                #else
                    notShadowLevel = computeShadowWithPCF(vPositionFromLight{X}, shadowSampler{X}, shadowsInfo{X}.y, shadowsInfo{X}.z, shadowsInfo{X}.x);
                #endif
            #else
                #if defined(POINTLIGHT{X})
                    notShadowLevel = computeShadowCube(vLightData{X}.xyz, shadowSampler{X}, shadowsInfo{X}.x, shadowsInfo{X}.z);
                #else
                    notShadowLevel = computeShadow(vPositionFromLight{X}, shadowSampler{X}, shadowsInfo{X}.x, shadowsInfo{X}.z);
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