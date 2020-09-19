#if SM_USEDISTANCE == 1
    vPositionWSM = worldPos.xyz;
#endif

#if SM_DEPTHTEXTURE == 1
    // Depth texture Linear bias.
    gl_Position.z += biasAndScaleSM.x * gl_Position.w;
#endif

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    zSM = gl_Position.z;
    gl_Position.z = 0.0;
#elif SM_USEDISTANCE == 0
    // Color Texture Linear bias.
    vDepthMetricSM = ((gl_Position.z + depthValuesSM.x) / (depthValuesSM.y)) + biasAndScaleSM.x;
#endif
