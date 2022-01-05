#ifdef LIGHT{X}
	uniform Light{X}
	{
		vec4 vLightData;

		vec4 vLightDiffuse;
		vec4 vLightSpecular;
		#ifdef SPOTLIGHT{X}
			vec4 vLightDirection;
			vec4 vLightFalloff;
		#elif defined(POINTLIGHT{X})
			vec4 vLightFalloff;
		#elif defined(HEMILIGHT{X})
			vec3 vLightGround;
		#endif
		vec4 shadowsInfo;
		vec2 depthValues;
	} light{X};
#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform mat4 lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}];

		varying vec4 vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}];
		varying float vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}];
		varying vec4 vPositionFromCamera{X};
	#elif defined(SHADOWCUBE{X})
	#else
		varying vec4 vPositionFromLight{X};
		varying float vDepthMetric{X};

		uniform mat4 lightMatrix{X};
	#endif
#endif

#endif