#ifdef SHADOWS
	#if !defined(SHADOWCUBE{X})
		uniform mat4 lightMatrix{X};
		varying vec4 vPositionFromLight{X};
	#endif
#endif
