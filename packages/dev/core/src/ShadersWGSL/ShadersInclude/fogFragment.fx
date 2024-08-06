#ifdef FOG
	var fog: f32 = CalcFogFactor();
	#ifdef PBR
		fog = toLinearSpace(fog);
	#endif
	color= vec4f(mix(uniforms.vFogColor, color.rgb, fog), color.a);
#endif