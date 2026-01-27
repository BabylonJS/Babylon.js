uniform float vBaseWeight;
uniform vec4 vBaseColor;
uniform float vBaseDiffuseRoughness;
uniform vec4 vReflectanceInfo;
uniform vec4 vSpecularColor;
uniform vec3 vSpecularAnisotropy;
uniform float vTransmissionWeight;
uniform vec3 vTransmissionColor;
uniform float vTransmissionDepth;
uniform vec3 vTransmissionScatter;
uniform float vTransmissionScatterAnisotropy;
uniform float vTransmissionDispersionScale;
uniform float vTransmissionDispersionAbbeNumber;
uniform float vCoatWeight;
uniform vec3 vCoatColor;
uniform float vCoatRoughness;
uniform float vCoatRoughnessAnisotropy;
uniform float vCoatIor;
uniform float vCoatDarkening;
uniform float vFuzzWeight;
uniform vec3 vFuzzColor;
uniform float vFuzzRoughness;
uniform vec2 vGeometryCoatTangent;
uniform float vGeometryThickness;
uniform vec3 vEmissionColor;
uniform float vThinFilmWeight;
uniform vec2 vThinFilmThickness;
uniform float vThinFilmIor;

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

#ifdef BASE_METALNESS
uniform vec2 vBaseMetalnessInfos;
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
uniform vec2 vBaseDiffuseRoughnessInfos;
#endif

#ifdef SPECULAR_WEIGHT
uniform vec2 vSpecularWeightInfos;
#endif

#ifdef SPECULAR_COLOR
uniform vec2 vSpecularColorInfos;
#endif

#ifdef SPECULAR_ROUGHNESS
uniform vec2 vSpecularRoughnessInfos;
#endif

#ifdef SPECULAR_ROUGHNESS_ANISOTROPY
uniform vec2 vSpecularRoughnessAnisotropyInfos;
#endif

#ifdef SPECULAR_IOR
uniform vec2 vSpecularIorInfos;
#endif

#ifdef AMBIENT_OCCLUSION
uniform vec2 vAmbientOcclusionInfos;
#endif

#ifdef GEOMETRY_NORMAL
uniform vec2 vGeometryNormalInfos;
uniform vec2 vTangentSpaceParams;
#endif

#ifdef GEOMETRY_TANGENT
uniform vec2 vGeometryTangentInfos;
#endif

#ifdef GEOMETRY_COAT_NORMAL
uniform vec2 vGeometryCoatNormalInfos;
#endif

#ifdef GEOMETRY_OPACITY
uniform vec2 vGeometryOpacityInfos;
#endif

#ifdef GEOMETRY_THICKNESS
uniform vec2 vGeometryThicknessInfos;
#endif

#ifdef EMISSION_COLOR
uniform vec2 vEmissionColorInfos;
#endif

#ifdef TRANSMISSION_WEIGHT
uniform vec2 vTransmissionWeightInfos;
#endif

#ifdef TRANSMISSION_COLOR
uniform vec2 vTransmissionColorInfos;
#endif

#ifdef TRANSMISSION_DEPTH
uniform vec2 vTransmissionDepthInfos;
#endif

#ifdef TRANSMISSION_SCATTER
uniform vec2 vTransmissionScatterInfos;
#endif

#ifdef TRANSMISSION_DISPERSION_SCALE
uniform vec2 vTransmissionDispersionScaleInfos;
#endif

#ifdef COAT_WEIGHT
uniform vec2 vCoatWeightInfos;
#endif

#ifdef COAT_COLOR
uniform vec2 vCoatColorInfos;
#endif

#ifdef COAT_ROUGHNESS
uniform vec2 vCoatRoughnessInfos;
#endif

#ifdef COAT_ROUGHNESS_ANISOTROPY
uniform vec2 vCoatRoughnessAnisotropyInfos;
#endif

#ifdef COAT_IOR
uniform vec2 vCoatIorInfos;
#endif

#ifdef COAT_DARKENING
uniform vec2 vCoatDarkeningInfos;
#endif

#ifdef FUZZ_WEIGHT
uniform vec2 vFuzzWeightInfos;
#endif

#ifdef FUZZ_COLOR
uniform vec2 vFuzzColorInfos;
#endif

#ifdef FUZZ_ROUGHNESS
uniform vec2 vFuzzRoughnessInfos;
#endif

#ifdef GEOMETRY_COAT_TANGENT
uniform vec2 vGeometryCoatTangentInfos;
#endif

#ifdef THIN_FILM_WEIGHT
uniform vec2 vThinFilmWeightInfos;
#endif

#ifdef THIN_FILM_THICKNESS
uniform vec2 vThinFilmThicknessInfos;
#endif

// Scene uniforms (view, viewProjection, etc.) are included via sceneFragmentDeclaration or sceneUboDeclaration
#include<sceneFragmentDeclaration>

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

#ifdef REFRACTED_BACKGROUND
    uniform mat4 backgroundRefractionMatrix;
    uniform vec3 vBackgroundRefractionInfos;
#endif

#define ADDITIONAL_FRAGMENT_DECLARATION
