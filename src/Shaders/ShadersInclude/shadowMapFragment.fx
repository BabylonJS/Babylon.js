    float depthSM = vDepthMetricSM;

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    #if SM_USEDISTANCE == 1
        depthSM = clamp(((length(vPositionWSM - lightDataSM) + depthValuesSM.x) / (depthValuesSM.y)) + biasAndScaleSM.x, 0.0, 1.0);
    #else
        depthSM = clamp(((zSM + depthValuesSM.x) / (depthValuesSM.y)) + biasAndScaleSM.x, 0.0, 1.0);
    #endif
    gl_FragDepth = depthSM;
#elif SM_USEDISTANCE == 1
    depthSM = (length(vPositionWSM - lightDataSM) + depthValuesSM.x) / (depthValuesSM.y) + biasAndScaleSM.x;
#endif

#if SM_ESM == 1
    depthSM = clamp(exp(-min(87., biasAndScaleSM.z * depthSM)), 0., 1.);
#endif

#if SM_FLOAT == 1
    gl_FragColor = vec4(depthSM, 1.0, 1.0, 1.0);
#else
    gl_FragColor = pack(depthSM);
#endif

    return;