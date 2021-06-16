    float depthSM = vDepthMetricSM;

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    #if SM_USEDISTANCE == 1
        depthSM = (length(vPositionWSM - lightDataSM) + depthValuesSM.x) / depthValuesSM.y + biasAndScaleSM.x;
    #else
        #if SM_USE_REVERSE_DEPTHBUFFER == 1
            depthSM = (-zSM + depthValuesSM.x) / depthValuesSM.y + biasAndScaleSM.x;
        #else
            depthSM = (zSM + depthValuesSM.x) / depthValuesSM.y + biasAndScaleSM.x;
        #endif
    #endif
    #if SM_USE_REVERSE_DEPTHBUFFER == 1
        gl_FragDepth = clamp(1.0 - depthSM, 0.0, 1.0);
    #else
        gl_FragDepth = clamp(depthSM, 0.0, 1.0); // using depthSM (linear value) for gl_FragDepth is ok because we are using depth clamping only for ortho projections
    #endif
#elif SM_USEDISTANCE == 1
    depthSM = (length(vPositionWSM - lightDataSM) + depthValuesSM.x) / depthValuesSM.y + biasAndScaleSM.x;
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