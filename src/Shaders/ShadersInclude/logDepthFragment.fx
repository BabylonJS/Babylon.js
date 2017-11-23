#ifdef LOGARITHMICDEPTH
	gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
#endif