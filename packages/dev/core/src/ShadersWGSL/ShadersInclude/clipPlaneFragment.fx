#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
    // needed to make it work in WebGPU when several clip planes are defined: a single code path should lead to a "discard" instruction
    // so we need to use a "else if" construct for each plane
    if (false) {}
#endif

#ifdef CLIPPLANE
	else if (fragmentInputs.fClipDistance > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE2
	else if (fragmentInputs.fClipDistance2 > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE3
	else if (fragmentInputs.fClipDistance3 > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE4
	else if (fragmentInputs.fClipDistance4 > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE5
	else if (fragmentInputs.fClipDistance5 > 0.0)
	{
		discard;
	}
#endif

#ifdef CLIPPLANE6
	else if (fragmentInputs.fClipDistance6 > 0.0)
	{
		discard;
	}
#endif