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
// TODO: Move LUT sizes and ray march related parameters to UBO.

const vec2 MultiScatteringLutSize = vec2(32.0, 32.0);
const vec2 MultiScatteringLutDomainInUVSpace = (MultiScatteringLutSize - vec2(1.0)) / MultiScatteringLutSize;
const vec2 MultiScatteringLutHalfTexelSize = vec2(0.5) / MultiScatteringLutSize;
const float NumAerialPerspectiveLutLayers = 32.0;
const vec3 AerialPerspectiveLutSize = vec3(16.0, 64.0, NumAerialPerspectiveLutLayers);
const vec2 DiffuseSkyIrradianceLutSize = vec2(64.0, 16.0);
const vec2 DiffuseSkyIrradianceLutDomainInUVSpace = (DiffuseSkyIrradianceLutSize - vec2(1.0)) / DiffuseSkyIrradianceLutSize;
const vec2 DiffuseSkyIrradianceLutHalfTexelSize = vec2(0.5) / DiffuseSkyIrradianceLutSize;
const vec2 SkyViewLutSize = vec2(128.0, 128.0);
const vec2 SkyViewLutDomainInUVSpace = (SkyViewLutSize - vec2(1.0)) / SkyViewLutSize;
const vec2 SkyViewLutHalfTexelSize = vec2(0.5) / SkyViewLutSize;

const float AerialPerspectiveLutKMPerSlice = 4.0;
const float AerialPerspectiveLutRangeKM = AerialPerspectiveLutKMPerSlice * NumAerialPerspectiveLutLayers;
const float TransmittanceSampleCount = 128.0;
const float SkyViewLutSampleCount = 30.0;

const vec2 TransmittanceLutSize = vec2(256., 64.);
const vec2 TransmittanceLutDomainInUVSpace = (TransmittanceLutSize - vec2(1.)) / TransmittanceLutSize;
const vec2 TransmittanceLutHalfTexelSize = vec2(0.5) / TransmittanceLutSize;

// Constants to fade out transmittance as the light goes below the horizon.
const float TransmittanceHorizonRange = 2. * TransmittanceLutHalfTexelSize.x;
const float TransmittanceMaxUnoccludedU = 1. - 0.5 * TransmittanceHorizonRange;
const float TransmittanceMinOccludedU = 1. + 0.5 * TransmittanceHorizonRange;

vec2 uvToUnit(vec2 uv, vec2 domainInUVSpace, vec2 halfTexelSize) {
    return (uv - halfTexelSize) / domainInUVSpace;
}

vec2 unitToUV(vec2 unit, vec2 domainInUVSpace, vec2 halfTexelSize) {
    return unit * domainInUVSpace + halfTexelSize;
}

float sphereIntersectNearest(vec3 rayOrigin, vec3 rayDirection, float sphereRadius) {

    vec2 result = sphereIntersectFromOrigin(rayOrigin, rayDirection, sphereRadius);

    float c = dot(rayOrigin, rayOrigin) - sphereRadius * sphereRadius;
    return c >= 0.0 ?
        // Ray starts outside, return y.
        result.y :
        // Ray starts inside, return x.
        result.x;

}

void moveToTopAtmosphere(
    vec3 cameraPosition,
    float positionRadius,
    vec3 positionGeocentricNormal,
    vec3 rayDirection,
    out bool intersectsAtmosphere,
    out vec3 cameraPositionClampedToTopOfAtmosphere) {

    intersectsAtmosphere = true;
    cameraPositionClampedToTopOfAtmosphere = cameraPosition;

    if (positionRadius > atmosphereRadius) {

        float tTop = sphereIntersectNearest(cameraPosition, rayDirection, atmosphereRadius);
        if (tTop >= 0.0) {

            vec3 upOffset = -planetRadiusOffset * positionGeocentricNormal;
            cameraPositionClampedToTopOfAtmosphere = cameraPosition + rayDirection * tTop + upOffset;

        } else {

            intersectsAtmosphere = false;

        }
    }
    // else, position is inside the atmosphere.

}

