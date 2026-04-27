#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE
		#if {X} == 0
		for (var i = 0; i < NUM_MORPH_INFLUENCERS; i = i + 1) {
			if (f32(i) >= uniforms.morphTargetCount) {
				break;
			}

			#ifdef USE_VERTEX_PULLING
			vertexID = f32(vpVertexIndex) * uniforms.morphTargetTextureInfo.x;
			#else
			vertexID = f32(vertexInputs.vertexIndex) * uniforms.morphTargetTextureInfo.x;
			#endif

			#ifdef MORPHTARGETS_POSITION
				#ifdef USE_VERTEX_PULLING
				positionUpdated = positionUpdated + (readVector3FromRawSampler(i, vertexID) - vp_basePosition) * uniforms.morphTargetInfluences[i];
				#else
				positionUpdated = positionUpdated + (readVector3FromRawSampler(i, vertexID) - vertexInputs.position) * uniforms.morphTargetInfluences[i];
				#endif
			#endif
			#ifdef MORPHTARGETTEXTURE_HASPOSITIONS
				vertexID = vertexID + 1.0;
			#endif
		
			#ifdef MORPHTARGETS_NORMAL
				#ifdef USE_VERTEX_PULLING
				normalUpdated = normalUpdated + (readVector3FromRawSampler(i, vertexID)  - vp_baseNormal) * uniforms.morphTargetInfluences[i];
				#else
				normalUpdated = normalUpdated + (readVector3FromRawSampler(i, vertexID)  - vertexInputs.normal) * uniforms.morphTargetInfluences[i];
				#endif
			#endif
			#ifdef MORPHTARGETTEXTURE_HASNORMALS
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_UV
				#ifdef USE_VERTEX_PULLING
				uvUpdated = uvUpdated + (readVector3FromRawSampler(i, vertexID).xy - vp_baseUV) * uniforms.morphTargetInfluences[i];
				#else
				uvUpdated = uvUpdated + (readVector3FromRawSampler(i, vertexID).xy - vertexInputs.uv) * uniforms.morphTargetInfluences[i];
				#endif
			#endif
			#ifdef MORPHTARGETTEXTURE_HASUVS
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_TANGENT
				#ifdef USE_VERTEX_PULLING
				tangentUpdated = vec4f(tangentUpdated.xyz + (readVector3FromRawSampler(i, vertexID)  - vp_baseTangent.xyz) * uniforms.morphTargetInfluences[i], tangentUpdated.a);
				#else
				tangentUpdated = vec4f(tangentUpdated.xyz + (readVector3FromRawSampler(i, vertexID)  - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[i], tangentUpdated.a);
				#endif
			#endif
			#ifdef MORPHTARGETTEXTURE_HASTANGENTS
				vertexID = vertexID + 1.0;
			#endif

			#ifdef MORPHTARGETS_UV2
				#ifdef USE_VERTEX_PULLING
				uv2Updated = uv2Updated + (readVector3FromRawSampler(i, vertexID).xy - vp_baseUV2) * uniforms.morphTargetInfluences[i];
				#else
				uv2Updated = uv2Updated + (readVector3FromRawSampler(i, vertexID).xy - vertexInputs.uv2) * uniforms.morphTargetInfluences[i];
				#endif
			#endif

			#ifdef MORPHTARGETS_COLOR
				#ifdef USE_VERTEX_PULLING
				colorUpdated = colorUpdated + (readVector4FromRawSampler(i, vertexID) - vp_baseColor) * uniforms.morphTargetInfluences[i];
				#else
				colorUpdated = colorUpdated + (readVector4FromRawSampler(i, vertexID) - vertexInputs.color) * uniforms.morphTargetInfluences[i];
				#endif
			#endif
		}
		#endif
	#else
		#ifdef MORPHTARGETS_POSITION
			#ifdef USE_VERTEX_PULLING
			positionUpdated = positionUpdated + (vertexInputs.position{X} - vp_basePosition) * uniforms.morphTargetInfluences[{X}];
			#else
			positionUpdated = positionUpdated + (vertexInputs.position{X} - vertexInputs.position) * uniforms.morphTargetInfluences[{X}];
			#endif
		#endif
		
		#ifdef MORPHTARGETS_NORMAL
			#ifdef USE_VERTEX_PULLING
		    normalUpdated = normalUpdated + (vertexInputs.normal{X} - vp_baseNormal) * uniforms.morphTargetInfluences[{X}];
			#else
		    normalUpdated = normalUpdated + (vertexInputs.normal{X} - vertexInputs.normal) * uniforms.morphTargetInfluences[{X}];
			#endif
		#endif

		#ifdef MORPHTARGETS_TANGENT
			#ifdef USE_VERTEX_PULLING
		    tangentUpdated = vec4f(tangentUpdated.xyz + (vertexInputs.tangent{X} - vp_baseTangent.xyz) * uniforms.morphTargetInfluences[{X}], tangentUpdated.a);
			#else
		    tangentUpdated = vec4f(tangentUpdated.xyz + (vertexInputs.tangent{X} - vertexInputs.tangent.xyz) * uniforms.morphTargetInfluences[{X}], tangentUpdated.a);
			#endif
		#endif

		#ifdef MORPHTARGETS_UV
			#ifdef USE_VERTEX_PULLING
		    uvUpdated = uvUpdated + (vertexInputs.uv_{X} - vp_baseUV) * uniforms.morphTargetInfluences[{X}];
			#else
		    uvUpdated = uvUpdated + (vertexInputs.uv_{X} - vertexInputs.uv) * uniforms.morphTargetInfluences[{X}];
			#endif
		#endif

		#ifdef MORPHTARGETS_UV2
			#ifdef USE_VERTEX_PULLING
		    uv2Updated = uv2Updated + (vertexInputs.uv2_{X} - vp_baseUV2) * uniforms.morphTargetInfluences[{X}];
			#else
		    uv2Updated = uv2Updated + (vertexInputs.uv2_{X} - vertexInputs.uv2) * uniforms.morphTargetInfluences[{X}];
			#endif
		#endif

		#ifdef MORPHTARGETS_COLOR
			#ifdef USE_VERTEX_PULLING
		    colorUpdated = colorUpdated + (vertexInputs.color{X} - vp_baseColor) * uniforms.morphTargetInfluences[{X}];
			#else
		    colorUpdated = colorUpdated + (vertexInputs.color{X} - vertexInputs.color) * uniforms.morphTargetInfluences[{X}];
			#endif
		#endif
	#endif
#endif