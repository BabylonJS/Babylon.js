#if SM_USEDISTANCE == 1
    vPositionWSM = worldPos.xyz;
#endif

#if SM_DEPTHTEXTURE == 1
    #ifdef IS_NDC_HALF_ZRANGE
        #define BIASFACTOR 0.5
    #else
        #define BIASFACTOR 1.0
    #endif

    // Depth texture Linear bias.
    #ifdef USE_REVERSE_DEPTHBUFFER
        gl_Position.z -= biasAndScaleSM.x * gl_Position.w * BIASFACTOR;
    #else
        gl_Position.z += biasAndScaleSM.x * gl_Position.w * BIASFACTOR;
    #endif
#endif

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    zSM = gl_Position.z;
    gl_Position.z = 0.0;
#elif SM_USEDISTANCE == 0
    // Color Texture Linear bias.
    #ifdef USE_REVERSE_DEPTHBUFFER
        vDepthMetricSM = (-gl_Position.z + depthValuesSM.x) / depthValuesSM.y + biasAndScaleSM.x;
    #else
        vDepthMetricSM = (gl_Position.z + depthValuesSM.x) / depthValuesSM.y + biasAndScaleSM.x;
    #endif
#endif
