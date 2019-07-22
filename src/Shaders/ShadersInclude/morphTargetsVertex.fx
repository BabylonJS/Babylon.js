#ifdef MORPHTARGETS
	positionUpdated += (position{X} - position) * morphTargetInfluences[{X}];
	
	#ifdef MORPHTARGETS_NORMAL
	normalUpdated += (normal{X} - normal) * morphTargetInfluences[{X}];
	#endif

	#ifdef MORPHTARGETS_TANGENT
	tangentUpdated.xyz += (tangent{X} - tangent.xyz) * morphTargetInfluences[{X}];
	#endif

    #ifdef MORPHTARGETS_UV
	uvUpdated += (uv_{X} - uv) * morphTargetInfluences[{X}];
	#endif
#endif