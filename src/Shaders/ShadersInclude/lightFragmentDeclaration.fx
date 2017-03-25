#ifdef LIGHT{X}
	uniform vec4 vLightData{X};
	uniform vec4 vLightDiffuse{X};
	#ifdef SPECULARTERM
		uniform vec3 vLightSpecular{X};
	#endif
	#ifdef SHADOW{X}
		#if defined(SPOTLIGHT{X}) || defined(DIRLIGHT{X})
			varying vec4 vPositionFromLight{X};
			uniform sampler2D shadowSampler{X};
		#else
			uniform samplerCube shadowSampler{X};
		#endif
		uniform vec3 shadowsInfo{X};
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vec4 vLightDirection{X};
	#endif
	#ifdef HEMILIGHT{X}
		uniform vec3 vLightGround{X};
	#endif
#endif