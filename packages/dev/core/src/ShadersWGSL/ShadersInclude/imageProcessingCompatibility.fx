#ifdef IMAGEPROCESSINGPOSTPROCESS
	fragmentOutputs.color = vec4f(pow(fragmentOutputs.color.rgb,  vec3f(2.2)), fragmentOutputs.color.a);
#endif