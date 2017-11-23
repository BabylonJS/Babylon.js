#ifdef LIGHT{X}
	uniform vec4 vLightData{X};
	uniform vec4 vLightDiffuse{X};
	#ifdef SPECULARTERM
		uniform vec3 vLightSpecular{X};
	#else
		vec3 vLightSpecular{X} = vec3(0.);
	#endif
	#ifdef SHADOW{X}
		#if defined(SHADOWCUBE{X})
			uniform samplerCube shadowSampler{X};
		#else
			varying vec4 vPositionFromLight{X};
			varying float vDepthMetric{X};

			uniform sampler2D shadowSampler{X};
			uniform mat4 lightMatrix{X};
		#endif
		uniform vec4 shadowsInfo{X};
		uniform vec2 depthValues{X};
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vec4 vLightDirection{X};
	#endif
	#ifdef HEMILIGHT{X}
		uniform vec3 vLightGround{X};
	#endif
#endif