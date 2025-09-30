// Input
varying vPositionW: vec3f;

#if DEBUGMODE > 0
    varying vClipSpacePosition: vec4f;
#endif

#include<mainUVVaryingDeclaration>[1..7]

#ifdef NORMAL
    varying vNormalW: vec3f;
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        varying vEnvironmentIrradiance: vec3f;
    #endif
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    varying vColor: vec4f;
#endif

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
    varying vViewDepth: f32;
#endif
