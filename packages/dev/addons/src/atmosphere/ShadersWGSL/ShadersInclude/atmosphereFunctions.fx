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

// Common helpers for atmosphere rendering.

// TODO: Port remaining GLSL atmosphereFunctions.fx. Currently this only includes functions for AtmospherePBRMaterialPlugin.
// TODO: Move LUT sizes and ray march related parameters to UBO.

const NumAerialPerspectiveLutLayers: f32 = 32.0;
const AerialPerspectiveLutSize: vec3f = vec3f(16.0, 64.0, NumAerialPerspectiveLutLayers);

const AerialPerspectiveLutKMPerSlice: f32 = 4.0;
const AerialPerspectiveLutRangeKM: f32 = AerialPerspectiveLutKMPerSlice * NumAerialPerspectiveLutLayers;
const TransmittanceSampleCount: i32 = 128;

const TransmittanceLutSize: vec2f = vec2f(256.0, 64.0);
const TransmittanceLutDomainInUVSpace: vec2f = (TransmittanceLutSize - vec2f(1.0, 1.0)) / TransmittanceLutSize;
const TransmittanceLutHalfTexelSize: vec2f = vec2f(0.5, 0.5) / TransmittanceLutSize;

// Constants to fade out transmittance as the light goes below the horizon.
const TransmittanceHorizonRange: f32 = 2.0 * TransmittanceLutHalfTexelSize.x;
const TransmittanceMaxUnoccludedU: f32 = 1.0 - 0.5 * TransmittanceHorizonRange;
const TransmittanceMinOccludedU: f32 = 1.0 + 0.5 * TransmittanceHorizonRange;

fn uvToUnit(uv: vec2f, domainInUVSpace: vec2f, halfTexelSize: vec2f) -> vec2f {
    return (uv - halfTexelSize) / domainInUVSpace;
}