void getSkyViewUVFromParameters(
    bool intersectsGround,
    float cosHorizonAngleFromZenith,
    float cosAngleBetweenViewAndZenith,
    float cosAngleBetweenViewAndLightOnPlane,
    out vec2 uv)
{

    // The sky view LUT is split into two halves, one half for the sky and one half for the ground.
    // v = 0 is nadir, v = 0.5 is horizon, v = 1 is zenith.

    vec2 unit = vec2(0.);
    if (intersectsGround) {

        float coord = (cosAngleBetweenViewAndZenith + 1.) / (cosHorizonAngleFromZenith + 1.);
        coord = sqrtClamped(coord); // more precision at nadir
        unit.y = 0.5 * coord; // 0 is nadir, 0.5 is horizon

    } else {

        float coord = (cosAngleBetweenViewAndZenith - cosHorizonAngleFromZenith) / (1. - cosHorizonAngleFromZenith);
        coord = sqrtClamped(coord); // more precision at horizon, less at zenith.
        unit.y = 0.5 * coord + 0.5; // 0.5 is horizon, 1 is zenith
    }

    {
        float coord = 0.5 - 0.5 * cosAngleBetweenViewAndLightOnPlane;
        unit.x = coord;
    }

    // Constrain UVs to valid sub texel range (avoiding zenith derivative issue making LUT usage visible)
    uv = unitToUV(unit, SkyViewLutDomainInUVSpace, SkyViewLutHalfTexelSize);

}

#if USE_SKY_VIEW_LUT && SAMPLE_SKY_VIEW_LUT

#define inline
vec4 sampleSkyViewLut(
    sampler2D skyViewLut,
    float positionRadius,
    vec3 geocentricNormal,
    vec3 rayDirection,
    vec3 directionToLight,
    float cosHorizonAngleFromZenith,
    out float cosAngleBetweenViewAndZenith,
    out bool isRayIntersectingGround) {

    cosAngleBetweenViewAndZenith = dot(rayDirection, geocentricNormal);

    // If the ray doesn't intersect the atmosphere, early out.
    if (positionRadius > atmosphereRadius) {
        float sinAngleBetweenViewAndNadir = sqrtClamped(1. - cosAngleBetweenViewAndZenith * cosAngleBetweenViewAndZenith);
        if (sinAngleBetweenViewAndNadir > sinCameraAtmosphereHorizonAngleFromNadir) {
            isRayIntersectingGround = false;
            return vec4(0.);
        }
    }

    vec3 sideVector = normalize(cross(geocentricNormal, rayDirection));
    vec3 forwardVector = normalize(cross(sideVector, geocentricNormal));
    vec2 lightOnPlane = normalize(vec2(dot(directionToLight, forwardVector), dot(directionToLight, sideVector)));
    float cosAngleBetweenViewAndLightOnPlane = lightOnPlane.x;

    // Only considering ground intersections that start from rays above the planet's surface.
    // When inside the atmosphere, adds a factor to avoid seeing the seam between the sky and ground.
    float rayIntersectionScale = mix(0.95, 1., saturate((positionRadius - planetRadius) / atmosphereThickness));
    isRayIntersectingGround =
        positionRadius > planetRadius &&
        (rayIntersectionScale * cosAngleBetweenViewAndZenith) <= cosHorizonAngleFromZenith;

    vec2 uv;
    getSkyViewUVFromParameters(
        isRayIntersectingGround,
        cosHorizonAngleFromZenith,
        cosAngleBetweenViewAndZenith,
        cosAngleBetweenViewAndLightOnPlane,
        uv);

    return textureLod(skyViewLut, uv, 0.);

}

#endif

float computeRayleighPhase(float onePlusCosThetaSq) {
    // 3/(16*Pi) * (1 + cosTheta^2)
    return 0.0596831037 * onePlusCosThetaSq;
}

float computeMiePhaseCornetteShanks(float cosTheta, float onePlusCosThetaSq) {

    const float g = 0.8;
    const float gSquared = g * g;
    const float oneMinusGSquared = 1. - gSquared;
    const float onePlusGSquared = 1. + gSquared;
    const float twoPlusGSquared = 2. + gSquared;
    const float twoG = 2. * g;
    const float threeOverEightPi = 3. / (8. * PI);

    return threeOverEightPi * oneMinusGSquared * onePlusCosThetaSq / (twoPlusGSquared * pow(onePlusGSquared - twoG * cosTheta, 1.5));

}

