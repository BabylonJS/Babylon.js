#ifdef SHADOWS
	#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
		vPositionFromLight0 = lightMatrix0 * worldPos;
	#endif
	#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
		vPositionFromLight1 = lightMatrix1 * worldPos;
	#endif
	#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
		vPositionFromLight2 = lightMatrix2 * worldPos;
	#endif
	#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
		vPositionFromLight3 = lightMatrix3 * worldPos;
	#endif
#endif