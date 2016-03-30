// Light Computing
struct lightingInfo
{
    vec3 diffuse;
    #ifdef SPECULARTERM
        vec3 specular;
    #endif
};

lightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius, out float NdotL) {
    lightingInfo result;

    vec3 lightDirection;
    float attenuation = 1.0;
    float lightDistance;
    
    // Point
    if (lightData.w == 0.)
    {
        vec3 lightOffset = lightData.xyz - vPositionW;
        float lightDistanceSquared = dot(lightOffset, lightOffset);
        attenuation = computeLightFalloff(lightOffset, lightDistanceSquared, range);
        
        lightDistance = sqrt(lightDistanceSquared);
        lightDirection = normalize(lightOffset);
    }
    // Directional
    else
    {
        lightDistance = length(-lightData.xyz);
        lightDirection = normalize(-lightData.xyz);
    }
    
    // Roughness
    roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
    
    // diffuse
    vec3 H = normalize(viewDirectionW + lightDirection);
    NdotL = max(0.00000000001, dot(vNormal, lightDirection));
    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));

    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);
    result.diffuse = diffuseTerm * diffuseColor * attenuation;

    #ifdef SPECULARTERM
        // Specular
        float NdotH = max(0.00000000001, dot(vNormal, H));

        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);
        result.specular = specTerm * attenuation;
    #endif

    return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius, out float NdotL) {
    lightingInfo result;

    vec3 lightOffset = lightData.xyz - vPositionW;
    vec3 lightVectorW = normalize(lightOffset);

    // diffuse
    float cosAngle = max(0.000000000000001, dot(-lightDirection.xyz, lightVectorW));
    
    if (cosAngle >= lightDirection.w)
    {
        cosAngle = max(0., pow(cosAngle, lightData.w));
        
        // Inverse squared falloff.
        float lightDistanceSquared = dot(lightOffset, lightOffset);
        float attenuation = computeLightFalloff(lightOffset, lightDistanceSquared, range);
        
        // Directional falloff.
        attenuation *= cosAngle;
        
        // Roughness.
        float lightDistance = sqrt(lightDistanceSquared);
        roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
        
        // Diffuse
        vec3 H = normalize(viewDirectionW - lightDirection.xyz);
        NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));
        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);

        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);
        result.diffuse = diffuseTerm * diffuseColor * attenuation;

        #ifdef SPECULARTERM
            // Specular
            float NdotH = max(0.00000000001, dot(vNormal, H));

            vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);
            result.specular = specTerm  * attenuation;
        #endif

        return result;
    }

    result.diffuse = vec3(0.);
    #ifdef SPECULARTERM
        result.specular = vec3(0.);
    #endif

    return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV, float lightRadius, out float NdotL) {
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
        float NdotH = max(0.00000000001, dot(vNormal, H));
        NdotL = max(0.00000000001, NdotL);
        float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));

        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);
        result.specular = specTerm;
    #endif

    return result;
}