#ifdef LIGHT1
	uniform vec4 vLightData1;
	uniform vec4 vLightDiffuse1;
	#ifdef SPECULARTERM
		uniform vec3 vLightSpecular1;
	#endif
	#ifdef SHADOW1
		#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
			varying vec4 vPositionFromLight1;
			uniform sampler2D shadowSampler1;
		#else
			uniform samplerCube shadowSampler1;
		#endif
		uniform vec3 shadowsInfo1;
	#endif
	#ifdef SPOTLIGHT1
		uniform vec4 vLightDirection1;
	#endif
	#ifdef HEMILIGHT1
		uniform vec3 vLightGround1;
	#endif
#endif