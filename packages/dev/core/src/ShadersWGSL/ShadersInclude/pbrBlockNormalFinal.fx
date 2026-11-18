#if defined(FORCENORMALFORWARD) && defined(NORMAL)
    var faceNormal: vec3f = normalize(cross(dpdx(fragmentInputs.vPositionW), dpdy(fragmentInputs.vPositionW))) * scene.vEyePosition.w;
    #if defined(TWOSIDEDLIGHTING)
        faceNormal = select(-faceNormal, faceNormal, fragmentInputs.frontFacing);
    #endif

    #ifdef BENTNORMAL
        bentNormalW *= sign(dot(normalW, faceNormal));
    #endif
    normalW *= sign(dot(normalW, faceNormal));
#endif

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    #if defined(MIRRORED)
        normalW = select(normalW, -normalW, fragmentInputs.frontFacing);
        #ifdef BENTNORMAL
            bentNormalW = select(bentNormalW, -bentNormalW, fragmentInputs.frontFacing);
        #endif
    #else
        normalW = select(-normalW, normalW, fragmentInputs.frontFacing);
        #ifdef BENTNORMAL
            bentNormalW = select(-bentNormalW, bentNormalW, fragmentInputs.frontFacing);
        #endif
    #endif
#endif
