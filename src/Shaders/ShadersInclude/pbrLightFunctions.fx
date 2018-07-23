// Light Computing
struct lightingInfo
{
    vec3 diffuse;
    #ifdef SPECULARTERM
        vec3 specular;
    #endif
};

float computeDistanceLightFalloff(vec3 lightOffset, float lightDistanceSquared, float range, float inverseSquaredRange)
{   
    #ifdef USEPHYSICALLIGHTFALLOFF
        float lightDistanceFalloff = 1.0 / ((lightDistanceSquared + 0.001));
    #elif USEFROSTBITELIGHTFALLOFF
        // Prevents infinity issues at 0.
        const float minDistanceSquared = 0.01*0.01;
        float lightDistanceFalloff = 1.0 / (max(lightDistanceSquared, minDistanceSquared));

        float factor = lightDistanceSquared * inverseSquaredRange;
        float attenuation = clamp(1.0 - factor * factor, 0., 1.);
        attenuation *= attenuation;

        // Smooth attenuation of the falloff defined by the range.
        lightDistanceFalloff *= attenuation;
    #else
        float lightDistanceFalloff = max(0., 1.0 - length(lightOffset) / range);
    #endif
    
    return lightDistanceFalloff;
}

float computeDirectionalLightFalloff(vec3 lightDirection, vec3 directionToLightCenterW, float cosHalfAngle, float exponent, float lightAngleScale, float lightAngleOffset)
{
    float falloff = 0.0;
    
    #ifdef USEPHYSICALLIGHTFALLOFF
        const float kMinusLog2ConeAngleIntensityRatio = 6.64385618977; // -log2(0.01)

        // Calculate a Spherical Gaussian (von Mises-Fisher distribution, not angle-based Gaussian) such that the peak is in the light direction,
        // and the value at the nominal cone angle is 1% of the peak. Because we want the distribution to decay from unity (100%)
        // at the peak direction (dot product = 1) down to 1% at the nominal cone cutoff (dot product = cosAngle) 
        // the falloff rate expressed in terms of the base-two dot product is therefore -log2(ConeAngleIntensityRatio) / (1.0 - cosAngle).
        // Note that the distribution is unnormalised in that peak density is unity, rather than the total energy is unity.
        float concentrationKappa = kMinusLog2ConeAngleIntensityRatio / (1.0 - cosHalfAngle);
    
        // Evaluate spherical gaussian for light directional falloff for spot light type (note: spot directional falloff; 
        // not directional light type)
        vec4 lightDirectionSpreadSG = vec4(-lightDirection * concentrationKappa, -concentrationKappa);
        falloff = exp2(dot(vec4(directionToLightCenterW, 1.0), lightDirectionSpreadSG));
    #elif USEFROSTBITELIGHTFALLOFF
        // On the CPU
        // float lightAngleScale = 1.0 f / max (0.001f, ( cosInner - cosOuter ));
        // float lightAngleOffset = -cosOuter * angleScale;

        float cd = dot(-lightDirection, directionToLightCenterW);
        float falloff = clamp(cd * lightAngleScale + lightAngleOffset, 0., 1.);
        // smooth the transition
        falloff *= falloff;
    #else
        float cosAngle = max(0.000000000000001, dot(-lightDirection, directionToLightCenterW));
        if (cosAngle >= cosHalfAngle)
        {
            falloff = max(0., pow(cosAngle, exponent));
        }
    #endif
    
    return falloff;
}

lightingInfo computeDirectionalLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float lightRadius, float roughness, float NdotV, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, out float NdotL) {
    lightingInfo result;

    float lightDistance = length(-lightData.xyz);
    vec3 lightDirection = normalize(-lightData.xyz);

    // Roughness
    roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
    
    // diffuse
    vec3 H = normalize(viewDirectionW + lightDirection);
    NdotL = clamp(dot(vNormal, lightDirection), 0.00000000001, 1.0);
    float VdotH = clamp(dot(viewDirectionW, H), 0.0, 1.0);

    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);
    result.diffuse = diffuseTerm * diffuseColor;

    #ifdef SPECULARTERM
        // Specular
        float NdotH = clamp(dot(vNormal, H), 0.000000000001, 1.0);

        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, reflectance0, reflectance90, geometricRoughnessFactor);
        result.specular = specTerm * diffuseColor;
    #endif

    return result;
}

