#ifdef LIGHT{X}
    #if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else
        #ifdef SPOTLIGHT{X}
            info = computeSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, glossiness);
        #endif
        #ifdef HEMILIGHT{X}
            info = computeHemisphericLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightGround, glossiness);
        #endif
        #if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
            info = computeLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, glossiness);
        #endif
    #endif
	#ifdef SHADOW{X}
		#ifdef SHADOWESM{X}
			#if defined(POINTLIGHT{X})
				shadow = computeShadowWithESMCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z);
			#else
				shadow = computeShadowWithESM(vPositionFromLight{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z);
			#endif
		#else	
			#ifdef SHADOWPCF{X}
				#if defined(POINTLIGHT{X})
					shadow = computeShadowWithPCFCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x);
				#else
					shadow = computeShadowWithPCF(vPositionFromLight{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x);
				#endif
			#else
				#if defined(POINTLIGHT{X})
					shadow = computeShadowCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x);
				#else
					shadow = computeShadow(vPositionFromLight{X}, shadowSampler{X}, light{X}.shadowsInfo.x);
				#endif
			#endif
		#endif
	#else
		shadow = 1.;
	#endif
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