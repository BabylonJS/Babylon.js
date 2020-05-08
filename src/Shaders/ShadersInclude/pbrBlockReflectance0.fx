float reflectance = max(max(reflectivityOut.surfaceReflectivityColor.r, reflectivityOut.surfaceReflectivityColor.g), reflectivityOut.surfaceReflectivityColor.b);
float reflectance90 = fresnelGrazingReflectance(reflectance);
vec3 specularEnvironmentR0 = reflectivityOut.surfaceReflectivityColor.rgb;
vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
