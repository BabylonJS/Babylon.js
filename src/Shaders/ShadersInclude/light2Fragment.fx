#ifdef LIGHT2
	#ifndef SPECULARTERM
		vec3 vLightSpecular2 = vec3(0.0);
	#endif
	#ifdef SPOTLIGHT2
		info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);
	#endif
	#ifdef HEMILIGHT2
		info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, glossiness);
	#endif
	#if defined(POINTLIGHT2) || defined(DIRLIGHT2)
		info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);
	#endif
	#ifdef SHADOW2
		#ifdef SHADOWVSM2
			shadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);
		#else
			#ifdef SHADOWPCF2
				#if defined(POINTLIGHT2)
					shadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);
				#else
					shadow = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);
				#endif
			#else
				#if defined(POINTLIGHT2)
					shadow = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);
				#else
					shadow = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);
				#endif
			#endif	
		#endif	
		#else
		shadow = 1.;
	#endif
	diffuseBase += info.diffuse * shadow;
	#ifdef SPECULARTERM
		specularBase += info.specular * shadow;
	#endif
#endif