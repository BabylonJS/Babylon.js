#ifdef METALLICWORKFLOW
    var reflectanceF0: f32 = reflectivityOut.reflectanceF0.r;
    var specularEnvironmentR0: vec3f = reflectivityOut.reflectanceF0;
#else
    var reflectanceF0: f32 = max(max(reflectivityOut.surfaceReflectivityColor.r, reflectivityOut.surfaceReflectivityColor.g), reflectivityOut.surfaceReflectivityColor.b);
    var specularEnvironmentR0: vec3f = reflectivityOut.surfaceReflectivityColor.rgb;
#endif

#ifdef METALLICWORKFLOW
    var specularEnvironmentR90: vec3f =  reflectivityOut.reflectanceF90;
#else 
    var specularEnvironmentR90: vec3f =  vec3f(1.0, 1.0, 1.0);
#endif

// Back Compat
#ifdef ALPHAFRESNEL
    var reflectance90: f32 = fresnelGrazingReflectance(reflectanceF0);
    specularEnvironmentR90 = specularEnvironmentR90 * reflectance90;
#endif
