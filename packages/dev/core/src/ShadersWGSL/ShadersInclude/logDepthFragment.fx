#ifdef LOGARITHMICDEPTH
	fragmentOutputs.fragDepth = log2(fragmentInputs.vFragmentDepth) * uniforms.logarithmicDepthConstant * 0.5;
#endif