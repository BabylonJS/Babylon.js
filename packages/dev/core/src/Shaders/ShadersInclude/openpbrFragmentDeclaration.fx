uniform vec4 vEyePosition;

uniform float vBaseWeight;
uniform vec4 vBaseColor;
uniform float vBaseDiffuseRoughness;
uniform vec4 vReflectanceInfo;
uniform vec4 vSpecularColor;
uniform float vCoatWeight;
uniform vec3 vCoatColor;
uniform float vCoatRoughness;
uniform float vCoatIor;
uniform vec3 vEmissionColor;

// CUSTOM CONTROLS
uniform vec4 vLightingIntensity;
uniform float visibility;

// Samplers
#ifdef BASE_COLOR
uniform vec2 vBaseColorInfos;
#endif

#ifdef BASE_WEIGHT
uniform vec2 vBaseWeightInfos;
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
uniform vec2 vBaseDiffuseRoughnessInfos;
#endif

#ifdef AMBIENT_OCCLUSION
uniform vec4 vAmbientOcclusionInfos;
#endif

#ifdef GEOMETRY_NORMAL
uniform vec2 vGeometryNormalInfos;
uniform vec2 vTangentSpaceParams;
#endif

#ifdef GEOMETRY_COAT_NORMAL
uniform vec2 vGeometryCoatNormalInfos;
#endif

#ifdef GEOMETRY_OPACITY
uniform vec2 vGeometryOpacityInfos;
#endif

#ifdef EMISSION_COLOR
uniform vec2 vEmissionColorInfos;
#endif

#ifdef METALLIC_ROUGHNESS
uniform vec2 vBaseMetalRoughInfos;
#endif

#ifdef COAT_WEIGHT
uniform vec2 vCoatWeightInfos;
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
    #if defined(USEIRRADIANCEMAP) && defined(USE_IRRADIANCE_DOMINANT_DIRECTION)
        uniform vec3 vReflectionDominantDirection;
    #endif

    #if defined(USE_LOCAL_REFLECTIONMAP_CUBIC) && defined(REFLECTIONMAP_CUBIC)
	    uniform vec3 vReflectionPosition;
	    uniform vec3 vReflectionSize;
    #endif
#endif

#ifdef PREPASS
    #ifdef SS_SCATTERING
        uniform float scatteringDiffusionProfile;
    #endif
#endif

#if DEBUGMODE > 0
    uniform vec2 vDebugMode;
#endif

#ifdef DETAIL
    uniform vec4 vDetailInfos;
#endif

#include<decalFragmentDeclaration>

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

#define ADDITIONAL_FRAGMENT_DECLARATION
