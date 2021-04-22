uniform vec4 vEyePosition;

uniform vec4 vDiffuseColor;
#ifdef SPECULARTERM
uniform vec4 vSpecularColor;
#endif
uniform vec3 vEmissiveColor;
uniform vec3 vAmbientColor;

uniform float visibility;

// Samplers
#ifdef DIFFUSE
uniform vec2 vDiffuseInfos;
#endif

#ifdef AMBIENT
uniform vec2 vAmbientInfos;
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

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform vec2 vTangentSpaceParams;
#endif

#ifdef ALPHATEST
uniform float alphaCutOff;
#endif

#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
uniform mat4 view;
#endif

#ifdef REFRACTION
    uniform vec4 vRefractionInfos;

    #ifndef REFRACTIONMAP_3D
        uniform mat4 refractionMatrix;
    #endif

    #ifdef REFRACTIONFRESNEL
        uniform vec4 refractionLeftColor;
        uniform vec4 refractionRightColor;
    #endif

    #if defined(USE_LOCAL_REFRACTIONMAP_CUBIC) && defined(REFRACTIONMAP_3D)
        uniform vec3 vRefractionPosition;
        uniform vec3 vRefractionSize; 
    #endif
#endif

#if defined(SPECULAR) && defined(SPECULARTERM)
uniform vec2 vSpecularInfos;
#endif

#ifdef DIFFUSEFRESNEL
uniform vec4 diffuseLeftColor;
uniform vec4 diffuseRightColor;
#endif

#ifdef OPACITYFRESNEL
uniform vec4 opacityParts;
#endif

#ifdef EMISSIVEFRESNEL
uniform vec4 emissiveLeftColor;
uniform vec4 emissiveRightColor;
#endif

// Reflection
#ifdef REFLECTION
uniform vec2 vReflectionInfos;

    #if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION) || defined(REFLECTIONMAP_EQUIRECTANGULAR) || defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_SKYBOX)
    uniform mat4 reflectionMatrix;
    #endif

    #ifndef REFLECTIONMAP_SKYBOX
        #if defined(USE_LOCAL_REFLECTIONMAP_CUBIC) && defined(REFLECTIONMAP_CUBIC)
            uniform vec3 vReflectionPosition;
            uniform vec3 vReflectionSize; 
        #endif
    #endif

    #ifdef REFLECTIONFRESNEL
    uniform vec4 reflectionLeftColor;
    uniform vec4 reflectionRightColor;
    #endif

#endif

#ifdef DETAIL
uniform vec4 vDetailInfos;
#endif