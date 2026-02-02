// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Portions from https://github.com/sebh/UnrealEngineSkyAtmosphere
// MIT License
//
// Copyright (c) 2020 Epic Games, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

#include<core/intersectionFunctions>

// Common helpers for atmosphere rendering.

// TODO: Port remaining GLSL atmosphereFunctions.fx. Currently this only includes functions for AtmospherePBRMaterialPlugin.
// TODO: Move LUT sizes and ray march related parameters to UBO.

const MultiScatteringLutSize = vec2f(32., 32.);
const MultiScatteringLutDomainInUVSpace = (MultiScatteringLutSize - vec2f(1.)) / MultiScatteringLutSize;
const MultiScatteringLutHalfTexelSize = vec2f(.5) / MultiScatteringLutSize;
const NumAerialPerspectiveLutLayers = 32.;
const AerialPerspectiveLutSize = vec3f(16., 64., NumAerialPerspectiveLutLayers);

const AerialPerspectiveLutKMPerSlice = 4.;
const AerialPerspectiveLutRangeKM = AerialPerspectiveLutKMPerSlice * NumAerialPerspectiveLutLayers;
const TransmittanceSampleCount = 128;

const TransmittanceLutSize = vec2f(256., 64.);
const TransmittanceLutDomainInUVSpace = (TransmittanceLutSize - vec2f(1.)) / TransmittanceLutSize;
const TransmittanceLutHalfTexelSize = vec2f(.5) / TransmittanceLutSize;

// Constants to fade out transmittance as the light goes below the horizon.
const TransmittanceHorizonRange = 2. * TransmittanceLutHalfTexelSize.x;
const TransmittanceMaxUnoccludedU = 1. - .5 * TransmittanceHorizonRange;
const TransmittanceMinOccludedU = 1. + .5 * TransmittanceHorizonRange;

fn uvToUnit(uv: vec2f, domainInUVSpace: vec2f, halfTexelSize: vec2f) -> vec2f {
    return (uv - halfTexelSize) / domainInUVSpace;
}

fn unitToUV(unit: vec2f, domainInUVSpace: vec2f, halfTexelSize: vec2f) -> vec2f {
    return unit * domainInUVSpace + halfTexelSize;
}

fn sphereIntersectNearest(rayOrigin: vec3f, rayDirection: vec3f, sphereRadius: f32) -> f32 {
    let result = sphereIntersectFromOrigin(rayOrigin, rayDirection, sphereRadius);
    let c = dot(rayOrigin, rayOrigin) - sphereRadius * sphereRadius;
    // Ray starts outside, return y; Ray starts inside, return x.
    return select(result.x, result.y, c >= 0.);
}

fn computeRayleighPhase(onePlusCosThetaSq: f32) -> f32 {
    // 3/(16*Pi) * (1 + cosTheta^2)
    return 0.0596831037 * onePlusCosThetaSq;
}

fn computeMiePhaseCornetteShanks(cosTheta: f32, onePlusCosThetaSq: f32) -> f32 {
    const g = .8;
    const gSquared = g * g;
    const oneMinusGSquared = 1. - gSquared;
    const onePlusGSquared = 1. + gSquared;
    const twoPlusGSquared = 2. + gSquared;
    const twoG = 2. * g;
    const threeOverEightPi = 3. / (8. * PI);
    return threeOverEightPi * oneMinusGSquared * onePlusCosThetaSq / (twoPlusGSquared * pow(onePlusGSquared - twoG * cosTheta, 1.5));
}

fn computeOzoneDensity(normalizedViewHeight: f32) -> f32 {
    // Heights are normalized against a 100KM thick atmosphere.
    const MinOzoneDensity = .135;
    const OneMinusMinOzoneDensity = 1. - MinOzoneDensity;
    const OzoneStartHeight = .15; // Ramp up density from here to peak.
    const PeakOzoneHeight = .25;
    const MaxOzoneHeight = .6;
    const InverseRampupDistance = 1. / (PeakOzoneHeight - OzoneStartHeight);
    const InverseRampdownDistance = 1. / (MaxOzoneHeight - PeakOzoneHeight);
    let lowerAtmosphereDensity = MinOzoneDensity + OneMinusMinOzoneDensity * max(0., normalizedViewHeight - OzoneStartHeight) * InverseRampupDistance;
    let sqrtUpperAtmosphereDensity = max(0., 1. - (normalizedViewHeight - PeakOzoneHeight) * InverseRampdownDistance);
    let upperAtmosphereDensity = sqrtUpperAtmosphereDensity * sqrtUpperAtmosphereDensity;
    let densityOzone = select(upperAtmosphereDensity, lowerAtmosphereDensity, normalizedViewHeight < PeakOzoneHeight);
    return densityOzone;
}

