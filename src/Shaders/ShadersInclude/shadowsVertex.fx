#ifdef SHADOWS
	#if defined(SHADOWCSM{X})
		vPositionFromCamera{X} = view * worldPos;
		for (int i = 0; i < SHADOWCSMNUM_CASCADES{X}; i++) {
			vPositionFromLight{X}[i] = lightMatrix{X}[i] * worldPos;
			vDepthMetric{X}[i] = ((vPositionFromLight{X}[i].z + light{X}.depthValues.x) / (light{X}.depthValues.y));
		}
	#elif defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
		vPositionFromLight{X} = lightMatrix{X} * worldPos;
		vDepthMetric{X} = ((vPositionFromLight{X}.z + light{X}.depthValues.x) / (light{X}.depthValues.y));
	#endif
#endif