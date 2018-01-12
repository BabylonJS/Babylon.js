uniform vec3 vReflectionColor;
uniform vec4 vAlbedoColor;

// CUSTOM CONTROLS
uniform vec4 vLightingIntensity;

uniform vec4 vReflectivityColor;
uniform vec3 vEmissiveColor;

// Samplers
#ifdef ALBEDO
uniform vec2 vAlbedoInfos;
#endif

#ifdef AMBIENT
uniform vec3 vAmbientInfos;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform vec2 vTangentSpaceParams;
#endif

#ifdef OPACITY	
uniform vec2 vOpacityInfos;
#endif

#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;
#endif

#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;
#endif

#ifdef REFLECTIVITY
uniform vec3 vReflectivityInfos;
#endif

#ifdef MICROSURFACEMAP
uniform vec2 vMicroSurfaceSamplerInfos;
#endif

// Refraction Reflection
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
uniform mat4 view;
#endif

// Refraction
#ifdef REFRACTION
    uniform vec4 vRefractionInfos;
    uniform mat4 refractionMatrix;
    uniform vec3 vRefractionMicrosurfaceInfos;
#endif

// Reflection
#ifdef REFLECTION
    uniform vec2 vReflectionInfos;
    uniform mat4 reflectionMatrix;
    uniform vec3 vReflectionMicrosurfaceInfos;
#endif