fn sampleMediumRGB(
    viewHeight: f32,
    scatteringRayleigh: ptr<function, vec3f>,
    scatteringMie: ptr<function, vec3f>,
    extinction: ptr<function, vec3f>,
    scattering: ptr<function, vec3f>
) {
    let normalizedViewHeight = saturate(viewHeight * atmosphere.inverseAtmosphereThickness);

    let densityMie = exp(-83.333 * normalizedViewHeight);
    let densityRayleigh = exp(-12.5 * normalizedViewHeight);
    let densityOzone = computeOzoneDensity(normalizedViewHeight);

    *scatteringRayleigh = densityRayleigh * atmosphere.peakRayleighScattering;
    *scatteringMie = densityMie * atmosphere.peakMieScattering;
    *scattering = *scatteringMie + *scatteringRayleigh;

    let extinctionRayleigh = *scatteringRayleigh;
    let extinctionMie = densityMie * atmosphere.peakMieExtinction;
    let extinctionOzone = densityOzone * atmosphere.peakOzoneAbsorption;
    *extinction = extinctionRayleigh + extinctionMie + extinctionOzone;
}

fn computeTransmittance(rayOriginGlobal: vec3f, rayDirection: vec3f, tMax: f32, sampleCount: i32) -> vec3f {
    // Simpler version of integrateScatteredRadiance,
    // computing transmittance between origin and a point at tMax distance away along rayDirection.

    var opticalDepth = vec3f(0.);

    var t = 0.;
    let sampleSegmentWeight = tMax / f32(sampleCount);
    const sampleSegmentT = .3;
    for (var s = 0; s < sampleCount; s += 1) {
        let newT = sampleSegmentWeight * (f32(s) + sampleSegmentT);
        let dt = newT - t;
        t = newT;

        var scatteringRayleigh: vec3f;
        var scatteringMie: vec3f;
        var extinction: vec3f;
        var scattering: vec3f;
        let samplePositionGlobal = rayOriginGlobal + t * rayDirection;
        sampleMediumRGB(length(samplePositionGlobal) - atmosphere.planetRadius, &scatteringRayleigh, &scatteringMie, &extinction, &scattering);

        opticalDepth += extinction * dt;
    }

    return exp(-opticalDepth);
}

#if defined(SAMPLE_TRANSMITTANCE_LUT) || !defined(EXCLUDE_RAY_MARCHING_FUNCTIONS)

fn getTransmittanceUV(radius: f32, cosAngleLightToZenith: f32, distanceToHorizon: ptr<function, f32>) -> vec2f {
    let radiusSquared = radius * radius;
    let horizonDistance = sqrtClamped(radiusSquared - atmosphere.planetRadiusSquared);
    *distanceToHorizon = horizonDistance;

    let cosAngleLightToZenithSquared = cosAngleLightToZenith * cosAngleLightToZenith;
    let discriminant = radiusSquared * (cosAngleLightToZenithSquared - 1.) + atmosphere.atmosphereRadiusSquared;
    let distanceToAtmosphereEdge = max(0., -radius * cosAngleLightToZenith + sqrtClamped(discriminant));

    let minDistanceToAtmosphereEdge = max(0., atmosphere.atmosphereRadius - radius);
    let maxDistanceToAtmosphereEdge = horizonDistance + atmosphere.horizonDistanceToAtmosphereEdge;
    let cosAngleLightToZenithCoordinate = (distanceToAtmosphereEdge - minDistanceToAtmosphereEdge) / max(.000001, maxDistanceToAtmosphereEdge - minDistanceToAtmosphereEdge);
    let distanceToHorizonCoordinate = horizonDistance / max(.000001, atmosphere.horizonDistanceToAtmosphereEdge);
    let unit = vec2f(cosAngleLightToZenithCoordinate, distanceToHorizonCoordinate);

    return unit * TransmittanceLutDomainInUVSpace + TransmittanceLutHalfTexelSize; // unitToUV
}

