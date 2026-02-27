// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define SAMPLE_SKY_VIEW_LUT
#if USE_SKY_VIEW_LUT
    #define EXCLUDE_RAY_MARCHING_FUNCTIONS
#endif

// In global views, renders the atmosphere.

#include<atmosphereUboDeclaration>

#if HAS_DEPTH_TEXTURE
var depthTextureSampler: sampler;
var depthTexture: texture_2d<f32>;
#endif
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
#include<depthFunctions>
#include<atmosphereFunctions>

varying vUV: vec2f;
varying positionOnNearPlane: vec3f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    fragmentOutputs.color = vec4f(0.);

    #if HAS_DEPTH_TEXTURE
        let depth = textureSampleLevel(depthTexture, depthTextureSampler, input.vUV, 0.).r;
    #endif

    let rayDirection = normalize(input.positionOnNearPlane);

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

        fragmentOutputs.color = skyColor;

        if (isRayIntersectingGround) {

            fragmentOutputs.color =
                applyAerialPerspectiveRadianceBias(
                    applyAerialPerspectiveIntensity(
                        applyAerialPerspectiveSaturation(fragmentOutputs.color)));

            #if HAS_DEPTH_TEXTURE
                // If there's no depth i.e., missing patch of the planet, but it should be a ground pixel,
                // then make the pixel opaque so that it does not show the background through the planet.
                fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb, select(fragmentOutputs.color.a, 1., depth >= 1.));
            #endif

        }

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

        #if HAS_DEPTH_TEXTURE
            let distanceFromCamera =
                reconstructDistanceFromCamera(
                    depth,
                    rayDirection,
                    atmosphere.cameraForward,
                    atmosphere.cameraNearPlane);
            let distanceToSurface = distanceFromCamera / 1000.;
        #else
            let distanceToSurface = 0.;
        #endif

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
            distanceToSurface,
            &transmittance);

        let transparency = 1. - avg(transmittance);

        fragmentOutputs.color = vec4f(radiance, transparency);

        if (distanceToSurface > 0.) {

            fragmentOutputs.color =
                applyAerialPerspectiveRadianceBias(
                    applyAerialPerspectiveIntensity(
                        applyAerialPerspectiveSaturation(fragmentOutputs.color)));

            #if HAS_DEPTH_TEXTURE
                // If there's no depth i.e., missing patch of the planet, but it should be a ground pixel,
                // then make the pixel opaque so that it does not show background through the planet.
                fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb, select(fragmentOutputs.color.a, 1., depth >= 1.));
            #endif

        }

    #endif

    #if OUTPUT_TO_SRGB
        fragmentOutputs.color = toGammaSpace(fragmentOutputs.color);
    #endif
}