float computeOzoneDensity(float normalizedViewHeight) {
    // Heights are normalized against a 100KM thick atmosphere.
    const float MinOzoneDensity = 0.135;
    const float OneMinusMinOzoneDensity = 1. - MinOzoneDensity;
    const float OzoneStartHeight = .15; // Ramp up density from here to peak.
    const float PeakOzoneHeight = .25;
    const float MaxOzoneHeight = 0.6;
    const float InverseRampupDistance = 1. / (PeakOzoneHeight - OzoneStartHeight);
    const float InverseRampdownDistance = 1. / (MaxOzoneHeight - PeakOzoneHeight);
    float lowerAtmosphereDensity = MinOzoneDensity + OneMinusMinOzoneDensity * max(0., normalizedViewHeight - OzoneStartHeight) * InverseRampupDistance;
    float sqrtUpperAtmosphereDensity = max(0., 1. - (normalizedViewHeight - PeakOzoneHeight) * InverseRampdownDistance);
    float upperAtmosphereDensity = sqrtUpperAtmosphereDensity * sqrtUpperAtmosphereDensity;
    float densityOzone = normalizedViewHeight < PeakOzoneHeight ? lowerAtmosphereDensity : upperAtmosphereDensity;
    return densityOzone;
}

void sampleMediumRGB(
    float viewHeight,
    out vec3 scatteringRayleigh,
    out vec3 scatteringMie,
    out vec3 extinction,
    out vec3 scattering) {

    float normalizedViewHeight = saturate(viewHeight * inverseAtmosphereThickness);

    float densityMie = exp(-83.333 * normalizedViewHeight);
    float densityRayleigh = exp(-12.5 * normalizedViewHeight);
    float densityOzone = computeOzoneDensity(normalizedViewHeight);

    scatteringRayleigh = densityRayleigh * peakRayleighScattering;
    scatteringMie = densityMie * peakMieScattering;
    scattering = scatteringMie + scatteringRayleigh;

    vec3 extinctionRayleigh = scatteringRayleigh;
    vec3 extinctionMie = densityMie * peakMieExtinction;
    vec3 extinctionOzone = densityOzone * peakOzoneAbsorption;
    extinction = extinctionRayleigh + extinctionMie + extinctionOzone;

}

vec3 computeTransmittance(vec3 rayOriginGlobal, vec3 rayDirection, float tMax, float sampleCount) {

    // Simpler version of integrateScatteredRadiance,
    // computing transmittance between origin and a point at tMax distance away along rayDirection.

    vec3 opticalDepth = vec3(0.);

    float t = 0.;
    float sampleSegmentWeight = tMax / sampleCount;
    const float sampleSegmentT = 0.3;
    for (float s = 0.; s < sampleCount; s += 1.) {

        float newT = sampleSegmentWeight * (s + sampleSegmentT);
        float dt = newT - t;
        t = newT;

        vec3 scatteringRayleigh, scatteringMie, extinction, scattering;
        vec3 samplePositionGlobal = rayOriginGlobal + t * rayDirection;
        sampleMediumRGB(length(samplePositionGlobal) - planetRadius, scatteringRayleigh, scatteringMie, extinction, scattering);

        opticalDepth += extinction * dt;

    }

    return exp(-opticalDepth);

}

#if defined(SAMPLE_TRANSMITTANCE_LUT) || !defined(EXCLUDE_RAY_MARCHING_FUNCTIONS)

vec2 getTransmittanceUV(float radius, float cosAngleLightToZenith, out float distanceToHorizon) {

    float radiusSquared = radius * radius;
    distanceToHorizon = sqrtClamped(radiusSquared - planetRadiusSquared);

    float cosAngleLightToZenithSquared = cosAngleLightToZenith * cosAngleLightToZenith;
    float discriminant = radiusSquared * (cosAngleLightToZenithSquared - 1.) + atmosphereRadiusSquared;
    float distanceToAtmosphereEdge = max(0., -radius * cosAngleLightToZenith + sqrtClamped(discriminant));

    float minDistanceToAtmosphereEdge = max(0., atmosphereRadius - radius);
    float maxDistanceToAtmosphereEdge = distanceToHorizon + horizonDistanceToAtmosphereEdge;
    float cosAngleLightToZenithCoordinate = (distanceToAtmosphereEdge - minDistanceToAtmosphereEdge) / max(0.000001, maxDistanceToAtmosphereEdge - minDistanceToAtmosphereEdge);
    float distanceToHorizonCoordinate = distanceToHorizon / max(0.000001, horizonDistanceToAtmosphereEdge);
    vec2 unit = vec2(cosAngleLightToZenithCoordinate, distanceToHorizonCoordinate);

    return unit * TransmittanceLutDomainInUVSpace + TransmittanceLutHalfTexelSize; // unitToUV

}

