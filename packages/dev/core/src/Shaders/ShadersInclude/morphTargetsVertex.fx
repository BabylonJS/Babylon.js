#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE
		#if {X} == 0
		for (int i = 0; i < NUM_MORPH_INFLUENCERS; i++) {
			if (i >= morphTargetCount) break;

			vertexID = float(gl_VertexID) * morphTargetTextureInfo.x;
			positionUpdated += (readVector3FromRawSampler(i, vertexID) - position) * morphTargetInfluences[i];
			vertexID += 1.0;
		
			#ifdef MORPHTARGETS_NORMAL
				normalUpdated += (readVector3FromRawSampler(i, vertexID)  - normal) * morphTargetInfluences[i];
				vertexID += 1.0;
			#endif

			#ifdef MORPHTARGETS_UV
				uvUpdated += (readVector3FromRawSampler(i, vertexID).xy - uv) * morphTargetInfluences[i];
				vertexID += 1.0;
			#endif

			#ifdef MORPHTARGETS_TANGENT
				tangentUpdated.xyz += (readVector3FromRawSampler(i, vertexID)  - tangent.xyz) * morphTargetInfluences[i];
			#endif
		}
		#endif
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