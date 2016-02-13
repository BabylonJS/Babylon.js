#ifdef LIGHT0
	uniform vec4 vLightData0;
	uniform vec4 vLightDiffuse0;
	#ifdef SPECULARTERM
		uniform vec3 vLightSpecular0;
	#endif
	#ifdef SHADOW0
		#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
			varying vec4 vPositionFromLight0;
			uniform sampler2D shadowSampler0;
		#else
			uniform samplerCube shadowSampler0;
		#endif
		uniform vec3 shadowsInfo0;
	#endif
	#ifdef SPOTLIGHT0
		uniform vec4 vLightDirection0;
	#endif
	#ifdef HEMILIGHT0
		uniform vec3 vLightGround0;
	#endif
#endif