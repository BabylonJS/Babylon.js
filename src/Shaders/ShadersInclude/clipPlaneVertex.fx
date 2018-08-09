#ifdef CLIPPLANE
	fClipDistance = dot(worldPos, vClipPlane);
#endif

#ifdef CLIPPLANE2
	fClipDistance2 = dot(worldPos, vClipPlane2);
#endif

#ifdef CLIPPLANE3
	fClipDistance3 = dot(worldPos, vClipPlane3);
#endif

#ifdef CLIPPLANE4
	fClipDistance4 = dot(worldPos, vClipPlane4);
#endif