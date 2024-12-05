fn computeDistanceLightFalloff_Standard(lightOffset: vec3f, range: f32) -> f32
{
    return max(0., 1.0 - length(lightOffset) / range);
}

fn computeDistanceLightFalloff_Physical(lightDistanceSquared: f32) -> f32
{
    return 1.0 / maxEps(lightDistanceSquared);
}

fn computeDistanceLightFalloff_GLTF(lightDistanceSquared: f32, inverseSquaredRange: f32) -> f32
{
    var lightDistanceFalloff: f32 = 1.0 / maxEps(lightDistanceSquared);

    var factor: f32 = lightDistanceSquared * inverseSquaredRange;
    var attenuation: f32 = saturate(1.0 - factor * factor);
    attenuation *= attenuation;

    // Smooth attenuation of the falloff defined by the range.
    lightDistanceFalloff *= attenuation;
    
    return lightDistanceFalloff;
}

fn computeDirectionalLightFalloff_IES(lightDirection: vec3f, directionToLightCenterW: vec3f, iesLightTexture: texture_2d<f32>, iesLightTextureSampler: sampler) -> f32
{
    var cosAngle: f32 = dot(-lightDirection, directionToLightCenterW);
	var angle = acos(cosAngle) / PI;
	return textureSampleLevel(iesLightTexture, iesLightTextureSampler, vec2f(angle, 0), 0.).r;
}

fn computeDistanceLightFalloff(lightOffset: vec3f, lightDistanceSquared: f32, range: f32, inverseSquaredRange: f32) -> f32
{
    #ifdef USEPHYSICALLIGHTFALLOFF
        return computeDistanceLightFalloff_Physical(lightDistanceSquared);
    #elif defined(USEGLTFLIGHTFALLOFF)
        return computeDistanceLightFalloff_GLTF(lightDistanceSquared, inverseSquaredRange);
    #else
        return computeDistanceLightFalloff_Standard(lightOffset, range);
    #endif
}

fn computeDirectionalLightFalloff_Standard(lightDirection: vec3f, directionToLightCenterW: vec3f, cosHalfAngle: f32, exponent: f32) -> f32
{
    var falloff: f32 = 0.0;

    var cosAngle: f32 = maxEps(dot(-lightDirection, directionToLightCenterW));
    if (cosAngle >= cosHalfAngle)
    {
        falloff = max(0., pow(cosAngle, exponent));
    }
    
    return falloff;
}

fn computeDirectionalLightFalloff_Physical(lightDirection: vec3f, directionToLightCenterW: vec3f, cosHalfAngle: f32) -> f32
{
    const kMinusLog2ConeAngleIntensityRatio: f32 = 6.64385618977; // -log2(0.01)

    // Calculate a Spherical Gaussian (von Mises-Fisher distribution, not angle-based Gaussian) such that the peak is in the light direction,
    // and the value at the nominal cone angle is 1% of the peak. Because we want the distribution to decay from unity (100%)
    // at the peak direction (dot product = 1) down to 1% at the nominal cone cutoff (dot product = cosAngle) 
    // the falloff rate expressed in terms of the base-two dot product is therefore -log2(ConeAngleIntensityRatio) / (1.0 - cosAngle).
    // Note that the distribution is unnormalised in that peak density is unity, rather than the total energy is unity.
    var concentrationKappa: f32 = kMinusLog2ConeAngleIntensityRatio / (1.0 - cosHalfAngle);

    // Evaluate spherical gaussian for light directional falloff for spot light type (note: spot directional falloff; 
    // not directional light type)
    var lightDirectionSpreadSG: vec4f =  vec4f(-lightDirection * concentrationKappa, -concentrationKappa);
    var falloff: f32 = exp2(dot( vec4f(directionToLightCenterW, 1.0), lightDirectionSpreadSG));
    return falloff;
}

fn computeDirectionalLightFalloff_GLTF(lightDirection: vec3f, directionToLightCenterW: vec3f, lightAngleScale: f32, lightAngleOffset: f32) -> f32
{
    // On the CPU
    // var lightAngleScale: f32 = 1.0 f / max (0.001f, ( cosInner - cosOuter ));
    // var lightAngleOffset: f32 = -cosOuter * angleScale;

    var cd: f32 = dot(-lightDirection, directionToLightCenterW);
    var falloff: f32 = saturate(cd * lightAngleScale + lightAngleOffset);
    // smooth the transition
    falloff *= falloff;
    return falloff;
}

fn computeDirectionalLightFalloff(lightDirection: vec3f, directionToLightCenterW: vec3f, cosHalfAngle: f32, exponent: f32, lightAngleScale: f32, lightAngleOffset: f32) -> f32
{
    #ifdef USEPHYSICALLIGHTFALLOFF
        return computeDirectionalLightFalloff_Physical(lightDirection, directionToLightCenterW, cosHalfAngle);
    #elif defined(USEGLTFLIGHTFALLOFF)
        return computeDirectionalLightFalloff_GLTF(lightDirection, directionToLightCenterW, lightAngleScale, lightAngleOffset);
    #else
        return computeDirectionalLightFalloff_Standard(lightDirection, directionToLightCenterW, cosHalfAngle, exponent);
    #endif
}