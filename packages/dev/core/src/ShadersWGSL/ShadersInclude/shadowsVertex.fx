#ifdef SHADOWS
	#if defined(SHADOWCSM{X})
		vertexOutputs.vPositionFromCamera{X} = scene.view * worldPos;
		#if SHADOWCSMNUM_CASCADES{X} > 0
			vertexOutputs.vPositionFromLight{X}_0 = uniforms.lightMatrix{X}[0] * worldPos;
            #ifdef USE_REVERSE_DEPTHBUFFER
			    vertexOutputs.vDepthMetric{X}_0 = (-vertexOutputs.vPositionFromLight{X}_0.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #else
			    vertexOutputs.vDepthMetric{X}_0= (vertexOutputs.vPositionFromLight{X}_0.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #endif
		#endif
		#if SHADOWCSMNUM_CASCADES{X} > 1
			vertexOutputs.vPositionFromLight{X}_1 = uniforms.lightMatrix{X}[1] * worldPos;
            #ifdef USE_REVERSE_DEPTHBUFFER
			    vertexOutputs.vDepthMetric{X}_1 = (-vertexOutputs.vPositionFromLight{X}_1.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #else
			    vertexOutputs.vDepthMetric{X}_1= (vertexOutputs.vPositionFromLight{X}_1.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #endif
		#endif		
		#if SHADOWCSMNUM_CASCADES{X} > 2
			vertexOutputs.vPositionFromLight{X}_2 = uniforms.lightMatrix{X}[2] * worldPos;
            #ifdef USE_REVERSE_DEPTHBUFFER
			    vertexOutputs.vDepthMetric{X}_2 = (-vertexOutputs.vPositionFromLight{X}_2.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #else
			    vertexOutputs.vDepthMetric{X}_2= (vertexOutputs.vPositionFromLight{X}_2.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #endif
		#endif		
		#if SHADOWCSMNUM_CASCADES{X} > 3
			vertexOutputs.vPositionFromLight{X}_3 = uniforms.lightMatrix{X}[3] * worldPos;
            #ifdef USE_REVERSE_DEPTHBUFFER
			    vertexOutputs.vDepthMetric{X}_3 = (-vertexOutputs.vPositionFromLight{X}_3.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #else
			    vertexOutputs.vDepthMetric{X}_3= (vertexOutputs.vPositionFromLight{X}_3.z + light{X}.depthValues.x) / light{X}.depthValues.y;
            #endif
		#endif	
	#elif defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
		vertexOutputs.vPositionFromLight{X} = uniforms.lightMatrix{X} * worldPos;
        #ifdef USE_REVERSE_DEPTHBUFFER
		    vertexOutputs.vDepthMetric{X} = (-vertexOutputs.vPositionFromLight{X}.z + light{X}.depthValues.x) / light{X}.depthValues.y;
        #else
		    vertexOutputs.vDepthMetric{X} = (vertexOutputs.vPositionFromLight{X}.z + light{X}.depthValues.x) / light{X}.depthValues.y;
        #endif
	#endif
#endif