#ifdef FOG
	var fog: f32 = CalcFogFactor();
	#ifdef PBR
		fog = toLinearSpace(fog);
	#endif
	color.rgb = mix(vFogColor, color.rgb, fog);
#endif