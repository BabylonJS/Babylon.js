#ifdef DEPTHPREPASS
#if !defined(PREPASS) && !defined(ORDER_INDEPENDENT_TRANSPARENCY)
	fragmentOutputs.color =  vec4f(0., 0., 0., 1.0);
#endif
	return fragmentOutputs;
#endif
