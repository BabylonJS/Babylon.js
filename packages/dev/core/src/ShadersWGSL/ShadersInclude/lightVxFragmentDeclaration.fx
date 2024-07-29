#ifdef LIGHT{X}
	uniform vLightData: vec4f{X};
	uniform vLightDiffuse: vec4f{X};

	#ifdef SPECULARTERM
		uniform vLightSpecular: vec4f{X};
	#else
		var vLightSpecular: vec4f{X} =  vec4f(0.);
	#endif
	#ifdef SHADOW{X}
        #ifdef SHADOWCSM{X}
            uniform lightMatrix: mat4x4f{X}[SHADOWCSMNUM_CASCADES{X}];

            varying var vPositionFromLight: vec4f{X}[SHADOWCSMNUM_CASCADES{X}];
            varying var vDepthMetric: f32{X}[SHADOWCSMNUM_CASCADES{X}];
            varying var vPositionFromCamera: vec4f{X};
        #elif defined(SHADOWCUBE{X})
		#else
			varying var vPositionFromLight: vec4f{X};
			varying var vDepthMetric: f32{X};

			uniform lightMatrix: mat4x4f{X};
		#endif
		uniform shadowsInfo: vec4f{X};
		uniform depthValues: vec2f{X};
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vLightDirection: vec4f{X};
		uniform vLightFalloff: vec4f{X};
	#elif defined(POINTLIGHT{X})
		uniform vLightFalloff: vec4f{X};
	#elif defined(HEMILIGHT{X})
		uniform vLightGround: vec3f{X};
	#endif
#endif