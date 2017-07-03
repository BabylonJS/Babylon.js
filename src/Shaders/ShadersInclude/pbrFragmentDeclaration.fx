uniform vec3 vReflectionColor;
uniform vec4 vAlbedoColor;

// CUSTOM CONTROLS
uniform vec4 vLightingIntensity;

#if defined(REFLECTION) || defined(REFRACTION)
uniform vec2 vMicrosurfaceTextureLods;
#endif

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

#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) 
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

#ifdef REFRACTIONMAP_3D
#else
uniform mat4 refractionMatrix;
#endif
#endif

// Reflection
#ifdef REFLECTION
uniform vec2 vReflectionInfos;

#ifdef REFLECTIONMAP_SKYBOX
#else

#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)
uniform mat4 reflectionMatrix;
#endif
#endif
#endif