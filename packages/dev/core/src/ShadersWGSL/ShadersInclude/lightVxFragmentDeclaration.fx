#ifdef LIGHT{X}
	uniform vLightData{X}: vec4f;
	uniform vLightDiffuse{X}: vec4f;

	#ifdef SPECULARTERM
		uniform vLightSpecular{X}: vec4f;
	#else
		var vLightSpecular{X}: vec4f =  vec4f(0.);
	#endif
	#ifdef SHADOW{X}
        #ifdef SHADOWCSM{X}
            uniform lightMatrix{X}: mat4x4f[SHADOWCSMNUM_CASCADES{X}];

            varying var vPositionFromLight{X}: vec4f[SHADOWCSMNUM_CASCADES{X}];
            varying var vDepthMetric{X}: f32[SHADOWCSMNUM_CASCADES{X}];
            varying var vPositionFromCamera{X}: vec4f;
        #elif defined(SHADOWCUBE{X})
		#else
			varying var vPositionFromLight{X}: vec4f;
			varying var vDepthMetric{X}: f32;

			uniform lightMatrix{X}: mat4x4f;
		#endif
		uniform shadowsInfo{X}: vec4f;
		uniform depthValues{X}: vec2f;
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vLightDirection{X}: vec4f;
		uniform vLightFalloff{X}: vec4f;
	#elif defined(POINTLIGHT{X})
		uniform vLightFalloff{X}: vec4f;
	#elif defined(HEMILIGHT{X})
		uniform vLightGround{X}: vec3f;
	#endif
	#if defined(AREALIGHT{X})
		uniform vLightWidth{X}: vec4f;
		uniform vLightHeight{X}: vec4f;
	#endif
#endif