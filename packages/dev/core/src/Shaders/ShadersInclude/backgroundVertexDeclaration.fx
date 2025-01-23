uniform mat4 view;
uniform mat4 viewProjection;
#ifdef MULTIVIEW
    uniform mat4 viewProjectionR;
#endif


uniform float shadowLevel;

#ifdef DIFFUSE
uniform mat4 diffuseMatrix;
uniform vec2 vDiffuseInfos;
#endif

#ifdef REFLECTION
    uniform vec2 vReflectionInfos;
    uniform mat4 reflectionMatrix;
    uniform vec3 vReflectionMicrosurfaceInfos;
    uniform float fFovMultiplier;

    #ifndef AREALIGHT_ROUGHNESS
        #define AREALIGHT_ROUGHNESS vReflectionInfos.y
    #endif
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif