#ifdef SHADOWS
	#if defined(SPOTLIGHT{X}) || defined(DIRLIGHT{X})
		vPositionFromLight{X} = lightMatrix{X} * worldPos;
	#endif
#endif