#ifdef HIGH_DEFINITION_PIPELINE
	// putting that in a loop won't compile
	gl_FragData[0] = gl_FragColor;
	gl_FragData[1] = vec4(0.0, 0.0, 0.0, 0.0);
	gl_FragData[2] = vec4(0.0, 0.0, 0.0, 0.0);
	gl_FragData[3] = vec4(0.0, 0.0, 0.0, 0.0);
#endif