lightingInfo computePointLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float lightRadius, float roughness, float NdotV, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec4 lightFalloff, out float NdotL) {
    lightingInfo result;

    vec3 lightOffset = lightData.xyz - vPositionW;
    float lightDistanceSquared = dot(lightOffset, lightOffset);
    float attenuation = computeDistanceLightFalloff(lightOffset, lightDistanceSquared, lightFalloff.x, lightFalloff.y);
    
    float lightDistance = sqrt(lightDistanceSquared);
    vec3 lightDirection = normalize(lightOffset);
    
    // Roughness
    roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
    
    // diffuse
    vec3 H = normalize(viewDirectionW + lightDirection);
    NdotL = clamp(dot(vNormal, lightDirection), 0.00000000001, 1.0);
    float VdotH = clamp(dot(viewDirectionW, H), 0.0, 1.0);

    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);
    result.diffuse = diffuseTerm * diffuseColor * attenuation;

    #ifdef SPECULARTERM
        // Specular
        float NdotH = clamp(dot(vNormal, H), 0.000000000001, 1.0);

        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, reflectance0, reflectance90, geometricRoughnessFactor);
        result.specular = specTerm * diffuseColor * attenuation;
    #endif

    return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float lightRadius, float roughness, float NdotV, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec4 lightFalloff, out float NdotL) {
    lightingInfo result;

    vec3 lightOffset = lightData.xyz - vPositionW;
    vec3 directionToLightCenterW = normalize(lightOffset);

    // Distance falloff.
    float lightDistanceSquared = dot(lightOffset, lightOffset);
    float attenuation = computeDistanceLightFalloff(lightOffset, lightDistanceSquared, lightFalloff.x, lightFalloff.y);
    
    // Directional falloff.
    float directionalAttenuation = computeDirectionalLightFalloff(lightDirection.xyz, directionToLightCenterW, lightDirection.w, lightData.w, lightFalloff.z, lightFalloff.w);
    attenuation *= directionalAttenuation;
    
    // Roughness.
    float lightDistance = sqrt(lightDistanceSquared);
    roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
    
    // Diffuse
    vec3 H = normalize(viewDirectionW + directionToLightCenterW);
    NdotL = clamp(dot(vNormal, directionToLightCenterW), 0.000000000001, 1.0);
    float VdotH = clamp(dot(viewDirectionW, H), 0.0, 1.0);

    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);
    result.diffuse = diffuseTerm * diffuseColor * attenuation;

    #ifdef SPECULARTERM
        // Specular
        float NdotH = clamp(dot(vNormal, H), 0.000000000001, 1.0);

        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, reflectance0, reflectance90, geometricRoughnessFactor);
        result.specular = specTerm * diffuseColor * attenuation;
    #endif

    return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, out float NdotL) {
    lightingInfo result;

    // Roughness
    // Do not touch roughness on hemispheric.

    // Diffuse
    NdotL = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
    result.diffuse = mix(groundColor, diffuseColor, NdotL);

    #ifdef SPECULARTERM
        // Specular
        vec3 lightVectorW = normalize(lightData.xyz);
        vec3 H = normalize(viewDirectionW + lightVectorW);
        float NdotH = clamp(dot(vNormal, H), 0.000000000001, 1.0);
        NdotL = clamp(NdotL, 0.000000000001, 1.0);
        float VdotH = clamp(dot(viewDirectionW, H), 0.0, 1.0);

        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, reflectance0, reflectance90, geometricRoughnessFactor);
        result.specular = specTerm * diffuseColor;
    #endif

    return result;
}

vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler, mat4 textureProjectionMatrix){
	vec4 strq = textureProjectionMatrix * vec4(vPositionW, 1.0);
	strq /= strq.w;
	vec3 textureColor = texture2D(projectionLightSampler, strq.xy).rgb;
	return toLinearSpace(textureColor);
}