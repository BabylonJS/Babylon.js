// Normal inset Bias.
#if SM_NORMALBIAS == 1
    #if SM_DIRECTIONINLIGHTDATA == 1
        var worldLightDirSM: vec3f = normalize(-uniforms.lightDataSM.xyz);
    #else
        var directionToLightSM: vec3f = uniforms.lightDataSM.xyz - worldPos.xyz;
        var worldLightDirSM: vec3f = normalize(directionToLightSM);
    #endif

    var ndlSM: f32 = dot(vNormalW, worldLightDirSM);
    var sinNLSM: f32 = sqrt(1.0 - ndlSM * ndlSM);
    var normalBiasSM: f32 = uniforms.biasAndScaleSM.y * sinNLSM;

    worldPos = vec4f(worldPos.xyz - vNormalW * normalBiasSM, worldPos.w);
#endif
