#ifdef LIGHT2
	uniform vec4 vLightData2;
	uniform vec4 vLightDiffuse2;
	#ifdef SPECULARTERM
		uniform vec3 vLightSpecular2;
	#endif
	#ifdef SHADOW2
		#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
			varying vec4 vPositionFromLight2;
			uniform sampler2D shadowSampler2;
		#else
			uniform samplerCube shadowSampler2;
		#endif
		uniform vec3 shadowsInfo2;
	#endif
	#ifdef SPOTLIGHT2
		uniform vec4 vLightDirection2;
	#endif
	#ifdef HEMILIGHT2
		uniform vec3 vLightGround2;
	#endif
#endif