#ifdef LIGHT{X}
	uniform vLightData{X}: vec4f;
	uniform vLightDiffuse{X}: vec4f;

	#ifdef SPECULARTERM
		uniform vLightSpecular{X}: vec4f;
	#else
		vLightSpecular{X}: vec4f = vec4f(0.);
	#endif
	#ifdef SHADOW{X}
        #ifdef SHADOWCSM{X}
            uniform lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}]: mat4x4f;

            varying vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}]: vec4f;
            varying vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}]: f32;
            varying vPositionFromCamera{X}: vec4f;
        #elif defined(SHADOWCUBE{X})
		#else
			varying vPositionFromLight{X}: vec4f;
			varying vDepthMetric{X}: f32;

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
#endif