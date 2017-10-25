    uniform vec4 vPrimaryColor;
    uniform vec4 vSecondaryColor;
    uniform vec4 vThirdColor;
    uniform float shadowLevel;

#ifdef OPACITY
    uniform vec2 vOpacityInfo;
#endif

#ifdef ENVIRONMENT
    uniform vec2 vEnvironmentInfo;
    uniform mat4 environmentMatrix;
    uniform vec3 vEnvironmentMicrosurfaceInfos;
#endif