// Normal inset Bias.
#if SM_NORMALBIAS == 1
    #if SM_DIRECTIONINLIGHTDATA == 1
        vec3 worldLightDirSM = normalize(-lightDataSM.xyz);
    #else
        vec3 directionToLightSM = lightDataSM.xyz - worldPos.xyz;
        vec3 worldLightDirSM = normalize(directionToLightSM);
    #endif

    float ndlSM = dot(vNormalW, worldLightDirSM);
    float sinNLSM = sqrt(1.0 - ndlSM * ndlSM);
    float normalBiasSM = biasAndScaleSM.y * sinNLSM;

    worldPos.xyz -= vNormalW * normalBiasSM;
#endif
