#ifdef MORPHTARGETS
	#ifdef MORPHTARGETS_TEXTURE
		float vertexID = float(gl_VertexID) * morphTargetTextureInfo.x;
	#endif
#endif