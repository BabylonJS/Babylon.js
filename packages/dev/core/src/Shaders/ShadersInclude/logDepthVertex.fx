#ifdef LOGARITHMICDEPTH
	vFragmentDepth = 1.0 + gl_Position.w;
	gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
#endif