#ifdef SHADOWS
	#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
		#if defined(SHADOWCSM{X})
        	vDepthInViewSpace{X} = (view * worldPos).z;
			for (int i = 0; i < numCascades{X}; i++) {
				vPositionFromLight{X}[i] = lightMatrix{X}[i] * worldPos;
				vDepthMetric{X}[i] = ((vPositionFromLight{X}[i].z + light{X}.depthValues.x) / (light{X}.depthValues.y));
			}
		#else
            vPositionFromLight{X} = lightMatrix{X} * worldPos;
            vDepthMetric{X} = ((vPositionFromLight{X}.z + light{X}.depthValues.x) / (light{X}.depthValues.y));
        #endif
	#endif
#endif