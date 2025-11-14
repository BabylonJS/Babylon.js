#if defined(FORCENORMALFORWARD) && defined(NORMAL)
    vec3 faceNormal = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
    #if defined(TWOSIDEDLIGHTING)
        faceNormal = gl_FrontFacing ? faceNormal : -faceNormal;
    #endif

    normalW *= sign(dot(normalW, faceNormal));
    coatNormalW *= sign(dot(coatNormalW, faceNormal));
#endif

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    #if defined(MIRRORED)
        normalW = gl_FrontFacing ? -normalW : normalW;
        coatNormalW = gl_FrontFacing ? -coatNormalW : coatNormalW;
    #else
        normalW = gl_FrontFacing ? normalW : -normalW;
        coatNormalW = gl_FrontFacing ? coatNormalW : -coatNormalW;
    #endif
#endif
