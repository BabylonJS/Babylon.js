// Pre Light Computing
struct preLightingInfo
{
    // Pre Falloff Info
    lightOffset: vec3f,
    lightDistanceSquared: f32,
    lightDistance: f32,

    // Falloff Info
    attenuation: f32,

    // Lighting Info
    L: vec3f,
    H: vec3f,
    NdotV: f32,
    NdotLUnclamped: f32,
    NdotL: f32,
    VdotH: f32,
    roughness: f32,

    #ifdef IRIDESCENCE
        iridescenceIntensity: f32
    #endif
};

fn computePointAndSpotPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f, posW: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

    // Attenuation data.
    result.lightOffset = lightData.xyz - posW;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);

    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

    // Geometry Data.
    result.L = normalize(result.lightOffset);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));

    result.NdotLUnclamped = dot(N, result.L);
    result.NdotL = saturateEps(result.NdotLUnclamped);

    return result;
}

fn computeDirectionalPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

    // Roughness
    result.lightDistance = length(-lightData.xyz);

    // Geometry Data.
    result.L = normalize(-lightData.xyz);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));

    result.NdotLUnclamped = dot(N, result.L);
    result.NdotL = saturateEps(result.NdotLUnclamped);

    return result;
}

fn computeHemisphericPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

    // Geometry Data.
    // Half Lambert for Hemispherix lighting.
    result.NdotL = dot(N, lightData.xyz) * 0.5 + 0.5;
    result.NdotL = saturateEps(result.NdotL);
    result.NdotLUnclamped = result.NdotL;

    #ifdef SPECULARTERM
        result.L = normalize(lightData.xyz);
        result.H = normalize(V + result.L);
        result.VdotH = saturate(dot(V, result.H));
    #endif

    return result;
}