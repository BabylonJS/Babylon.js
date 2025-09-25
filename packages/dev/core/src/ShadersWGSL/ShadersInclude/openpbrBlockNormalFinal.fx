#if defined(FORCENORMALFORWARD) && defined(NORMAL)
    var faceNormal: vec3f = normalize(cross(dpdx(fragmentInputs.vPositionW), dpdy(fragmentInputs.vPositionW))) * scene.vEyePosition.w;
    #if defined(TWOSIDEDLIGHTING)
        faceNormal = select(-faceNormal, faceNormal, fragmentInputs.frontFacing);
    #endif

    normalW *= sign(dot(normalW, faceNormal));
    coatNormalW *= sign(dot(coatNormalW, faceNormal));
#endif

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    #if defined(MIRRORED)
        normalW = select(normalW, -normalW, fragmentInputs.frontFacing);
        coatNormalW = select(coatNormalW, -coatNormalW, fragmentInputs.frontFacing);
    #else
        normalW = select(-normalW, normalW, fragmentInputs.frontFacing);
        coatNormalW = select(-coatNormalW, coatNormalW, fragmentInputs.frontFacing);
    #endif
#endif
