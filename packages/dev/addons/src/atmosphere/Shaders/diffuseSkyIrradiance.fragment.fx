// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

precision highp float;

const float DiffuseSkyIrradianceLutSampleCount = 32.0;

#include<__decl__atmosphereFragment>

uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;

#include<core/helperFunctions>
#include<depthFunctions>
#include<atmosphereFunctions>

vec3 integrateForIrradiance(vec3 directionToLight, vec3 rayDirection, vec3 rayOrigin) {
    vec3 transmittance;
    vec3 radiance = integrateScatteredRadiance(
        false, // isAerialPerspectiveLut
        1.,
        transmittanceLut,
        multiScatteringLut,
        multiScatteringIntensity,
        rayOrigin,
        // Since the filtering assumes z-up and the atmosphere uses y-up, swap y and z.
        rayDirection.xzy,
        directionToLight.xzy,
        100000000.,
        DiffuseSkyIrradianceLutSampleCount,
        -1., // No planet hit.
        transmittance);
    return radiance;
}

#include<core/importanceSampling>
#include<core/pbrBRDFFunctions>
#include<core/hdrFilteringFunctions>

varying vec2 uv;

void main() {

    vec2 unit = uvToUnit(uv, DiffuseSkyIrradianceLutDomainInUVSpace, DiffuseSkyIrradianceLutHalfTexelSize);

    float cosLightInclination = 2. * unit.x - 1.;
    float sinLightInclination = sqrtClamped(1. - cosLightInclination * cosLightInclination);
    vec3 directionToLight = normalize(vec3(0., cosLightInclination, sinLightInclination));
    float radius = max(planetRadiusWithOffset, unit.y * atmosphereThickness + planetRadius);
    vec3 swappedDirectionToLight = vec3(directionToLight.x, directionToLight.z, directionToLight.y); // the irradiance function expects z-up.
    vec3 irradiance = PI * irradiance(
        swappedDirectionToLight,
        vec2(radius, 0.),
        1.,
        vec3(1.),
        vec3(1.));

    // Apply desaturation factor.
    float averageIrradiance = getLuminance(irradiance);
    vec3 newIrradiance = mix(irradiance, vec3(averageIrradiance), diffuseSkyIrradianceDesaturationFactor);
    float newIrradianceScale = getLuminance(newIrradiance);
    float rescaling = averageIrradiance / max(0.000001, newIrradianceScale);
    irradiance = newIrradiance * rescaling;

    gl_FragColor = vec4(irradiance, 1.);

}