// Gets the transmittance of an external light through the atmosphere to a point described by its radius (from the center of the planet) and the angle of incoming light.
#define inline
vec4 sampleTransmittanceLut(sampler2D transmittanceLut, float positionRadius, float cosAngleLightToZenith) {

    float distanceToHorizon;
    vec2 uv = getTransmittanceUV(positionRadius, cosAngleLightToZenith, distanceToHorizon);

    // Fade transmittance out as the light goes below the horizon.
    float weight = smoothstep(TransmittanceMinOccludedU, TransmittanceMaxUnoccludedU, uv.x);
    return weight * textureLod(transmittanceLut, uv, 0.);

}

#endif

#ifndef EXCLUDE_RAY_MARCHING_FUNCTIONS

#ifndef COMPUTE_MULTI_SCATTERING
#define inline
vec3 sampleMultiScatteringLut(sampler2D multiScatteringLut, float radius, float cosAngleLightToZenith) {

    vec2 unit = vec2(0.5 + 0.5 * cosAngleLightToZenith, (radius - planetRadius) / atmosphereThickness);
    vec2 uv = unitToUV(unit, MultiScatteringLutDomainInUVSpace, MultiScatteringLutHalfTexelSize);
    vec3 multiScattering = textureLod(multiScatteringLut, uv, 0.).rgb;

    // Clamp to a minimum radiance. This is done to have a visible sky contribution at night.
    // It could affect sunset/sunrise too though; Can set minMultiScattering to 0 to disable.
    return max(minMultiScattering, multiScattering);

}
#endif

const float uniformPhase = RECIPROCAL_PI4;

// Utilizes the transmittance LUT and multiple scattering LUT to compute the radiance and transmittance for a given ray.
#define inline
vec3 integrateScatteredRadiance(
    bool isAerialPerspectiveLut,
    float lightIntensity,
    sampler2D transmittanceLut,
    #ifndef COMPUTE_MULTI_SCATTERING
        sampler2D multiScatteringLut,
        float multiScatteringIntensity,
    #endif
    vec3 rayOriginGlobal,
    vec3 rayDirection,
    vec3 directionToLight,
    float tMaxMax,
    float sampleCount,
    float distanceToSurface,
    out vec3 transmittance
    #if COMPUTE_MULTI_SCATTERING
        , out vec3 multiScattering
    #endif
    ) {

    vec3 radiance = vec3(0.);
    transmittance = vec3(1.);
    #if COMPUTE_MULTI_SCATTERING
        multiScattering = vec3(0.);
    #endif

    // Compute next intersection with the atmosphere or the planet.
    float tBottom = sphereIntersectNearest(rayOriginGlobal, rayDirection, planetRadius);
    float tTop = sphereIntersectNearest(rayOriginGlobal, rayDirection, atmosphereRadius);
    float tMax = 0.;
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
        float cosTheta = dot(rayDirection, directionToLight);
        float onePlusCosThetaSq = 1. + cosTheta * cosTheta;
        float rayleighPhase = computeRayleighPhase(onePlusCosThetaSq);
        float miePhase = computeMiePhaseCornetteShanks(cosTheta, onePlusCosThetaSq);
    #endif

    float transmittanceScale = isAerialPerspectiveLut ? aerialPerspectiveTransmittanceScale : 1.;

    float t = 0.;
    float sampleSegmentWeight = tMax / sampleCount;
    const float sampleSegmentT = 0.3;
    for (float s = 0.; s < sampleCount; s += 1.) {

        float newT = sampleSegmentWeight * (s + sampleSegmentT);
        float dt = newT - t;
        t = newT;

        vec3 samplePositionGlobal = rayOriginGlobal + t * rayDirection;
        float sampleRadiusGlobal = length(samplePositionGlobal);
        vec3 sampleGeocentricNormal = samplePositionGlobal / sampleRadiusGlobal;
        float sampleCosAngleLightToZenith = dot(directionToLight, sampleGeocentricNormal);

        vec3 scatteringRayleigh, scatteringMie, extinction, scattering;
        sampleMediumRGB(sampleRadiusGlobal - planetRadius, scatteringRayleigh, scatteringMie, extinction, scattering);

        vec3 transmittanceToLight = sampleTransmittanceLut(transmittanceLut, sampleRadiusGlobal, sampleCosAngleLightToZenith).rgb;
        #if COMPUTE_MULTI_SCATTERING
            vec3 phaseTimesScattering = uniformPhase * scattering;
            vec3 S = transmittanceToLight * phaseTimesScattering;
        #else
            vec3 phaseTimesScattering = scatteringMie * miePhase + scatteringRayleigh * rayleighPhase;
            vec3 multiScatteredRadiance = sampleMultiScatteringLut(multiScatteringLut, sampleRadiusGlobal, sampleCosAngleLightToZenith);
            vec3 S = transmittanceScale * transmittanceToLight * phaseTimesScattering + multiScatteringIntensity * multiScatteredRadiance * scattering;
        #endif

        vec3 sampleOpticalDepth = extinction * dt;
        vec3 sampleTransmittance = exp(-sampleOpticalDepth);

        vec3 clampedExtinction = max(vec3(0.0000001), extinction);
        vec3 SInt = (S - S * sampleTransmittance) / clampedExtinction;
        radiance += transmittance * SInt;

        #if COMPUTE_MULTI_SCATTERING
            vec3 MSInt = (scattering - scattering * sampleTransmittance) / clampedExtinction;
            multiScattering += transmittance * MSInt;
        #endif

        transmittance *= sampleTransmittance;
    }

    #if USE_GROUND_ALBEDO
        // Account for the light bounced off the ground when computing multiple scattering.
        if (tMax == tBottom && tBottom > 0.) {
            vec3 planetPos = rayOriginGlobal + tBottom * rayDirection;
            float planetPosRadius = length(planetPos);
            vec3 planetPosGeocentricNormal = planetPos / planetPosRadius;
            float nDotL = dot(directionToLight, planetPosGeocentricNormal);
            vec3 lightTransmittance = sampleTransmittanceLut(transmittanceLut, planetPosRadius, nDotL).rgb;
            const float diffuseBrdf = RECIPROCAL_PI;
            radiance += lightTransmittance * transmittance * groundAlbedo * (nDotL * diffuseBrdf);
        }
    #endif

    radiance *= lightIntensity;

    return radiance;

}

