#if defined(FORCENORMALFORWARD) && defined(NORMAL)
    var faceNormal: vec3f = normalize(cross(dpdx(vPositionW), dpdy(vPositionW))) * vEyePosition.w;
    #if defined(TWOSIDEDLIGHTING)
        faceNormal = select(-faceNormal, faceNormal, fragmentInputs.frontFacing);
    #endif

    normalW *= sign(dot(normalW, faceNormal));
#endif

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    normalW = select(-normalW, normalW, fragmentInputs.frontFacing);
#endif
