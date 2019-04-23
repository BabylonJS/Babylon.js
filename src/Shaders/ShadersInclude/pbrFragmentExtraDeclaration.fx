// Input
#ifdef WEBGGPU
    layout(location = 0) in vec3 vPositionW;
#else
    varying vec3 vPositionW;
#endif

#ifdef NORMAL
    #ifdef WEBGGPU
        layout(location = 1) in vec3 vNormalW;
    #else
        varying vec3 vNormalW;
    #endif

    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        #ifdef WEBGGPU
            #ifdef WEBGGPU
                layout(location = 2) in vec3 vEnvironmentIrradiance;
            #else
                varying vec3 vEnvironmentIrradiance;
            #endif
        #else
            varying vec3 vEnvironmentIrradiance;
        #endif
    #endif
#endif

#ifdef VERTEXCOLOR
    #ifdef WEBGGPU
        layout(location = 3) in vec4 vColor;
    #else
        varying vec4 vColor;
    #endif
#endif

#if DEBUGMODE > 0
    #ifdef WEBGGPU
        layout(location = 5) in vec4 vClipSpacePosition;
    #else
        varying vec4 vClipSpacePosition;
    #endif
#endif

#ifdef MAINUV1
    #ifdef WEBGGPU
        layout(location = 6) in vec2 vMainUV1;
    #else
        varying vec2 vMainUV1;
    #endif
#endif

#ifdef MAINUV2
    #ifdef WEBGGPU
        layout(location = 7) in vec2 vMainUV2;
    #else
        varying vec2 vMainUV2;
    #endif
#endif