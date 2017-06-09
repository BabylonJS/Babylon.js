#ifdef SHADOWS
	#if !defined(SHADOWCUBE{X})
		vPositionFromLight{X} = lightMatrix{X} * worldPos;
	#endif
#endif