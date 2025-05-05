#if defined(FORCENORMALFORWARD) && defined(NORMAL)
    vec3 faceNormal = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
    #if defined(TWOSIDEDLIGHTING)
        faceNormal = gl_FrontFacing ? faceNormal : -faceNormal;
    #endif

    normalW *= sign(dot(normalW, faceNormal));
#endif

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    #if defined(MIRRORED)
        normalW = gl_FrontFacing ? -normalW : normalW;
    #else
        normalW = gl_FrontFacing ? normalW : -normalW;
    #endif
#endif
