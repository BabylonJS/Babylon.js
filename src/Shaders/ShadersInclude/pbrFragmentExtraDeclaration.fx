// Input
varying vec3 vPositionW;

#ifdef NORMAL
    varying vec3 vNormalW;

    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        varying vec3 vEnvironmentIrradiance;
    #endif
#endif

#ifdef VERTEXCOLOR
    varying vec4 vColor;
#endif