// Gets the transmittance of an external light through the atmosphere to a point described by its radius (from the center of the planet) and the angle of incoming light.
fn sampleTransmittanceLut(transmittanceLut: texture_2d<f32>, positionRadius: f32, cosAngleLightToZenith: f32) -> vec4f {
    var distanceToHorizon = 0.;
    let uv = getTransmittanceUV(positionRadius, cosAngleLightToZenith, &distanceToHorizon);

    // Fade transmittance out as the light goes below the horizon.
    let weight = smoothstep(TransmittanceMinOccludedU, TransmittanceMaxUnoccludedU, uv.x);
    return weight * textureSampleLevel(transmittanceLut, transmittanceLutSampler, uv, 0.);
}

#endif

#ifndef EXCLUDE_RAY_MARCHING_FUNCTIONS

#ifndef COMPUTE_MULTI_SCATTERING
fn sampleMultiScatteringLut(multiScatteringLut: texture_2d<f32>, radius: f32, cosAngleLightToZenith: f32) -> vec3f {
    let unit = vec2f(.5 + .5 * cosAngleLightToZenith, (radius - atmosphere.planetRadius) / atmosphere.atmosphereThickness);
    let uv = unitToUV(unit, MultiScatteringLutDomainInUVSpace, MultiScatteringLutHalfTexelSize);
    let multiScattering = textureSampleLevel(multiScatteringLut, multiScatteringLutSampler, uv, 0.).rgb;

    // Clamp to a minimum radiance. This is done to have a visible sky contribution at night.
    // It could affect sunset/sunrise too though; Can set minMultiScattering to 0 to disable.
    return max(atmosphere.minMultiScattering, multiScattering);
}
#endif

const uniformPhase = RECIPROCAL_PI4;

