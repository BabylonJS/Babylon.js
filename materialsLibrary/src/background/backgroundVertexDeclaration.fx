uniform mat4 view;
uniform mat4 viewProjection;
uniform float shadowLevel;

#ifdef OPACITY
uniform mat4 opacityMatrix;
uniform vec2 vOpacityInfo;
#endif

#ifdef ENVIRONMENT
uniform vec2 vEnvironmentInfo;
uniform mat4 environmentMatrix;
uniform vec3 vEnvionmentMicrosurfaceInfos;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif