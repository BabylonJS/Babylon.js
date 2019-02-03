// Light Results
struct lightingInfo
{
    vec3 diffuse;
    #ifdef SPECULARTERM
        vec3 specular;
    #endif
    #ifdef CLEARCOAT
        // xyz contains the clearcoat color.
        // w contains the 1 - clearcoat fresnel to ease the energy conservation computation.
        vec4 clearCoat;
    #endif
};

vec3 computeHemisphericDiffuseLighting(preLightingInfo info, vec3 lightColor, vec3 groundColor) {
    return mix(groundColor, lightColor, info.NdotL);
}

vec3 computeDiffuseLighting(preLightingInfo info, vec3 lightColor) {
    float diffuseTerm = computeDiffuseTerm(info.NdotL, info.NdotV, info.VdotH, info.roughness);
    return diffuseTerm * info.attenuation * info.NdotL * lightColor;
}

vec3 computeSpecularLighting(preLightingInfo info, vec3 N, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
    float NdotH = clamp(dot(N, info.H), 0.000000000001, 1.0);

    vec3 specTerm = computeSpecularTerm(NdotH, info.NdotL, info.NdotV, info.VdotH, info.roughness, reflectance0, reflectance90, geometricRoughnessFactor);
    return specTerm * info.attenuation * info.NdotL * lightColor;
}

vec3 computeAnisotropicSpecularLighting(preLightingInfo info, vec3 V, vec3 N, vec3 T, vec3 B, float anisotropy, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
    float NdotH = clamp(dot(N, info.H), 0.000000000001, 1.0);

    float TdotH = dot(T, info.H);
    float BdotH = dot(B, info.H);

    float TdotV = dot(T, V);
    float BdotV = dot(B, V);
    float TdotL = dot(T, info.L);
    float BdotL = dot(B, info.L);

    vec3 specTerm = computeAnisotropicSpecularTerm(NdotH, info.NdotL, info.NdotV, info.VdotH, TdotH, BdotH, TdotV, BdotV, TdotL, BdotL, info.roughness, anisotropy, reflectance0, reflectance90, geometricRoughnessFactor);
    return specTerm * info.attenuation * info.NdotL * lightColor;
}

vec4 computeClearCoatLighting(preLightingInfo info, vec3 Ncc, float geometricRoughnessFactor, float clearCoatIntensity, vec3 lightColor) {
    float NccdotL = clamp(dot(Ncc, info.L), 0.00000000001, 1.0);
    float NccdotH = clamp(dot(Ncc, info.H), 0.000000000001, 1.0);

    vec2 clearCoatTerm = computeClearCoatTerm(NccdotH, info.VdotH, info.roughness, geometricRoughnessFactor, clearCoatIntensity);

    vec4 result = vec4(0.);
    result.rgb = clearCoatTerm.x * info.attenuation * NccdotL * lightColor;
    result.a = clearCoatTerm.y;
    return result;
}

vec3 computeClearCoatLightingAbsorption(float NdotVRefract, vec3 L, vec3 Ncc, vec3 clearCoatColor, float clearCoatThickness, float clearCoatIntensity) {
    vec3 LRefract = -refract(L, Ncc, vClearCoatRefractionParams.y);
    float NdotLRefract = clamp(dot(Ncc, LRefract), 0.00000000001, 1.0);

    vec3 absorption = computeClearCoatAbsorption(NdotVRefract, NdotLRefract, clearCoatColor, clearCoatThickness, clearCoatIntensity);
    return absorption;
}

vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler, mat4 textureProjectionMatrix){
	vec4 strq = textureProjectionMatrix * vec4(vPositionW, 1.0);
	strq /= strq.w;
	vec3 textureColor = texture2D(projectionLightSampler, strq.xy).rgb;
	return toLinearSpace(textureColor);
}
