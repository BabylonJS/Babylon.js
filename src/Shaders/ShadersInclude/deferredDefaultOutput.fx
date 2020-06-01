#ifdef HIGH_DEFINITION_PIPELINE
	// putting that in a loop won't compile
	gl_FragData[0] = gl_FragColor;
	gl_FragData[1] = gl_FragColor;
	gl_FragData[2] = gl_FragColor;
	gl_FragData[3] = gl_FragColor;
	gl_FragData[4] = gl_FragColor;
#endif