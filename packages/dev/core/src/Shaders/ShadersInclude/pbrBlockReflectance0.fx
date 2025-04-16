#ifdef METALLICWORKFLOW
    float reflectance = max(max(reflectivityOut.reflectanceF0.r, reflectivityOut.reflectanceF0.g), reflectivityOut.reflectanceF0.b);
    vec3 specularEnvironmentR0 = reflectivityOut.reflectanceF0;
#else
    float reflectance = max(max(reflectivityOut.surfaceReflectivityColor.r, reflectivityOut.surfaceReflectivityColor.g), reflectivityOut.surfaceReflectivityColor.b);
    vec3 specularEnvironmentR0 = reflectivityOut.surfaceReflectivityColor.rgb;
#endif

#ifdef METALLICWORKFLOW
    vec3 specularEnvironmentR90 = reflectivityOut.reflectanceF90;
#else 
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);
#endif

// Back Compat
#ifdef ALPHAFRESNEL
    float reflectance90 = fresnelGrazingReflectance(reflectance);
    specularEnvironmentR90 = specularEnvironmentR90 * reflectance90;
#endif
