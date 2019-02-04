// Pre Light Computing
struct preLightingInfo
{
    // Pre Falloff Info
    vec3 lightOffset;
    float lightDistanceSquared;
    float lightDistance;

    // Falloff Info
    float attenuation;

    // Lighting Info
    vec3 L;
    vec3 H;
    float NdotV;
    float NdotL;
    float VdotH;
    float roughness;
};

preLightingInfo computePointAndSpotPreLightingInfo(vec4 lightData, vec3 V, vec3 N) {
    preLightingInfo result;

    // Attenuation data.
    result.lightOffset = lightData.xyz - vPositionW;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);

    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

    // Geometry Data.
    result.L = normalize(result.lightOffset);
    result.H = normalize(V + result.L);
    result.NdotL = clamp(dot(N, result.L), 0.000000000001, 1.0);
    result.VdotH = clamp(dot(V, result.H), 0.0, 1.0);

    return result;
}

preLightingInfo computeDirectionalPreLightingInfo(vec4 lightData, vec3 V, vec3 N) {
    preLightingInfo result;

    // Roughness
    result.lightDistance = length(-lightData.xyz);

    // Geometry Data.
    result.L = normalize(-lightData.xyz);
    result.H = normalize(V + result.L);
    result.NdotL = clamp(dot(N, result.L), 0.00000000001, 1.0);
    result.VdotH = clamp(dot(V, result.H), 0.0, 1.0);

    return result;
}

preLightingInfo computeHemisphericPreLightingInfo(vec4 lightData, vec3 V, vec3 N) {
    preLightingInfo result;

    // Geometry Data.
    result.NdotL = dot(N, lightData.xyz) * 0.5 + 0.5;
    result.NdotL = clamp(result.NdotL, 0.000000000001, 1.0);

    #ifdef SPECULARTERM
        result.L = normalize(lightData.xyz);
        result.H = normalize(V + result.L);
        result.VdotH = clamp(dot(V, result.H), 0.0, 1.0);
    #endif

    return result;
}