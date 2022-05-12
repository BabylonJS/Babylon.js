#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE	
		vertexID = f32(gl_VertexID) * uniforms.morphTargetTextureInfo.x;
		positionUpdated = positionUpdated + (readVector3FromRawSampler({X}, vertexID) - position) * uniforms.morphTargetInfluences[{X}];
		vertexID = vertexID + 1.0;
	
		#ifdef MORPHTARGETS_NORMAL
			normalUpdated = normalUpdated + (readVector3FromRawSampler({X}, vertexID)  - normal) * uniforms.morphTargetInfluences[{X}];
		    vertexID = vertexID + 1.0;
		#endif

		#ifdef MORPHTARGETS_UV
			uvUpdated = uvUpdated + (readVector3FromRawSampler({X}, vertexID).xy - uv) * uniforms.morphTargetInfluences[{X}];
		    vertexID = vertexID + 1.0;
		#endif

		#ifdef MORPHTARGETS_TANGENT
			tangentUpdated.xyz = tangentUpdated.xyz + (readVector3FromRawSampler({X}, vertexID)  - tangent.xyz) * uniforms.morphTargetInfluences[{X}];
		#endif
	#else
		positionUpdated = positionUpdated + (position{X} - position) * uniforms.morphTargetInfluences[{X}];
		
		#ifdef MORPHTARGETS_NORMAL
		    normalUpdated += (normal{X} - normal) * uniforms.morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_TANGENT
		    tangentUpdated.xyz = tangentUpdated.xyz + (tangent{X} - tangent.xyz) * uniforms.morphTargetInfluences[{X}];
		#endif

		#ifdef MORPHTARGETS_UV
		    uvUpdated = uvUpdated + (uv_{X} - uv) * uniforms.morphTargetInfluences[{X}];
		#endif
	#endif
#endif