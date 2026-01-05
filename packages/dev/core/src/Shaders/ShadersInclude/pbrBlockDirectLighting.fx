vec3 diffuseBase = vec3(0., 0., 0.);
#ifdef SS_TRANSLUCENCY
    vec3 diffuseTransmissionBase = vec3(0., 0., 0.);
#endif
#ifdef SPECULARTERM
    vec3 specularBase = vec3(0., 0., 0.);
#endif
#ifdef CLEARCOAT
    vec3 clearCoatBase = vec3(0., 0., 0.);
#endif
#ifdef SHEEN
    vec3 sheenBase = vec3(0., 0., 0.);
#endif

#if defined(SPECULARTERM) && defined(LIGHT0)
    vec3 coloredFresnel;
#endif
// Direct Lighting Variables
preLightingInfo preInfo;
lightingInfo info;
float shadow = 1.; // 1 - shadowLevel
float aggShadow = 0.;
float numLights = 0.;

#if defined(CLEARCOAT) && defined(CLEARCOAT_TINT)
    vec3 absorption = vec3(0.);
#endif
