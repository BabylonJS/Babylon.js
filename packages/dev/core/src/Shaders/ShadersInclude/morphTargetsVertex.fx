#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE
		#if {X} == 0
		for (int i = 0; i < NUM_MORPH_INFLUENCERS; i++) {
			if (float(i) >= morphTargetCount) break;

			vertexID = float(gl_VertexID) * morphTargetTextureInfo.x;

			#ifdef MORPHTARGETS_POSITION
				positionUpdated += (readVector3FromRawSampler(i, vertexID) - position) * morphTargetInfluences[i];
			#endif
			#ifdef MORPHTARGETTEXTURE_HASPOSITIONS
				vertexID += 1.0;
			#endif
		
			#ifdef MORPHTARGETS_NORMAL
				normalUpdated += (readVector3FromRawSampler(i, vertexID)  - normal) * morphTargetInfluences[i];
			#endif
			#ifdef MORPHTARGETTEXTURE_HASNORMALS
				vertexID += 1.0;
			#endif

			#ifdef MORPHTARGETS_UV
				uvUpdated += (readVector3FromRawSampler(i, vertexID).xy - uv) * morphTargetInfluences[i];
			#endif
			#ifdef MORPHTARGETTEXTURE_HASUVS
				vertexID += 1.0;
			#endif

			#ifdef MORPHTARGETS_TANGENT
				tangentUpdated.xyz += (readVector3FromRawSampler(i, vertexID)  - tangent.xyz) * morphTargetInfluences[i];
			#endif
			#ifdef MORPHTARGETTEXTURE_HASTANGENTS
				vertexID += 1.0;
			#endif

			#ifdef MORPHTARGETS_UV2
				uv2Updated += (readVector3FromRawSampler(i, vertexID).xy - uv2) * morphTargetInfluences[i];
			#endif
			#ifdef MORPHTARGETTEXTURE_HASUV2S
				vertexID += 1.0;
			#endif

			#ifdef MORPHTARGETS_COLOR
				colorUpdated += (readVector4FromRawSampler(i, vertexID) - color) * morphTargetInfluences[i];
			#endif
		}
		#endif
	#else
		#ifdef MORPHTARGETS_POSITION
		positionUpdated += (position{X} - position) * morphTargetInfluences[{X}];
		#endif
		
		#ifdef MORPHTARGETS_NORMAL
		normalUpdated += (normal{X} - normal) * morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_TANGENT
		tangentUpdated.xyz += (tangent{X} - tangent.xyz) * morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_UV
		uvUpdated += (uv_{X} - uv) * morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_UV2
		uv2Updated += (uv2_{X} - uv2) * morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_COLOR
		colorUpdated += (color{X} - color) * morphTargetInfluences[{X}];
		#endif
	#endif
#endif