// Utilizes the transmittance LUT and multiple scattering LUT to compute the radiance and transmittance for a given ray.
fn integrateScatteredRadiance(
    isAerialPerspectiveLut: bool,
    lightIntensityParam: f32,
    transmittanceLut: texture_2d<f32>,
    #ifndef COMPUTE_MULTI_SCATTERING
        multiScatteringLut: texture_2d<f32>,
        multiScatteringIntensityParam: f32,
    #endif
    rayOriginGlobal: vec3f,
    rayDirection: vec3f,
    directionToLightParam: vec3f,
    tMaxMax: f32,
    sampleCount: i32,
    distanceToSurface: f32,
    transmittance: ptr<function, vec3f>
    #if COMPUTE_MULTI_SCATTERING
        , multiScattering: ptr<function, vec3f>
    #endif
) -> vec3f {
    var radiance = vec3f(0.);
    *transmittance = vec3f(1.);
    #if COMPUTE_MULTI_SCATTERING
        *multiScattering = vec3f(0.);
    #endif

    // Compute next intersection with the atmosphere or the planet.
    let tBottom = sphereIntersectNearest(rayOriginGlobal, rayDirection, atmosphere.planetRadius);
    let tTop = sphereIntersectNearest(rayOriginGlobal, rayDirection, atmosphere.atmosphereRadius);
    var tMax = 0.;
    if (tBottom < 0.) {
        if (tTop < 0.) {
            // No intersection with the atmosphere or the planet, so early out.
            return radiance;
        } else {
            // Didn't intersect the planet, but did intersect the atmosphere.
            tMax = tTop;
        }
    } else {
        if (tTop > 0.) {
            // In this case, we have intersected the planet and the atmosphere.
            if (isAerialPerspectiveLut) {
                // When ray marching the aerial perspective LUT, ignoring planet intersection.
                tMax = tTop;
            } else {
                // Otherwise take the closest intersection.
                tMax = min(tBottom, tTop);
            }
        }
    }

    if (distanceToSurface > 0. && distanceToSurface < tMax) {
        tMax = distanceToSurface;
    }

    tMax = min(tMax, tMaxMax);

    #ifndef COMPUTE_MULTI_SCATTERING
        let cosTheta = dot(rayDirection, directionToLightParam);
        let onePlusCosThetaSq = 1. + cosTheta * cosTheta;
        let rayleighPhase = computeRayleighPhase(onePlusCosThetaSq);
        let miePhase = computeMiePhaseCornetteShanks(cosTheta, onePlusCosThetaSq);
    #endif

    let transmittanceScale = select(1., atmosphere.aerialPerspectiveTransmittanceScale, isAerialPerspectiveLut);

    var t = 0.;
    let sampleSegmentWeight = tMax / f32(sampleCount);
    const sampleSegmentT = .3;
    for (var s = 0; s < sampleCount; s += 1) {
        let newT = sampleSegmentWeight * (f32(s) + sampleSegmentT);
        let dt = newT - t;
        t = newT;

        let samplePositionGlobal = rayOriginGlobal + t * rayDirection;
        let sampleRadiusGlobal = length(samplePositionGlobal);
        let sampleGeocentricNormal = samplePositionGlobal / sampleRadiusGlobal;
        let sampleCosAngleLightToZenith = dot(directionToLightParam, sampleGeocentricNormal);

        var scatteringRayleigh: vec3f;
        var scatteringMie: vec3f;
        var extinction: vec3f;
        var scattering: vec3f;
        sampleMediumRGB(sampleRadiusGlobal - atmosphere.planetRadius, &scatteringRayleigh, &scatteringMie, &extinction, &scattering);

        let transmittanceToLight = sampleTransmittanceLut(transmittanceLut, sampleRadiusGlobal, sampleCosAngleLightToZenith).rgb;
        #if COMPUTE_MULTI_SCATTERING
            let phaseTimesScattering = uniformPhase * scattering;
            let S = transmittanceToLight * phaseTimesScattering;
        #else
            let phaseTimesScattering = scatteringMie * miePhase + scatteringRayleigh * rayleighPhase;
            let multiScatteredRadiance = sampleMultiScatteringLut(multiScatteringLut, sampleRadiusGlobal, sampleCosAngleLightToZenith);
            let S = transmittanceScale * transmittanceToLight * phaseTimesScattering + multiScatteringIntensityParam * multiScatteredRadiance * scattering;
        #endif

        let sampleOpticalDepth = extinction * dt;
        let sampleTransmittanceVal = exp(-sampleOpticalDepth);

        let clampedExtinction = max(vec3f(.0000001), extinction);
        let SInt = (S - S * sampleTransmittanceVal) / clampedExtinction;
        radiance += *transmittance * SInt;

        #if COMPUTE_MULTI_SCATTERING
            let MSInt = (scattering - scattering * sampleTransmittanceVal) / clampedExtinction;
            *multiScattering += *transmittance * MSInt;
        #endif

        *transmittance *= sampleTransmittanceVal;
    }

    #if USE_GROUND_ALBEDO
        // Account for the light bounced off the ground when computing multiple scattering.
        if (tMax == tBottom && tBottom > 0.) {
            let planetPos = rayOriginGlobal + tBottom * rayDirection;
            let planetPosRadius = length(planetPos);
            let planetPosGeocentricNormal = planetPos / planetPosRadius;
            let nDotL = dot(directionToLightParam, planetPosGeocentricNormal);
            let lightTransmittance = sampleTransmittanceLut(transmittanceLut, planetPosRadius, nDotL).rgb;
            const diffuseBrdf = RECIPROCAL_PI;
            radiance += lightTransmittance * *transmittance * atmosphere.groundAlbedo * (nDotL * diffuseBrdf);
        }
    #endif

    radiance *= lightIntensityParam;

    return radiance;
}

#endif

fn layerIdxToAerialPerspectiveLayer(layerIdx: f32) -> f32 {
    var layer = (layerIdx + 1.) / NumAerialPerspectiveLutLayers;
    layer *= layer; // squared distribution
    layer *= NumAerialPerspectiveLutLayers;
    return layer;
}

fn toAerialPerspectiveDepth(layer: f32) -> f32 {
    return layer * AerialPerspectiveLutKMPerSlice;
}

fn toAerialPerspectiveLayer(distance: f32, aerialPerspectiveLutDistancePerSlice: f32) -> f32 {
    return distance / aerialPerspectiveLutDistancePerSlice;
}

fn applyAerialPerspectiveSaturation(aerialPerspective: vec4f) -> vec4f {
    let previousRadiance = getLuminance(aerialPerspective.rgb);
    let mixed = mix(vec3f(previousRadiance), aerialPerspective.rgb, atmosphere.aerialPerspectiveSaturation);
    return vec4f(mixed, aerialPerspective.a);
}

fn applyAerialPerspectiveIntensity(aerialPerspective: vec4f) -> vec4f {
    var result = aerialPerspective;
    #if APPLY_AERIAL_PERSPECTIVE_INTENSITY
        if (atmosphere.aerialPerspectiveIntensity == 0.) {
            result = vec4f(0.);
        } else {
            let previousAlpha = result.a;
            result = result / max(.00001, previousAlpha);
            result = result * pow(previousAlpha, 1. / atmosphere.aerialPerspectiveIntensity);
        }
    #endif
    return result;
}

