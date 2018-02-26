    uniform vec4 vPrimaryColor;
    uniform vec4 vSecondaryColor;
    uniform vec4 vTertiaryColor;
    uniform float shadowLevel;
    uniform float alpha;

#ifdef DIFFUSE
    uniform vec2 vDiffuseInfos;
#endif

#ifdef REFLECTION
    uniform vec2 vReflectionInfos;
    uniform mat4 reflectionMatrix;
    uniform vec3 vReflectionMicrosurfaceInfos;
#endif

#if defined(REFLECTIONFRESNEL) || defined(OPACITYFRESNEL)
    uniform vec3 vBackgroundCenter;
#endif

#ifdef REFLECTIONFRESNEL
    uniform vec4 vReflectionControl;
#endif

#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
uniform mat4 view;
#endif