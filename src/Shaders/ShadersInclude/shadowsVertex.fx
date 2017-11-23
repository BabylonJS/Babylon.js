#ifdef SHADOWS
	#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
		vPositionFromLight{X} = lightMatrix{X} * worldPos;
		vDepthMetric{X} =  ((vPositionFromLight{X}.z + light{X}.depthValues.x) / (light{X}.depthValues.y));
	#endif
#endif