#endif

float layerIdxToAerialPerspectiveLayer(float layerIdx) {
    float layer = (layerIdx + 1.) / NumAerialPerspectiveLutLayers;
    layer *= layer; // squared distribution
    layer *= NumAerialPerspectiveLutLayers;
    return layer;
}

float toAerialPerspectiveDepth(float layer) {
    return layer * AerialPerspectiveLutKMPerSlice;
}

float toAerialPerspectiveLayer(float distance, float aerialPerspectiveLutDistancePerSlice) {
    return distance / aerialPerspectiveLutDistancePerSlice;
}

vec4 applyAerialPerspectiveSaturation(vec4 aerialPerspective) {
    float previousRadiance = getLuminance(aerialPerspective.rgb);
    aerialPerspective.rgb = mix(vec3(previousRadiance), aerialPerspective.rgb, aerialPerspectiveSaturation);
    return aerialPerspective;
}

vec4 applyAerialPerspectiveIntensity(vec4 aerialPerspective) {
    #if APPLY_AERIAL_PERSPECTIVE_INTENSITY
        if (aerialPerspectiveIntensity == 0.) {
            aerialPerspective = vec4(0.);
        } else {
            float previousAlpha = aerialPerspective.a;
            aerialPerspective /= max(0.00001, previousAlpha);
            aerialPerspective *= pow(previousAlpha, 1. / aerialPerspectiveIntensity);
        }
    #endif
    return aerialPerspective;
}

vec4 applyAerialPerspectiveRadianceBias(vec4 aerialPerspective) {
#if APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS
    float originalRadiance = dot(aerialPerspective.rgb, LuminanceEncodeApprox);
    float targetRadiance = originalRadiance + aerialPerspectiveRadianceBias;

    if (originalRadiance > 0.) {
        aerialPerspective *= max(0., targetRadiance / originalRadiance);
    } else {
        aerialPerspective = max(vec4(0.), vec4(aerialPerspectiveRadianceBias));
    }

    aerialPerspective.a = min(aerialPerspective.a, 1.);
#endif
    return aerialPerspective;
}

