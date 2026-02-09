// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define SAMPLE_SKY_VIEW_LUT
#if USE_SKY_VIEW_LUT
    #define EXCLUDE_RAY_MARCHING_FUNCTIONS
#endif

#include<atmosphereUboDeclaration>

#if USE_SKY_VIEW_LUT
var skyViewLutSampler: sampler;
var skyViewLut: texture_2d<f32>;
#else
var transmittanceLutSampler: sampler;
var transmittanceLut: texture_2d<f32>;

var multiScatteringLutSampler: sampler;
var multiScatteringLut: texture_2d<f32>;
#endif

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vUV: vec2f;
varying positionOnNearPlane: vec3f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    fragmentOutputs.color = vec4f(0.);

    let rayDirection = normalize(input.positionOnNearPlane);

    // If the sky view LUT is enabled, use it to render the sky when inside the atmosphere,
    // and use it to render the atmosphere itself when outside the atmosphere.
    #if USE_SKY_VIEW_LUT

        var cosAngleBetweenViewAndZenith: f32;
        var isRayIntersectingGround: bool;
        var skyColor = sampleSkyViewLut(
            skyViewLut,
            atmosphere.clampedCameraRadius,
            atmosphere.cameraGeocentricNormal,
            rayDirection,
            atmosphere.directionToLight,
            atmosphere.cosCameraHorizonAngleFromZenith,
            &cosAngleBetweenViewAndZenith,
            &isRayIntersectingGround);

        #ifndef APPLY_TRANSMITTANCE_BLENDING
            skyColor = vec4f(skyColor.rgb, 0.);
        #endif
        fragmentOutputs.color = skyColor;

        // If this is a "ground" pixel and there is no depth here, make the pixel opaque.
        // This prevents celestial objects showing through the planet.
        fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb, select(fragmentOutputs.color.a, 1., isRayIntersectingGround));

    #else

        // Fills in pixels with direct ray marching.

        var intersectsAtmosphere = false;
        var cameraPositionGlobalClampedToTopOfAtmosphere = vec3f(0.);
        moveToTopAtmosphere(
            atmosphere.clampedCameraPositionGlobal,
            atmosphere.clampedCameraRadius,
            atmosphere.cameraGeocentricNormal,
            rayDirection,
            &intersectsAtmosphere,
            &cameraPositionGlobalClampedToTopOfAtmosphere);
        if (!intersectsAtmosphere) {
            return fragmentOutputs;
        }

        var transmittance: vec3f;
        let radiance = integrateScatteredRadiance(
            false, // isAerialPerspectiveLut
            atmosphere.atmosphereExposure * atmosphere.lightIntensity,
            transmittanceLut,
            multiScatteringLut,
            atmosphere.multiScatteringIntensity,
            cameraPositionGlobalClampedToTopOfAtmosphere,
            rayDirection,
            atmosphere.directionToLight,
            100000000.,
            SkyViewLutSampleCount,
            -1., // No planet hit.
            &transmittance);

        #if APPLY_TRANSMITTANCE_BLENDING
            let transparency = 1. - avg(transmittance);
        #else
            let transparency = 0.;
        #endif
        fragmentOutputs.color = vec4f(radiance, transparency);

    #endif

    #if OUTPUT_TO_SRGB
        fragmentOutputs.color = toGammaSpace(fragmentOutputs.color);
    #endif
}
