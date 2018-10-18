#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE2
	if (fClipDistance2 > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE3
	if (fClipDistance3 > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE4
	if (fClipDistance4 > 0.0)
	{
		discard;
	}
#endif