// Samples the aerial perspective LUT at the specified distance from the camera.
// Assumes aerialPerspectiveLut has been declared.
bool sampleAerialPerspectiveLut(
    vec2 screenUV,
    bool clampToLutRange,
    float distanceFromCamera,
    float numAerialPerspectiveLutLayers,
    float aerialPerspectiveLutKMPerSlice,
    float aerialPerspectiveLutRangeKM,
    out vec4 aerialPerspective) {

    aerialPerspective = vec4(0.);

#if USE_AERIAL_PERSPECTIVE_LUT
    if (distanceFromCamera > 0. &&
        (clampToLutRange || distanceFromCamera < aerialPerspectiveLutRangeKM) &&
        clampedCameraRadius <= atmosphereRadius) {

        float layer = toAerialPerspectiveLayer(distanceFromCamera, aerialPerspectiveLutKMPerSlice);
        float normalizedLayer = sqrt(layer / numAerialPerspectiveLutLayers); // squared distribution
        layer = min(normalizedLayer * numAerialPerspectiveLutLayers, numAerialPerspectiveLutLayers);

        // Fade out nearest layer to 0.
        float weight = min(layer, 1.);

        // Interpolate aerial perspective from the two adjacent texture layers.
        float layerIdx = max(0., layer - 1.);
        float floorLayerIdx = floor(layerIdx);
        vec4 aerialPerspectiveLayer0 = textureLod(aerialPerspectiveLut, vec3(screenUV, floorLayerIdx), 0.);
        vec4 aerialPerspectiveLayer1 = textureLod(aerialPerspectiveLut, vec3(screenUV, floorLayerIdx + 1.), 0.);
        aerialPerspective = mix(aerialPerspectiveLayer0, aerialPerspectiveLayer1, layerIdx - floorLayerIdx);

        aerialPerspective.rgb *= atmosphereExposure;
        aerialPerspective = applyAerialPerspectiveSaturation(aerialPerspective);
        aerialPerspective = weight * applyAerialPerspectiveIntensity(aerialPerspective);
        aerialPerspective = applyAerialPerspectiveRadianceBias(aerialPerspective);

        return true;
    }
#endif

    return false;
}

#if RENDER_TRANSMITTANCE

void getTransmittanceParameters(vec2 uv, out float radius, out float cosAngleLightToZenith, out float distanceToAtmosphereEdge) {

    vec2 unit = uvToUnit(uv, TransmittanceLutDomainInUVSpace, TransmittanceLutHalfTexelSize);

    // Compute the position's radius from center of planet.
    float distanceToHorizon = unit.y * horizonDistanceToAtmosphereEdge;
    float distanceToHorizonSquared = distanceToHorizon * distanceToHorizon;
    radius = sqrtClamped(distanceToHorizonSquared + planetRadiusSquared);

    // Compute the distance to the atmosphere edge from the position towards the light.
    float minDistanceToAtmosphereEdge = atmosphereRadius - radius;
    float maxDistanceToAtmosphereEdge = distanceToHorizon + horizonDistanceToAtmosphereEdge;
    distanceToAtmosphereEdge = minDistanceToAtmosphereEdge + unit.x * (maxDistanceToAtmosphereEdge - minDistanceToAtmosphereEdge);
    float distanceToAtmosphereEdgeSquared = distanceToAtmosphereEdge * distanceToAtmosphereEdge;

    // Compute cosine of the zenith angle to the light for this position.
    cosAngleLightToZenith =
        distanceToAtmosphereEdge <= 0. ?
            1. :
            (horizonDistanceToAtmosphereEdgeSquared - distanceToAtmosphereEdgeSquared - distanceToHorizonSquared) / (2. * radius * distanceToAtmosphereEdge);
    cosAngleLightToZenith = clamp(cosAngleLightToZenith, -1., 1.);

}

vec4 renderTransmittance(vec2 uv) {

    float radius, cosAngleLightToZenith, distanceToAtmosphereEdgeAlongAngle;
    getTransmittanceParameters(uv, radius, cosAngleLightToZenith, distanceToAtmosphereEdgeAlongAngle);

    float sinAngleLightToZenith = sqrtClamped(1. - cosAngleLightToZenith * cosAngleLightToZenith);
    vec3 directionToLight = normalize(vec3(0., cosAngleLightToZenith, sinAngleLightToZenith));

    vec3 transmittance = computeTransmittance(vec3(0., radius, 0.), directionToLight, distanceToAtmosphereEdgeAlongAngle, TransmittanceSampleCount);
    return vec4(transmittance, avg(transmittance));

}

#endif

#if RENDER_MULTI_SCATTERING

vec3 getSphereSample(float azimuth, float inclination, out float sinInclination) {
    sinInclination = sin(inclination);
    return vec3(sinInclination * sin(azimuth), cos(inclination), sinInclination * cos(azimuth));
}

