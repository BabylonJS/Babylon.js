#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE
		#if {X} == 0
		for (var i = 0; i < NUM_MORPH_INFLUENCERS; i = i + 1) {
			if (i >= uniforms.morphTargetCount) {
				break;
			}

			vertexID = f32(vertexInputs.vertexIndex) * uniforms.morphTargetTextureInfo.x;

			#ifdef MORPHTARGETS_POSITION
				positionUpdated = positionUpdated + (readVector3FromRawSampler(i, vertexID) - vertexInputs.position) * uniforms.morphTargetInfluences[i];
			#endif
			#if defined(MORPHTARGETS_SUPPORTPOSITIONS) || defined(MORPHTARGETS_POSITION)
				vertexID = vertexID + 1.0;
			#endif
		
			#ifdef MORPHTARGETS_NORMAL
				normalUpdated = normalUpdated + (readVector3FromRawSampler(i, vertexID)  - vertexInputs.normal) * uniforms.morphTargetInfluences[i];
			#endif
			#if defined(MORPHTARGETS_SUPPORTNORMALS) || defined(MORPHTARGETS_NORMAL)
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_UV
				uvUpdated = uvUpdated + (readVector3FromRawSampler(i, vertexID).xy - vertexInputs.uv) * uniforms.morphTargetInfluences[i];
			#endif
			#if defined(MORPHTARGETS_SUPPORTUVS) || defined(MORPHTARGETS_UV)
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_TANGENT
				tangentUpdated = vec4f(tangentUpdated.xyz + (readVector3FromRawSampler(i, vertexID)  - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[i], tangentUpdated.a);
			#endif
			#if defined(MORPHTARGETS_SUPPORTTANGENTS) || defined(MORPHTARGETS_TANGENT)
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_UV2
				uv2Updated = uv2Updated + (readVector3FromRawSampler(i, vertexID).xy - vertexInputs.uv2) * uniforms.morphTargetInfluences[i];
			#endif
		}
		#endif
	#else
		#ifdef MORPHTARGETS_POSITION
			positionUpdated = positionUpdated + (vertexInputs.position{X} - vertexInputs.position) * uniforms.morphTargetInfluences[{X}];
		#endif
		
		#ifdef MORPHTARGETS_NORMAL
		    normalUpdated += (vertexInputs.normal{X} - vertexInputs.normal) * uniforms.morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_TANGENT
		    tangentUpdated = vec4f(tangentUpdated.xyz + (vertexInputs.tangent{X} - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[{X}], tangentUpdated.a);
		#endif

		#ifdef MORPHTARGETS_UV
		    uvUpdated = uvUpdated + (vertexInputs.uv_{X} - vertexInputs.uv) * uniforms.morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_UV2
		    uv2Updated = uv2Updated + (vertexInputs.uv2_{X} - vertexInputs.uv2) * uniforms.morphTargetInfluences[{X}];
		#endif
	#endif
#endif