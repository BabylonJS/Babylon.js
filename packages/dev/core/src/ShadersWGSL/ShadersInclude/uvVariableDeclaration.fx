#ifdef MAINUV{X}
	#if !defined(UV{X})
		var uv{X}: vec2f = vec2f(0., 0.);
	#elif defined(USE_VERTEX_PULLING)
		var uv{X}: vec2f = uv{X}Updated;
	#else
		var uv{X}: vec2f = vertexInputs.uv{X};
	#endif

	vertexOutputs.vMainUV{X} = uv{X};
#endif
