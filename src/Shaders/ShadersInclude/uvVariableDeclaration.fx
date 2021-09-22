#if !defined(UV{X}) && defined(MAINUV{X})
	vec2 uv{X} = vec2(0., 0.);
#endif
#ifdef MAINUV{X}
	vMainUV{X} = uv{X};
#endif
