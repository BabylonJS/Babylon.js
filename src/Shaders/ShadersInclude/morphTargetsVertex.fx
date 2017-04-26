#ifdef MORPHTARGETS
	positionUpdated += (position{X} - position) * morphTargetInfluences[{X}];
	
	#ifdef MORPHTARGETS_NORMAL
	normalUpdated += (normal{X} - normal) * morphTargetInfluences[{X}];
	#endif

	#ifdef MORPHTARGETS_TANGENT
	tangentTemp = tangentUpdated.xyz + ((tangent{X} - tangent.xyz) * morphTargetInfluences[{X}]);
	tangentUpdated = vec4(tangentTemp, tangentUpdated.w);
	#endif
#endif