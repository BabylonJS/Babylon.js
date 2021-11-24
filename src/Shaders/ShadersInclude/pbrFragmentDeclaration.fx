uniform vec4 vEyePosition;

uniform vec3 vReflectionColor;
uniform vec4 vAlbedoColor;

// CUSTOM CONTROLS
uniform vec4 vLightingIntensity;

uniform vec4 vReflectivityColor;
uniform vec4 vMetallicReflectanceFactors;
uniform vec3 vEmissiveColor;

uniform float visibility;

uniform vec3 vAmbientColor;

// Samplers
#ifdef ALBEDO
uniform vec2 vAlbedoInfos;
#endif

#ifdef AMBIENT
uniform vec4 vAmbientInfos;
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
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(SS_REFRACTION) || defined(PREPASS)
uniform mat4 view;
#endif

// Reflection
#ifdef REFLECTION
    uniform vec2 vReflectionInfos;
    #ifdef REALTIME_FILTERING
        uniform vec2 vReflectionFilteringInfo;
    #endif
    uniform mat4 reflectionMatrix;
    uniform vec3 vReflectionMicrosurfaceInfos;

    #if defined(USE_LOCAL_REFLECTIONMAP_CUBIC) && defined(REFLECTIONMAP_CUBIC)
	    uniform vec3 vReflectionPosition;
	    uniform vec3 vReflectionSize; 
    #endif
#endif

#define ADDITIONAL_FRAGMENT_DECLARATION

#ifdef PREPASS
    #ifdef SS_SCATTERING
        uniform float scatteringDiffusionProfile;
    #endif
#endif

#if DEBUGMODE > 0
    uniform vec2 vDebugMode;
#endif

#ifdef USESPHERICALFROMREFLECTIONMAP
    #ifdef SPHERICAL_HARMONICS
        uniform vec3 vSphericalL00;
        uniform vec3 vSphericalL1_1;
        uniform vec3 vSphericalL10;
        uniform vec3 vSphericalL11;
        uniform vec3 vSphericalL2_2;
        uniform vec3 vSphericalL2_1;
        uniform vec3 vSphericalL20;
        uniform vec3 vSphericalL21;
        uniform vec3 vSphericalL22;
    #else
        uniform vec3 vSphericalX;
        uniform vec3 vSphericalY;
        uniform vec3 vSphericalZ;
        uniform vec3 vSphericalXX_ZZ;
        uniform vec3 vSphericalYY_ZZ;
        uniform vec3 vSphericalZZ;
        uniform vec3 vSphericalXY;
        uniform vec3 vSphericalYZ;
        uniform vec3 vSphericalZX;
    #endif
#endif
