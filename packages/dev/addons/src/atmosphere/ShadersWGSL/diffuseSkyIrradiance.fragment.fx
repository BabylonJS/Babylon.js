// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const DiffuseSkyIrradianceLutSampleCount = 32;

#include<atmosphereUboDeclaration>

var transmittanceLutSampler: sampler;
var transmittanceLut: texture_2d<f32>;
var multiScatteringLutSampler: sampler;
var multiScatteringLut: texture_2d<f32>;

#include<core/helperFunctions>
#include<atmosphereFunctions>

fn integrateForIrradiance(directionToLightParam: vec3f, rayDirection: vec3f, rayOrigin: vec3f) -> vec3f {
    var transmittance: vec3f;
    let radiance = integrateScatteredRadiance(
        false, // isAerialPerspectiveLut
        1.,
        transmittanceLut,
        multiScatteringLut,
        atmosphere.multiScatteringIntensity,
        rayOrigin,
        // Since the filtering assumes z-up and the atmosphere uses y-up, swap y and z.
        rayDirection.xzy,
        directionToLightParam.xzy,
        100000000.,
        DiffuseSkyIrradianceLutSampleCount,
        -1., // No planet hit.
        &transmittance);
    return radiance;
}

#include<core/importanceSampling>
#include<core/pbrBRDFFunctions>
#include<core/hdrFilteringFunctions>

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let unit = uvToUnit(input.vUV, DiffuseSkyIrradianceLutDomainInUVSpace, DiffuseSkyIrradianceLutHalfTexelSize);

    let cosLightInclination = 2. * unit.x - 1.;
    let sinLightInclination = sqrtClamped(1. - cosLightInclination * cosLightInclination);
    let directionToLight = normalize(vec3f(0., cosLightInclination, sinLightInclination));
    let radius = max(atmosphere.planetRadiusWithOffset, unit.y * atmosphere.atmosphereThickness + atmosphere.planetRadius);
    let swappedDirectionToLight = vec3f(directionToLight.x, directionToLight.z, directionToLight.y); // the irradiance function expects z-up.
    var irradianceResult = PI * irradiance(
        swappedDirectionToLight,
        vec2f(radius, 0.),
        1.,
        vec3f(1.),
        vec3f(1.));

    // Apply desaturation factor.
    let averageIrradiance = getLuminance(irradianceResult);
    let newIrradiance = mix(irradianceResult, vec3f(averageIrradiance), atmosphere.diffuseSkyIrradianceDesaturationFactor);
    let newIrradianceScale = getLuminance(newIrradiance);
    let rescaling = averageIrradiance / max(0.000001, newIrradianceScale);
    irradianceResult = newIrradiance * rescaling;

    fragmentOutputs.color = vec4f(irradianceResult, 1.);
}
