#ifdef MORPHTARGETS
	uniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];

	#ifdef MORPHTARGETS_TANGENT
	vec3 tangentTemp;
	#endif
#endif