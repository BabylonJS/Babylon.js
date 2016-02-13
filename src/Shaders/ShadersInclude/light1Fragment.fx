#ifdef LIGHT1
	#ifndef SPECULARTERM
		vec3 vLightSpecular1 = vec3(0.0);
	#endif
	#ifdef SPOTLIGHT1
		info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);
	#endif
	#ifdef HEMILIGHT1
		info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, glossiness);
	#endif
	#if defined(POINTLIGHT1) || defined(DIRLIGHT1)
		info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);
	#endif
	#ifdef SHADOW1
		#ifdef SHADOWVSM1
			shadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);
		#else
			#ifdef SHADOWPCF1
				#if defined(POINTLIGHT1)
					shadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);
				#else
					shadow = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);
				#endif
			#else
				#if defined(POINTLIGHT1)
					shadow = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);
				#else
					shadow = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);
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