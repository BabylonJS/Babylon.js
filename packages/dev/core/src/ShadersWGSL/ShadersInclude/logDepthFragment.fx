#ifdef LOGARITHMICDEPTH
	fragmentOutputs.fragDepth = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
#endif