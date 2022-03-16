vec3 viewDirectionW = normalize(vEyePosition.xyz - vPositionW);

#ifdef NORMAL
    vec3 normalW = normalize(vNormalW);
#else
    vec3 normalW = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
#endif

vec3 geometricNormalW = normalW;

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    geometricNormalW = gl_FrontFacing ? geometricNormalW : -geometricNormalW;
#endif
