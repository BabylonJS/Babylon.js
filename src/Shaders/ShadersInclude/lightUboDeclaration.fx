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
		vec4 shadowsInfo;
		vec2 depthValues;
	} light{X};

#ifdef SHADOW{X}
	#if defined(SHADOWCUBE{X})
		uniform samplerCube shadowSampler{X};
	#else
		varying vec4 vPositionFromLight{X};
		varying float vDepthMetric{X};

		uniform sampler2D shadowSampler{X};
		uniform mat4 lightMatrix{X};
	#endif
#endif

#endif