#ifdef SHADOWS
	#if defined(SHADOWCSM{X})
		vPositionFromCameraCSM{X} = camViewMatCSM{X} * worldPos;
		for (int i = 0; i < SHADOWCSMNUM_CASCADES{X}; i++) {
			vPositionFromLightCSM{X}[i] = lightMatrixCSM{X}[i] * worldPos;
			vDepthMetricCSM{X}[i] = ((vPositionFromLightCSM{X}[i].z + light{X}.depthValues.x) / (light{X}.depthValues.y));
		}
	#elif defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
		vPositionFromLight{X} = lightMatrix{X} * worldPos;
		vDepthMetric{X} = ((vPositionFromLight{X}.z + light{X}.depthValues.x) / (light{X}.depthValues.y));
	#endif
#endif