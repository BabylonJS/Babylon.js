#if SM_USEDISTANCE == 1
    vertexOutputs.vPositionWSM = worldPos.xyz;
#endif

#if SM_DEPTHTEXTURE == 1
    #ifdef IS_NDC_HALF_ZRANGE
        #define BIASFACTOR 0.5
    #else
        #define BIASFACTOR 1.0
    #endif

    // Depth texture Linear bias.
    #ifdef USE_REVERSE_DEPTHBUFFER
        vertexOutputs.position.z -= uniforms.biasAndScaleSM.x * vertexOutputs.position.w * BIASFACTOR;
    #else
        vertexOutputs.position.z += uniforms.biasAndScaleSM.x * vertexOutputs.position.w * BIASFACTOR;
    #endif
#endif

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    vertexOutputs.zSM = vertexOutputs.position.z;
    vertexOutputs.position.z = 0.0;
#elif SM_USEDISTANCE == 0
    // Color Texture Linear bias.
    #ifdef USE_REVERSE_DEPTHBUFFER
        vertexOutputs.vDepthMetricSM = (-vertexOutputs.position.z + uniforms.depthValuesSM.x) / uniforms.depthValuesSM.y + uniforms.biasAndScaleSM.x;
    #else
        vertexOutputs.vDepthMetricSM = (vertexOutputs.position.z + uniforms.depthValuesSM.x) / uniforms.depthValuesSM.y + uniforms.biasAndScaleSM.x;
    #endif
#endif
