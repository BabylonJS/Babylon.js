#ifdef SHADOWS
	#if defined(SHADOWCSM{X})
		vPositionFromCamera{X} = view * worldPos;
		for (var i = 0; i < SHADOWCSMNUM_CASCADES{X}; i++) {
			vertexOutputs.vPositionFromLight{X}[i] = uniforms.lightMatrix{X}[i] * worldPos;
            #ifdef USE_REVERSE_DEPTHBUFFER
			    vertexOutputs.vDepthMetric{X}[i] = (-vertexOutputs.vPositionFromLight{X}[i].z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #else
			    vertexOutputs.vDepthMetric{X}[i] = (vertexOutputs.vPositionFromLight{X}[i].z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #endif
		}
	#elif defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
		vertexOutputs.vPositionFromLight{X} = uniforms.lightMatrix{X} * worldPos;
        #ifdef USE_REVERSE_DEPTHBUFFER
		    vertexOutputs.vDepthMetric{X} = (-vertexOutputs.vPositionFromLight{X}.z + light{X}.depthValues.x) / light{X}.depthValues.y;
        #else
		    vertexOutputs.vDepthMetric{X} = (vertexOutputs.vPositionFromLight{X}.z + light{X}.depthValues.x) / light{X}.depthValues.y;
        #endif
	#endif
#endif