#ifdef SHADOWS
	#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
		uniform mat4 lightMatrix0;
		varying vec4 vPositionFromLight0;
	#endif
	#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
		uniform mat4 lightMatrix1;
		varying vec4 vPositionFromLight1;
	#endif
	#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
		uniform mat4 lightMatrix2;
		varying vec4 vPositionFromLight2;
	#endif
	#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
		uniform mat4 lightMatrix3;
		varying vec4 vPositionFromLight3;
	#endif
#endif