fn computeOzoneDensity(normalizedViewHeight: f32) -> f32 {
    // Heights are normalized against a 100KM thick atmosphere.
    let MinOzoneDensity: f32 = 0.135;
    let OneMinusMinOzoneDensity: f32 = 1.0 - MinOzoneDensity;
    let OzoneStartHeight: f32 = 0.15; // Ramp up density from here to peak.
    let PeakOzoneHeight: f32 = 0.25;
    let MaxOzoneHeight: f32 = 0.6;
    let InverseRampupDistance: f32 = 1.0 / (PeakOzoneHeight - OzoneStartHeight);
    let InverseRampdownDistance: f32 = 1.0 / (MaxOzoneHeight - PeakOzoneHeight);
    let lowerAtmosphereDensity = MinOzoneDensity + OneMinusMinOzoneDensity * max(0.0, normalizedViewHeight - OzoneStartHeight) * InverseRampupDistance;
    let sqrtUpperAtmosphereDensity = max(0.0, 1.0 - (normalizedViewHeight - PeakOzoneHeight) * InverseRampdownDistance);
    let upperAtmosphereDensity = sqrtUpperAtmosphereDensity * sqrtUpperAtmosphereDensity;
    return select(upperAtmosphereDensity, lowerAtmosphereDensity, normalizedViewHeight < PeakOzoneHeight);
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

    var opticalDepth: vec3f = vec3f(0.0);

    var t: f32 = 0.0;
    let sampleSegmentWeight = tMax / f32(sampleCount);
    let sampleSegmentT: f32 = 0.3;
    for (var s: i32 = 0; s < sampleCount; s += 1) {
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
    let discriminant = radiusSquared * (cosAngleLightToZenithSquared - 1.0) + atmosphere.atmosphereRadiusSquared;
    let distanceToAtmosphereEdge = max(0.0, -radius * cosAngleLightToZenith + sqrtClamped(discriminant));

    let minDistanceToAtmosphereEdge = max(0.0, atmosphere.atmosphereRadius - radius);
    let maxDistanceToAtmosphereEdge = horizonDistance + atmosphere.horizonDistanceToAtmosphereEdge;
    let cosAngleLightToZenithCoordinate = (distanceToAtmosphereEdge - minDistanceToAtmosphereEdge) / max(0.000001, maxDistanceToAtmosphereEdge - minDistanceToAtmosphereEdge);
    let distanceToHorizonCoordinate = horizonDistance / max(0.000001, atmosphere.horizonDistanceToAtmosphereEdge);
    let unit = vec2f(cosAngleLightToZenithCoordinate, distanceToHorizonCoordinate);

    return unit * TransmittanceLutDomainInUVSpace + TransmittanceLutHalfTexelSize;
}

// Gets the transmittance of an external light through the atmosphere to a point described by its radius (from the center of the planet) and the angle of incoming light.
fn sampleTransmittanceLut(transmittanceLut: texture_2d<f32>, positionRadius: f32, cosAngleLightToZenith: f32) -> vec4f {
    var distanceToHorizon = 0.0;
    let uv = getTransmittanceUV(positionRadius, cosAngleLightToZenith, &distanceToHorizon);

    // Fade transmittance out as the light goes below the horizon.
    let weight = smoothstep(TransmittanceMinOccludedU, TransmittanceMaxUnoccludedU, uv.x);
    return weight * textureSampleLevel(transmittanceLut, transmittanceLutSampler, uv, 0.0);
}

#endif

fn layerIdxToAerialPerspectiveLayer(layerIdx: f32) -> f32 {
    var layer = (layerIdx + 1.0) / NumAerialPerspectiveLutLayers;
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
    if (atmosphere.aerialPerspectiveIntensity == 0.0) {
        result = vec4f(0.0);
    } else {
        let previousAlpha = result.a;
        result = result / max(0.00001, previousAlpha);
        result = result * pow(previousAlpha, 1.0 / atmosphere.aerialPerspectiveIntensity);
    }
#endif
    return result;
}

fn applyAerialPerspectiveRadianceBias(aerialPerspective: vec4f) -> vec4f {
    var result = aerialPerspective;
#if APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS
    let originalRadiance = dot(result.rgb, LuminanceEncodeApprox);
    let targetRadiance = originalRadiance + atmosphere.aerialPerspectiveRadianceBias;

    if (originalRadiance > 0.0) {
        result = result * max(0.0, targetRadiance / originalRadiance);
    } else {
        result = max(vec4f(0.0), vec4f(atmosphere.aerialPerspectiveRadianceBias));
    }

    result.a = min(result.a, 1.0);
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

    *aerialPerspective = vec4f(0.0);

#if USE_AERIAL_PERSPECTIVE_LUT
    if (distanceFromCamera > 0.0 &&
        (clampToLutRange || distanceFromCamera < aerialPerspectiveLutRangeKM) &&
        atmosphere.clampedCameraRadius <= atmosphere.atmosphereRadius) {

        var layer = toAerialPerspectiveLayer(distanceFromCamera, aerialPerspectiveLutKMPerSlice);
        let normalizedLayer = sqrt(layer / numAerialPerspectiveLutLayers); // squared distribution
        layer = min(normalizedLayer * numAerialPerspectiveLutLayers, numAerialPerspectiveLutLayers);

        // Fade out nearest layer to 0.
        let weight = min(layer, 1.0);

        // Interpolate aerial perspective from the two adjacent texture layers.
        let layerIdx = max(0.0, layer - 1.0);
        let floorLayerIdx = floor(layerIdx);
        let aerialPerspectiveLayer0 = textureSampleLevel(aerialPerspectiveLut, aerialPerspectiveLutSampler, screenUV, i32(floorLayerIdx), 0.0);
        let aerialPerspectiveLayer1 = textureSampleLevel(aerialPerspectiveLut, aerialPerspectiveLutSampler, screenUV, i32(floorLayerIdx + 1.0), 0.0);
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
        (atmosphere.horizonDistanceToAtmosphereEdgeSquared - distanceToAtmosphereEdgeSquared - distanceToHorizonSquared) / (2.0 * *radius * *distanceToAtmosphereEdge),
        1.0,
        *distanceToAtmosphereEdge <= 0.0
    );
    *cosAngleLightToZenith = clamp(*cosAngleLightToZenith, -1.0, 1.0);
}

fn renderTransmittance(uv: vec2f) -> vec4f {
    var radius: f32;
    var cosAngleLightToZenith: f32;
    var distanceToAtmosphereEdgeAlongAngle: f32;
    getTransmittanceParameters(uv, &radius, &cosAngleLightToZenith, &distanceToAtmosphereEdgeAlongAngle);

    let sinAngleLightToZenith = sqrtClamped(1.0 - cosAngleLightToZenith * cosAngleLightToZenith);
    let directionToLight = normalize(vec3f(0.0, cosAngleLightToZenith, sinAngleLightToZenith));

    let transmittance = computeTransmittance(vec3f(0.0, radius, 0.0), directionToLight, distanceToAtmosphereEdgeAlongAngle, TransmittanceSampleCount);
    return vec4f(transmittance, avg(transmittance));
}

#endif
