#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE
		#if {X} == 0
		for (var i = 0; i < NUM_MORPH_INFLUENCERS; i = i + 1) {
			if (i >= uniforms.morphTargetCount) {
				break;
			}

			vertexID = f32(vertexInputs.vertexIndex) * uniforms.morphTargetTextureInfo.x;
			positionUpdated = positionUpdated + (readVector3FromRawSampler(i, vertexID) - vertexInputs.position) * uniforms.morphTargetInfluences[i];
			vertexID = vertexID + 1.0;
		
			#ifdef MORPHTARGETS_NORMAL
				normalUpdated = normalUpdated + (readVector3FromRawSampler(i, vertexID)  - vertexInputs.normal) * uniforms.morphTargetInfluences[i];
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_UV
				uvUpdated = uvUpdated + (readVector3FromRawSampler(i, vertexID).xy - vertexInputs.uv) * uniforms.morphTargetInfluences[i];
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_TANGENT
				tangentUpdated = vec4f(tangentUpdated.xyz + (readVector3FromRawSampler(i, vertexID)  - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[i], tangentUpdated.a);
			#endif
		}
		#endif
	#else
		positionUpdated = positionUpdated + (vertexInputs.position{X} - vertexInputs.position) * uniforms.morphTargetInfluences[{X}];
		
		#ifdef MORPHTARGETS_NORMAL
		    normalUpdated += (vertexInputs.normal{X} - vertexInputs.normal) * uniforms.morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_TANGENT
		    tangentUpdated = vec4f(tangentUpdated.xyz + (vertexInputs.tangent{X} - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[{X}], tangentUpdated.a);
		#endif

		#ifdef MORPHTARGETS_UV
		    uvUpdated = uvUpdated + (vertexInputs.uv_{X} - vertexInputs.uv) * uniforms.morphTargetInfluences[{X}];
		#endif
	#endif
#endif