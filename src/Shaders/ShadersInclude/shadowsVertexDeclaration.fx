#ifdef SHADOWS
	#if defined(SPOTLIGHT{X}) || defined(DIRLIGHT{X})
		uniform mat4 lightMatrix{X};
		varying vec4 vPositionFromLight{X};
	#endif
#endif