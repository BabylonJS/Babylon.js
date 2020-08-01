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

#if DEBUGMODE > 0
    varying vec4 vClipSpacePosition;
#endif

#ifdef MAINUV1
    varying vec2 vMainUV1;
#endif

#ifdef MAINUV2
    varying vec2 vMainUV2;
#endif

#ifdef PREPASS
	varying vec3 vViewPos;
#endif
