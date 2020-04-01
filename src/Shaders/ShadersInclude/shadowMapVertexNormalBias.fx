// Normal inset Bias.
#if SM_NORMALBIAS == 1
    mat3 normWorldSM = mat3(finalWorld);

    #ifdef NONUNIFORMSCALING
        normWorldSM = transposeMat3(inverseMat3(normWorldSM));
    #endif

    vec3 worldNorSM = normalize(normWorldSM * normal);

    #if SM_DIRECTIONINLIGHTDATA == 1
        vec3 worldLightDirSM = normalize(-lightDataSM.xyz);
    #else
        vec3 directionToLightSM = lightDataSM.xyz - worldPos.xyz;
        vec3 worldLightDirSM = normalize(directionToLightSM);
    #endif

    float ndlSM = dot(worldNorSM, worldLightDirSM);
    float sinNLSM = sqrt(1.0 - ndlSM * ndlSM);
    float normalBiasSM = biasAndScaleSM.y * sinNLSM;

    worldPos.xyz -= worldNorSM * normalBiasSM;
#endif
