#ifdef LIGHT3
	uniform vec4 vLightData3;
	uniform vec4 vLightDiffuse3;
	#ifdef SPECULARTERM
		uniform vec3 vLightSpecular3;
	#endif
	#ifdef SHADOW3
		#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
			varying vec4 vPositionFromLight3;
			uniform sampler2D shadowSampler3;
		#else
			uniform samplerCube shadowSampler3;
		#endif
		uniform vec3 shadowsInfo3;
	#endif
	#ifdef SPOTLIGHT3
		uniform vec4 vLightDirection3;
	#endif
	#ifdef HEMILIGHT3
		uniform vec3 vLightGround3;
	#endif
#endif