// TODO: Uniforms.
const float MultiScatteringInclinationSampleCount = 8.;
const float MultiScatteringAzimuthSampleCount = 2. * MultiScatteringInclinationSampleCount;
const float MultiScatteringLutSampleCount = 64.;
const float MultiScatteringAzimuthIterationAngle = TWO_PI / MultiScatteringAzimuthSampleCount;
const float MultiScatteringInclinationIterationAngle = PI / MultiScatteringInclinationSampleCount;
const float MultiScatteringAngleStepProduct = MultiScatteringAzimuthIterationAngle * MultiScatteringInclinationIterationAngle;

#define inline
vec4 renderMultiScattering(vec2 uv, sampler2D transmittanceLut) {

    vec2 unit = uvToUnit(uv, MultiScatteringLutDomainInUVSpace, MultiScatteringLutHalfTexelSize);

    float cosAngleLightToZenith = 2. * unit.x - 1.;
    float sinAngleLightToZenith = sqrtClamped(1. - cosAngleLightToZenith * cosAngleLightToZenith);
    vec3 directionToLight = normalize(vec3(0., cosAngleLightToZenith, sinAngleLightToZenith));

    float rayOriginRadius = planetRadius + max(unit.y, 0.001) * atmosphereThickness;
    vec3 rayOrigin = vec3(0., rayOriginRadius, 0.);

    vec3 inscattered = vec3(0.);
    vec3 multiScatteringTotal = vec3(0.);

    for (float i = 0.5; i < MultiScatteringAzimuthSampleCount; ++i) {
        float azimuth = MultiScatteringAzimuthIterationAngle * i;
        for (float j = 0.5; j < MultiScatteringInclinationSampleCount; ++j) {
            float inclination = MultiScatteringInclinationIterationAngle * j;
            float sinInclination;
            vec3 rayDirection = getSphereSample(azimuth, inclination, sinInclination);

            vec3 transmittance;
            vec3 multiScattering;
            vec3 radiance = integrateScatteredRadiance(
                false, // isAerialPerspectiveLut
                1., // No light intensity; it will be applied in downstream LUTs (AerialPerspective, SkyView, and DiffuseSkyIrradiance).
                transmittanceLut,
                rayOrigin,
                rayDirection,
                directionToLight,
                100000000.,
                MultiScatteringLutSampleCount,
                -1., // No planet hit.
                transmittance,
                multiScattering);

            float weight = RECIPROCAL_PI4 * abs(sinInclination) * MultiScatteringAngleStepProduct;
            multiScatteringTotal += multiScattering * weight;
            inscattered += radiance * weight;
        }
    }

    vec3 multiScattering = inscattered / max(vec3(0.000001), vec3(1.) - multiScatteringTotal);

    return vec4(multiScattering, 1.);

}

#endif

float computeCosHorizonAngleFromZenith(float radius) {

    float sinAngleBetweenHorizonAndNadir = min(1., planetRadius / radius);
    float cosHorizonAngleFromNadir = sqrt(1. - sinAngleBetweenHorizonAndNadir * sinAngleBetweenHorizonAndNadir);
    float cosHorizonAngleFromZenith = -cosHorizonAngleFromNadir;
    return cosHorizonAngleFromZenith;

}

#if RENDER_SKY_VIEW

void getSkyViewParametersFromUV(
    float radius,
    vec2 uv,
    out float cosAngleBetweenViewAndZenith,
    out float cosAngleBetweenViewAndLightOnPlane) {

    // Constrain UVs to valid sub texel range (avoid zenith derivative issue making LUT usage visible)
    vec2 unit = uvToUnit(uv, SkyViewLutDomainInUVSpace, SkyViewLutHalfTexelSize);

    float cosHorizonAngleFromZenith = computeCosHorizonAngleFromZenith(radius);

    if (unit.y < 0.5) {

        float coord = 2. * unit.y; // 0 to 0.5 ==> 0 to 1 (0 is nadir, 1 is horizon)
        coord *= coord; // more precision at nadir
        cosAngleBetweenViewAndZenith = mix(-1., cosHorizonAngleFromZenith, coord); // cos(PI /* nadir */) ==-> cos(horizon angle)
        // inverse: coord = (cosAngleBetweenViewAndZenith + 1.0) / (cosHorizonAngleFromZenith + 1.0)

    } else {

        float coord = 2. * unit.y - 1.; // 0.5 to 1 ==> 0 to 1 (0 is horizon, 1 is zenith)
        coord *= coord; // more precision at horizon, less at zenith
        cosAngleBetweenViewAndZenith = mix(cosHorizonAngleFromZenith, 1., coord); // cos(horizon angle) ==-> cos(0 /* zenith */)
        // inverse: coord = (cosAngleBetweenViewAndZenith - cosHorizonAngleFromZenith) / (1.0 - cosHorizonAngleFromZenith);

    }

    {
        float coord = unit.x;
        cosAngleBetweenViewAndLightOnPlane = 1. - 2. * coord;
    }

}

