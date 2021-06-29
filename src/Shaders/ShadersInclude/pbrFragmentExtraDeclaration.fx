// Input
varying vec3 vPositionW;

#if DEBUGMODE > 0
    varying vec4 vClipSpacePosition;
#endif

#include<mainUVVaryingDeclaration>[1..7]

#ifdef NORMAL
    varying vec3 vNormalW;
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        varying vec3 vEnvironmentIrradiance;
    #endif
#endif

#ifdef VERTEXCOLOR
    varying vec4 vColor;
#endif