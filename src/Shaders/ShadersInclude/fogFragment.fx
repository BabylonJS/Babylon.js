#ifdef FOG
	float fog = CalcFogFactor();
	#ifdef PBR
		fog = toLinearSpace(fog);
	#endif
	color.rgb = mix(vFogColor, color.rgb, fog);
#endif