fn applyAerialPerspectiveRadianceBias(aerialPerspective: vec4f) -> vec4f {
    var result = aerialPerspective;
    #if APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS
        let originalRadiance = dot(result.rgb, LuminanceEncodeApprox);
        let targetRadiance = originalRadiance + atmosphere.aerialPerspectiveRadianceBias;

        if (originalRadiance > 0.) {
            result = result * max(0., targetRadiance / originalRadiance);
        } else {
            result = max(vec4f(0.), vec4f(atmosphere.aerialPerspectiveRadianceBias));
        }

        result.a = min(result.a, 1.);
    #endif
    return result;
}

// Samples the aerial perspective LUT at the specified distance from the camera.
// Assumes aerialPerspectiveLut has been declared.
fn sampleAerialPerspectiveLut(
    screenUV: vec2f,
    clampToLutRange: bool,
    distanceFromCamera: f32,
    numAerialPerspectiveLutLayers: f32,
    aerialPerspectiveLutKMPerSlice: f32,
    aerialPerspectiveLutRangeKM: f32,
    aerialPerspective: ptr<function, vec4f>
) -> bool {

    *aerialPerspective = vec4f(0.);

#if USE_AERIAL_PERSPECTIVE_LUT
    if (distanceFromCamera > 0. &&
        (clampToLutRange || distanceFromCamera < aerialPerspectiveLutRangeKM) &&
        atmosphere.clampedCameraRadius <= atmosphere.atmosphereRadius) {

        var layer = toAerialPerspectiveLayer(distanceFromCamera, aerialPerspectiveLutKMPerSlice);
        let normalizedLayer = sqrt(layer / numAerialPerspectiveLutLayers); // squared distribution
        layer = min(normalizedLayer * numAerialPerspectiveLutLayers, numAerialPerspectiveLutLayers);

        // Fade out nearest layer to 0.
        let weight = min(layer, 1.);

        // Interpolate aerial perspective from the two adjacent texture layers.
        let layerIdx = max(0., layer - 1.);
        let floorLayerIdx = floor(layerIdx);
        let aerialPerspectiveLayer0 = textureSampleLevel(aerialPerspectiveLut, aerialPerspectiveLutSampler, screenUV, i32(floorLayerIdx), 0.);
        let aerialPerspectiveLayer1 = textureSampleLevel(aerialPerspectiveLut, aerialPerspectiveLutSampler, screenUV, i32(floorLayerIdx + 1.), 0.);
        var interpolated = mix(aerialPerspectiveLayer0, aerialPerspectiveLayer1, layerIdx - floorLayerIdx);

        interpolated = vec4f(interpolated.rgb * atmosphere.atmosphereExposure, interpolated.a);
        interpolated = applyAerialPerspectiveSaturation(interpolated);
        interpolated = weight * applyAerialPerspectiveIntensity(interpolated);
        interpolated = applyAerialPerspectiveRadianceBias(interpolated);

        *aerialPerspective = interpolated;
        return true;
    }
#endif

    return false;
}

#if RENDER_TRANSMITTANCE

fn getTransmittanceParameters(uv: vec2f, radius: ptr<function, f32>, cosAngleLightToZenith: ptr<function, f32>, distanceToAtmosphereEdge: ptr<function, f32>) {
    let unit = uvToUnit(uv, TransmittanceLutDomainInUVSpace, TransmittanceLutHalfTexelSize);

    // Compute the position's radius from center of planet.
    let distanceToHorizon = unit.y * atmosphere.horizonDistanceToAtmosphereEdge;
    let distanceToHorizonSquared = distanceToHorizon * distanceToHorizon;
    *radius = sqrtClamped(distanceToHorizonSquared + atmosphere.planetRadiusSquared);

    // Compute the distance to the atmosphere edge from the position towards the light.
    let minDistanceToAtmosphereEdge = atmosphere.atmosphereRadius - *radius;
    let maxDistanceToAtmosphereEdge = distanceToHorizon + atmosphere.horizonDistanceToAtmosphereEdge;
    *distanceToAtmosphereEdge = minDistanceToAtmosphereEdge + unit.x * (maxDistanceToAtmosphereEdge - minDistanceToAtmosphereEdge);
    let distanceToAtmosphereEdgeSquared = *distanceToAtmosphereEdge * *distanceToAtmosphereEdge;

    // Compute cosine of the zenith angle to the light for this position.
    *cosAngleLightToZenith = select(
        (atmosphere.horizonDistanceToAtmosphereEdgeSquared - distanceToAtmosphereEdgeSquared - distanceToHorizonSquared) / (2. * *radius * *distanceToAtmosphereEdge),
        1.,
        *distanceToAtmosphereEdge <= 0.
    );
    *cosAngleLightToZenith = clamp(*cosAngleLightToZenith, -1., 1.);
}

