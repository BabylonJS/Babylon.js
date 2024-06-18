#ifdef LOGARITHMICDEPTH
	vFragmentDepth = 1.0 + vertexOutputs.position.w;
	vertexOutputs.position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
#endif