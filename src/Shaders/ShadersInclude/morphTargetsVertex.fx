#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE	
		positionUpdated += (readVector3FromRawSampler(morphTargets[{X}], vertexID) - position) * morphTargetInfluences[{X}];
		vertexID += 1.0;
	
		#ifdef MORPHTARGETS_NORMAL
			normalUpdated += (readVector3FromRawSampler(morphTargets[{X}], vertexID)  - normal) * morphTargetInfluences[{X}];
			vertexID += 1.0;
		#endif

		#ifdef MORPHTARGETS_UV
			uvUpdated += (readVector3FromRawSampler(morphTargets[{X}], vertexID).xy - uv) * morphTargetInfluences[{X}];
			vertexID += 1.0;
		#endif

		#ifdef MORPHTARGETS_TANGENT
			tangentUpdated.xyz += (readVector3FromRawSampler(morphTargets[{X}], vertexID)  - tangent.xyz) * morphTargetInfluences[{X}];
		#endif

		// Restore for next target
		vertexID = float(gl_VertexID) * morphTargetTextureInfo.x;
	#else
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
#endif