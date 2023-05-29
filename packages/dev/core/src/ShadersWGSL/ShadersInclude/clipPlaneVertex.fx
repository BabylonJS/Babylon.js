#ifdef CLIPPLANE
	vertexOutputs.fClipDistance = dot(worldPos, uniforms.vClipPlane);
#endif

#ifdef CLIPPLANE2
	vertexOutputs.fClipDistance2 = dot(worldPos, uniforms.vClipPlane2);
#endif

#ifdef CLIPPLANE3
	vertexOutputs.fClipDistance3 = dot(worldPos, uniforms.vClipPlane3);
#endif

#ifdef CLIPPLANE4
	vertexOutputs.fClipDistance4 = dot(worldPos, uniforms.vClipPlane4);
#endif

#ifdef CLIPPLANE5
	vertexOutputs.fClipDistance5 = dot(worldPos, uniforms.vClipPlane5);
#endif

#ifdef CLIPPLANE6
	vertexOutputs.fClipDistance6 = dot(worldPos, uniforms.vClipPlane6);
#endif