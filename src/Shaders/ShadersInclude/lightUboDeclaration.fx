#ifdef LIGHT{X}
	uniform Light{X}
	{
		vec4 vLightData;
		vec4 vLightDiffuse;
		vec3 vLightSpecular;
		#ifdef SPOTLIGHT{X}
			vec4 vLightDirection;
		#endif
		#ifdef HEMILIGHT{X}
			vec3 vLightGround;
		#endif
		vec3 shadowsInfo;
	} light{X};

#ifdef SHADOW{X}
	#if defined(SHADOWCUBE{X})
		uniform samplerCube shadowSampler{X};
	#else
		varying vec4 vPositionFromLight{X};
		uniform sampler2D shadowSampler{X};
	#endif
#endif

#endif