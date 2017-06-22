uniform mat4 view;
uniform mat4 viewProjection;

#ifdef ALBEDO
uniform mat4 albedoMatrix;
uniform vec2 vAlbedoInfos;
#endif

#ifdef AMBIENT
uniform mat4 ambientMatrix;
uniform vec3 vAmbientInfos;
#endif

#ifdef OPACITY
uniform mat4 opacityMatrix;
uniform vec2 vOpacityInfos;
#endif

#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;
uniform mat4 emissiveMatrix;
#endif

#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;
uniform mat4 lightmapMatrix;
#endif

#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) 
uniform vec3 vReflectivityInfos;
uniform mat4 reflectivityMatrix;
#endif

#ifdef MICROSURFACEMAP
uniform vec2 vMicroSurfaceSamplerInfos;
uniform mat4 microSurfaceSamplerMatrix;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif
