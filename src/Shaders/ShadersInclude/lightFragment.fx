#ifdef LIGHT{X}
    #if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
        //No light calculation
    #else
        #ifndef SPECULARTERM
            vec3 vLightSpecular{X} = vec3(0.);
        #endif
        #ifdef SPOTLIGHT{X}
            info = computeSpotLighting(viewDirectionW, normalW, vLightData{X}, vLightDirection{X}, vLightDiffuse{X}.rgb, vLightSpecular{X}, vLightDiffuse{X}.a, glossiness);
        #endif
        #ifdef HEMILIGHT{X}
            info = computeHemisphericLighting(viewDirectionW, normalW, vLightData{X}, vLightDiffuse{X}.rgb, vLightSpecular{X}, vLightGround{X}, glossiness);
        #endif
        #if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
            info = computeLighting(viewDirectionW, normalW, vLightData{X}, vLightDiffuse{X}.rgb, vLightSpecular{X}, vLightDiffuse{X}.a, glossiness);
        #endif
    #endif
	#ifdef SHADOW{X}
		#ifdef SHADOWVSM{X}
			shadow = computeShadowWithVSM(vPositionFromLight{X}, shadowSampler{X}, shadowsInfo{X}.z, shadowsInfo{X}.x);
		#else
		#ifdef SHADOWPCF{X}
			#if defined(POINTLIGHT{X})
				shadow = computeShadowWithPCFCube(vLightData{X}.xyz, shadowSampler{X}, shadowsInfo{X}.y, shadowsInfo{X}.z, shadowsInfo{X}.x);
			#else
				shadow = computeShadowWithPCF(vPositionFromLight{X}, shadowSampler{X}, shadowsInfo{X}.y, shadowsInfo{X}.z, shadowsInfo{X}.x);
			#endif
		#else
			#if defined(POINTLIGHT{X})
				shadow = computeShadowCube(vLightData{X}.xyz, shadowSampler{X}, shadowsInfo{X}.x, shadowsInfo{X}.z);
			#else
				shadow = computeShadow(vPositionFromLight{X}, shadowSampler{X}, shadowsInfo{X}.x, shadowsInfo{X}.z);
			#endif
		#endif
	#endif
	#else
		shadow = 1.;
	#endif
    #if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})
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