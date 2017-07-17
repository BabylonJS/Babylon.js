#ifdef LIGHT{X}
    #if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else
		#ifdef PBR
			#ifdef SPOTLIGHT{X}
				info = computeSpotLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDirection, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, roughness, NdotV, specularEnvironmentR0, specularEnvironmentR90, NdotL);
			#endif
			#ifdef HEMILIGHT{X}
				info = computeHemisphericLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightGround, roughness, NdotV, specularEnvironmentR0, specularEnvironmentR90, NdotL);
			#endif
			#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
				info = computeLighting(viewDirectionW, normalW, light{X}.vLightData, light{X}.vLightDiffuse.rgb, light{X}.vLightSpecular, light{X}.vLightDiffuse.a, roughness, NdotV, specularEnvironmentR0, specularEnvironmentR90, NdotL);
			#endif
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
    #endif
	#ifdef SHADOW{X}
		#ifdef SHADOWCLOSEESM{X}
			#if defined(SHADOWCUBE{X})
				shadow = computeShadowWithCloseESMCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
			#else
				shadow = computeShadowWithCloseESM(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
			#endif
		#else
			#ifdef SHADOWESM{X}
				#if defined(SHADOWCUBE{X})
					shadow = computeShadowWithESMCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
				#else
					shadow = computeShadowWithESM(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
				#endif
			#else	
				#ifdef SHADOWPCF{X}
					#if defined(SHADOWCUBE{X})
						shadow = computeShadowWithPCFCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.depthValues);
					#else
						shadow = computeShadowWithPCF(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
					#endif
				#else
					#if defined(SHADOWCUBE{X})
						shadow = computeShadowCube(light{X}.vLightData.xyz, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.depthValues);
					#else
						shadow = computeShadow(vPositionFromLight{X}, vDepthMetric{X}, shadowSampler{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
					#endif
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