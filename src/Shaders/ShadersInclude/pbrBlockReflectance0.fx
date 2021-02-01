float reflectance = max(max(reflectivityOut.surfaceReflectivityColor.r, reflectivityOut.surfaceReflectivityColor.g), reflectivityOut.surfaceReflectivityColor.b);
vec3 specularEnvironmentR0 = reflectivityOut.surfaceReflectivityColor.rgb;

#ifdef METALLICWORKFLOW
    vec3 specularEnvironmentR90 = vec3(metallicReflectanceFactors.a);
#else 
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);
#endif

// Back Compat
#ifdef ALPHAFRESNEL
    float reflectance90 = fresnelGrazingReflectance(reflectance);
    specularEnvironmentR90 = specularEnvironmentR90 * reflectance90;
#endif