#define inline
vec4 renderSkyView(vec2 uv, sampler2D transmittanceLut, sampler2D multiScatteringLut) {

    float cosAngleBetweenViewAndZenith;
    float cosAngleBetweenViewAndLightOnPlane;
    getSkyViewParametersFromUV(clampedCameraRadius, uv, cosAngleBetweenViewAndZenith, cosAngleBetweenViewAndLightOnPlane);

    float sinAngleBetweenViewAndZenith = sqrtClamped(1. - cosAngleBetweenViewAndZenith * cosAngleBetweenViewAndZenith);
    float sinAngleBetweenViewAndLightOnPlane = sqrtClamped(1. - cosAngleBetweenViewAndLightOnPlane * cosAngleBetweenViewAndLightOnPlane);
    vec3 rayDirection =
        vec3(
            sinAngleBetweenViewAndZenith * cosAngleBetweenViewAndLightOnPlane,
            cosAngleBetweenViewAndZenith,
            sinAngleBetweenViewAndZenith * sinAngleBetweenViewAndLightOnPlane);

    bool intersectsAtmosphere = false;
    vec3 cameraPositionGlobalClampedToTopOfAtmosphere = vec3(0.);
    moveToTopAtmosphere(
        vec3(0., clampedCameraRadius, 0.),
        clampedCameraRadius,
        vec3(0., 1., 0.),
        rayDirection,
        intersectsAtmosphere,
        cameraPositionGlobalClampedToTopOfAtmosphere);
    if (!intersectsAtmosphere) {
        return vec4(0.);
    }

    vec3 transmittance;
    vec3 radiance = integrateScatteredRadiance(
        false, // isAerialPerspectiveLut
        atmosphereExposure * lightIntensity,
        transmittanceLut,
        multiScatteringLut,
        multiScatteringIntensity,
        cameraPositionGlobalClampedToTopOfAtmosphere,
        rayDirection,
        directionToLightRelativeToCameraGeocentricNormal,
        100000000.,
        SkyViewLutSampleCount,
        -1., // No planet hit.
        transmittance);

    float transparency = 1. - avg(transmittance);
    return vec4(radiance, transparency);

}

#endif

#if RENDER_CAMERA_VOLUME

#define inline
vec4 renderCameraVolume(
    vec3 positionOnNearPlane,
    float layerIdx,
    sampler2D transmittanceLut,
    sampler2D multiScatteringLut) {

    vec4 result = vec4(0.);

    vec3 rayDirection = normalize(positionOnNearPlane);

    float layer = layerIdxToAerialPerspectiveLayer(layerIdx);
    float tMax = toAerialPerspectiveDepth(layer);

    float tMaxMax = tMax;

    vec3 cameraPositionGlobalClampedToTopOfAtmosphere = clampedCameraPositionGlobal;
    if (clampedCameraRadius >= atmosphereRadius) {

        bool intersectsAtmosphere = false;
        moveToTopAtmosphere(
            clampedCameraPositionGlobal,
            clampedCameraRadius,
            cameraGeocentricNormal,
            rayDirection,
            intersectsAtmosphere,
            cameraPositionGlobalClampedToTopOfAtmosphere);
        if (!intersectsAtmosphere) {
            return result;
        }

        float distanceToAtmosphere = distance(clampedCameraPositionGlobal, cameraPositionGlobalClampedToTopOfAtmosphere);
        if (tMaxMax < distanceToAtmosphere) {
            return result;
        }

        tMaxMax = max(0., tMaxMax - distanceToAtmosphere);

    }

    float sampleCount = min(SkyViewLutSampleCount, 2. * layer + 2.);
    vec3 transmittance;
    vec3 radiance = integrateScatteredRadiance(
        true, // isAerialPerspectiveLut
        lightIntensity,
        transmittanceLut,
        multiScatteringLut,
        multiScatteringIntensity,
        cameraPositionGlobalClampedToTopOfAtmosphere,
        rayDirection,
        directionToLight,
        tMaxMax,
        sampleCount,
        -1., // No planet hit.
        transmittance);

    float transparency = 1. - avg(transmittance);
    result = vec4(radiance, transparency);
    return result;

}

#endif