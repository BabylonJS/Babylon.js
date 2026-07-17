#ifdef DEPTHPREPASS
#if !defined(PREPASS) && !defined(ORDER_INDEPENDENT_TRANSPARENCY)
	fragmentOutputs.color =  vec4f(0., 0., 0., 1.0);
#endif
#ifndef DEPTHPREPASS_SKIP_EARLY_RETURN
	return fragmentOutputs;
#endif
#endif
