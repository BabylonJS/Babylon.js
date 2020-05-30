#ifdef HIGH_DEFINITION_PIPELINE
	gl_FragData[0] = gl_FragColor;
	gl_FragData[1] = gl_FragColor;
	gl_FragData[2] = gl_FragColor;
	gl_FragData[3] = gl_FragColor;
	gl_FragData[4] = vec4(gl_FragColor.rgb, 1.0);
#endif