fn renderTransmittance(uv: vec2f) -> vec4f {
    var radius: f32;
    var cosAngleLightToZenith: f32;
    var distanceToAtmosphereEdgeAlongAngle: f32;
    getTransmittanceParameters(uv, &radius, &cosAngleLightToZenith, &distanceToAtmosphereEdgeAlongAngle);

    let sinAngleLightToZenith = sqrtClamped(1. - cosAngleLightToZenith * cosAngleLightToZenith);
    let directionToLight = normalize(vec3f(0., cosAngleLightToZenith, sinAngleLightToZenith));

    let transmittance = computeTransmittance(vec3f(0., radius, 0.), directionToLight, distanceToAtmosphereEdgeAlongAngle, TransmittanceSampleCount);
    return vec4f(transmittance, avg(transmittance));
}

#endif

#if RENDER_MULTI_SCATTERING

fn getSphereSample(azimuth: f32, inclination: f32, sinInclination: ptr<function, f32>) -> vec3f {
    *sinInclination = sin(inclination);
    return vec3f(*sinInclination * sin(azimuth), cos(inclination), *sinInclination * cos(azimuth));
}

// TODO: Uniforms.
const MultiScatteringInclinationSampleCount = 8.;
const MultiScatteringAzimuthSampleCount = 2. * MultiScatteringInclinationSampleCount;
const MultiScatteringSampleCount = 64;
const MultiScatteringAzimuthIterationAngle = TWO_PI / MultiScatteringAzimuthSampleCount;
const MultiScatteringInclinationIterationAngle = PI / MultiScatteringInclinationSampleCount;
const MultiScatteringAngleStepProduct = MultiScatteringAzimuthIterationAngle * MultiScatteringInclinationIterationAngle;

fn renderMultiScattering(uv: vec2f, transmittanceLut: texture_2d<f32>) -> vec4f {
    let unit = uvToUnit(uv, MultiScatteringLutDomainInUVSpace, MultiScatteringLutHalfTexelSize);

    let cosAngleLightToZenith = 2. * unit.x - 1.;
    let sinAngleLightToZenith = sqrtClamped(1. - cosAngleLightToZenith * cosAngleLightToZenith);
    let directionToLightLocal = normalize(vec3f(0., cosAngleLightToZenith, sinAngleLightToZenith));

    let rayOriginRadius = atmosphere.planetRadius + max(unit.y, .001) * atmosphere.atmosphereThickness;
    let rayOrigin = vec3f(0., rayOriginRadius, 0.);

    var inscattered = vec3f(0.);
    var multiScatteringTotal = vec3f(0.);

    for (var i = .5; i < MultiScatteringAzimuthSampleCount; i += 1.) {
        let azimuth = MultiScatteringAzimuthIterationAngle * i;
        for (var j = .5; j < MultiScatteringInclinationSampleCount; j += 1.) {
            let inclination = MultiScatteringInclinationIterationAngle * j;
            var sinInclination: f32;
            let rayDirection = getSphereSample(azimuth, inclination, &sinInclination);

            var transmittanceVal: vec3f;
            var multiScatteringVal: vec3f;
            let radianceVal = integrateScatteredRadiance(
                false, // isAerialPerspectiveLut
                1., // No light intensity; it will be applied in downstream LUTs (AerialPerspective, SkyView, and DiffuseSkyIrradiance).
                transmittanceLut,
                rayOrigin,
                rayDirection,
                directionToLightLocal,
                100000000.,
                MultiScatteringSampleCount,
                -1., // No planet hit.
                &transmittanceVal,
                &multiScatteringVal);

            let weight = RECIPROCAL_PI4 * abs(sinInclination) * MultiScatteringAngleStepProduct;
            multiScatteringTotal += multiScatteringVal * weight;
            inscattered += radianceVal * weight;
        }
    }

    let multiScatteringResult = inscattered / max(vec3f(.000001), vec3f(1.) - multiScatteringTotal);

    return vec4f(multiScatteringResult, 1.);
}

#endif
