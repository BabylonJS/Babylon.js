#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE
		#if {X} == 0
		for (var i = 0; i < $NUM_MORPH_INFLUENCERS$; i = i + 1) {
			if (i >= uniforms.morphTargetCount) {
				break;
			}

			vertexID = f32(vertexInputs.vertexIndex) * uniforms.morphTargetTextureInfo.x;
			positionUpdated = positionUpdated + (readVector3FromRawSampler({X}, vertexID) - vertexInputs.position) * uniforms.morphTargetInfluences[{X}];
			vertexID = vertexID + 1.0;
		
			#ifdef MORPHTARGETS_NORMAL
				normalUpdated = normalUpdated + (readVector3FromRawSampler({X}, vertexID)  - vertexInputs.normal) * uniforms.morphTargetInfluences[{X}];
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_UV
				uvUpdated = uvUpdated + (readVector3FromRawSampler({X}, vertexID).xy - vertexInputs.uv) * uniforms.morphTargetInfluences[{X}];
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_TANGENT
				tangentUpdated.xyz = tangentUpdated.xyz + (readVector3FromRawSampler({X}, vertexID)  - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[{X}];
			#endif
		}
		#endif
	#else
		positionUpdated = positionUpdated + (position{X} - vertexInputs.position) * uniforms.morphTargetInfluences[{X}];
		
		#ifdef MORPHTARGETS_NORMAL
		    normalUpdated += (normal{X} - vertexInputs.normal) * uniforms.morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_TANGENT
		    tangentUpdated.xyz = tangentUpdated.xyz + (tangent{X} - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_UV
		    uvUpdated = uvUpdated + (uv_{X} - vertexInputs.uv) * uniforms.morphTargetInfluences[{X}];
		#endif
	#endif
#endif