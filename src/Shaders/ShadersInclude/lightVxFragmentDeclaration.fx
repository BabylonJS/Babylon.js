#ifdef LIGHT{X}
	uniform vec4 vLightData{X};
	uniform vec4 vLightDiffuse{X};

	#ifdef SPECULARTERM
		uniform vec4 vLightSpecular{X};
	#else
		vec4 vLightSpecular{X} = vec4(0.);
	#endif
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
		uniform vec4 shadowsInfo{X};
		uniform vec2 depthValues{X};
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vec4 vLightDirection{X};
		uniform vec4 vLightFalloff{X};
	#elif defined(POINTLIGHT{X})
		uniform vec4 vLightFalloff{X};
	#elif defined(HEMILIGHT{X})
		uniform vec3 vLightGround{X};
	#endif
#endif