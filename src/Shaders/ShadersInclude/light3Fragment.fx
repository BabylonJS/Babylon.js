#ifdef LIGHT3
	#ifndef SPECULARTERM
		vec3 vLightSpecular3 = vec3(0.0);
	#endif
	#ifdef SPOTLIGHT3
		info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);
	#endif
	#ifdef HEMILIGHT3
		info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, glossiness);
	#endif
	#if defined(POINTLIGHT3) || defined(DIRLIGHT3)
		info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);
	#endif
	#ifdef SHADOW3
		#ifdef SHADOWVSM3
			shadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);
		#else
			#ifdef SHADOWPCF3
				#if defined(POINTLIGHT3)
					shadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);
				#else
					shadow = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);
				#endif
			#else
				#if defined(POINTLIGHT3)
					shadow = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);
				#else
					shadow = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);
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