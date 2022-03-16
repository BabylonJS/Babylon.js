float computeDistanceLightFalloff_Standard(vec3 lightOffset, float range)
{
    return max(0., 1.0 - length(lightOffset) / range);
}

float computeDistanceLightFalloff_Physical(float lightDistanceSquared)
{
    return 1.0 / maxEps(lightDistanceSquared);
}

float computeDistanceLightFalloff_GLTF(float lightDistanceSquared, float inverseSquaredRange)
{
    float lightDistanceFalloff = 1.0 / maxEps(lightDistanceSquared);

    float factor = lightDistanceSquared * inverseSquaredRange;
    float attenuation = saturate(1.0 - factor * factor);
    attenuation *= attenuation;

    // Smooth attenuation of the falloff defined by the range.
    lightDistanceFalloff *= attenuation;
    
    return lightDistanceFalloff;
}

float computeDistanceLightFalloff(vec3 lightOffset, float lightDistanceSquared, float range, float inverseSquaredRange)
{
    #ifdef USEPHYSICALLIGHTFALLOFF
        return computeDistanceLightFalloff_Physical(lightDistanceSquared);
    #elif defined(USEGLTFLIGHTFALLOFF)
        return computeDistanceLightFalloff_GLTF(lightDistanceSquared, inverseSquaredRange);
    #else
        return computeDistanceLightFalloff_Standard(lightOffset, range);
    #endif
}

float computeDirectionalLightFalloff_Standard(vec3 lightDirection, vec3 directionToLightCenterW, float cosHalfAngle, float exponent)
{
    float falloff = 0.0;

    float cosAngle = maxEps(dot(-lightDirection, directionToLightCenterW));
    if (cosAngle >= cosHalfAngle)
    {
        falloff = max(0., pow(cosAngle, exponent));
    }
    
    return falloff;
}

float computeDirectionalLightFalloff_Physical(vec3 lightDirection, vec3 directionToLightCenterW, float cosHalfAngle)
{
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
    float falloff = exp2(dot(vec4(directionToLightCenterW, 1.0), lightDirectionSpreadSG));
    return falloff;
}

float computeDirectionalLightFalloff_GLTF(vec3 lightDirection, vec3 directionToLightCenterW, float lightAngleScale, float lightAngleOffset)
{
    // On the CPU
    // float lightAngleScale = 1.0 f / max (0.001f, ( cosInner - cosOuter ));
    // float lightAngleOffset = -cosOuter * angleScale;

    float cd = dot(-lightDirection, directionToLightCenterW);
    float falloff = saturate(cd * lightAngleScale + lightAngleOffset);
    // smooth the transition
    falloff *= falloff;
    return falloff;
}

float computeDirectionalLightFalloff(vec3 lightDirection, vec3 directionToLightCenterW, float cosHalfAngle, float exponent, float lightAngleScale, float lightAngleOffset)
{
    #ifdef USEPHYSICALLIGHTFALLOFF
        return computeDirectionalLightFalloff_Physical(lightDirection, directionToLightCenterW, cosHalfAngle);
    #elif defined(USEGLTFLIGHTFALLOFF)
        return computeDirectionalLightFalloff_GLTF(lightDirection, directionToLightCenterW, lightAngleScale, lightAngleOffset);
    #else
        return computeDirectionalLightFalloff_Standard(lightDirection, directionToLightCenterW, cosHalfAngle, exponent);
    #endif
}