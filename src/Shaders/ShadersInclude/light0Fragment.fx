#ifdef LIGHT0
	#ifndef SPECULARTERM
		vec3 vLightSpecular0 = vec3(0.0);
	#endif
	#ifdef SPOTLIGHT0
		lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);
	#endif
	#ifdef HEMILIGHT0
		lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, glossiness);
	#endif
	#if defined(POINTLIGHT0) || defined(DIRLIGHT0)
		lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);
	#endif
	#ifdef SHADOW0
		#ifdef SHADOWVSM0
			shadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);
		#else
		#ifdef SHADOWPCF0
			#if defined(POINTLIGHT0)
				shadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);
			#else
				shadow = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);
			#endif
		#else
			#if defined(POINTLIGHT0)
				shadow = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);
			#else
				shadow = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);
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