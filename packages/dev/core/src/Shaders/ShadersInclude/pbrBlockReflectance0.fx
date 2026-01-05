float reflectanceF0 = reflectivityOut.reflectanceF0;
vec3 specularEnvironmentR0 = reflectivityOut.colorReflectanceF0;
vec3 specularEnvironmentR90 = reflectivityOut.colorReflectanceF90;

// Back Compat
#ifdef ALPHAFRESNEL
    float reflectance90 = fresnelGrazingReflectance(reflectanceF0);
    specularEnvironmentR90 = specularEnvironmentR90 * reflectance90;
#endif
