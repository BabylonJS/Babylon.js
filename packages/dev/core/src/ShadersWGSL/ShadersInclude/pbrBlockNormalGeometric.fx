var viewDirectionW: vec3f = normalize(vEyePosition.xyz - vPositionW);

#ifdef NORMAL
    var normalW: vec3f = normalize(vNormalW);
#else
    var normalW: vec3f = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
#endif

var geometricNormalW: vec3f = normalW;

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    geometricNormalW = gl_FrontFacing ? geometricNormalW : -geometricNormalW;
#endif
