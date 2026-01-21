// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define SAMPLE_SKY_VIEW_LUT
#if USE_SKY_VIEW_LUT
    #define EXCLUDE_RAY_MARCHING_FUNCTIONS
#endif

precision highp float;
precision highp sampler2D;

// In global views, renders the atmosphere.

#include<__decl__atmosphereFragment>

#if HAS_DEPTH_TEXTURE
uniform sampler2D depthTexture;
#endif
#if USE_SKY_VIEW_LUT
uniform sampler2D skyViewLut;
#else
uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;
#endif

#include<core/helperFunctions>
#include<depthFunctions>
#include<atmosphereFunctions>

varying vec2 uv;
varying vec3 positionOnNearPlane;

void main() {

    gl_FragColor = vec4(0.);

    #if HAS_DEPTH_TEXTURE
        float depth = textureLod(depthTexture, uv, 0.).r;
    #endif

    vec3 rayDirection = normalize(positionOnNearPlane);

    #if USE_SKY_VIEW_LUT

        float cosAngleBetweenViewAndZenith;
        bool isRayIntersectingGround;
        vec4 skyColor = sampleSkyViewLut(
            skyViewLut,
            clampedCameraRadius,
            cameraGeocentricNormal,
            rayDirection,
            directionToLight,
            cosCameraHorizonAngleFromZenith,
            cosAngleBetweenViewAndZenith,
            isRayIntersectingGround);

        gl_FragColor = skyColor;

        if (isRayIntersectingGround) {

            gl_FragColor =
                applyAerialPerspectiveRadianceBias(
                    applyAerialPerspectiveIntensity(
                        applyAerialPerspectiveSaturation(gl_FragColor)));

            #if HAS_DEPTH_TEXTURE
                // If there's no depth i.e., missing patch of the planet, but it should be a ground pixel,
                // then make the pixel opaque so that it does not show the background through the planet.
                gl_FragColor.a = depth >= 1. ? 1. : gl_FragColor.a;
            #endif

        }

    #else

        // Fills in pixels with direct ray marching.

        bool intersectsAtmosphere = false;
        vec3 cameraPositionGlobalClampedToTopOfAtmosphere = vec3(0.);
        moveToTopAtmosphere(
            clampedCameraPositionGlobal,
            clampedCameraRadius,
            cameraGeocentricNormal,
            rayDirection,
            intersectsAtmosphere,
            cameraPositionGlobalClampedToTopOfAtmosphere);
        if (!intersectsAtmosphere) {
            return;
        }

        #if HAS_DEPTH_TEXTURE
            float distanceFromCamera =
                reconstructDistanceFromCamera(
                    depth,
                    rayDirection,
                    cameraForward,
                    cameraNearPlane);
            float distanceToSurface = distanceFromCamera / 1000.;
        #else
            float distanceToSurface = 0.;
        #endif

        vec3 transmittance;
        vec3 radiance = integrateScatteredRadiance(
            false, // isAerialPerspectiveLut
            atmosphereExposure * lightIntensity,
            transmittanceLut,
            multiScatteringLut,
            multiScatteringIntensity,
            cameraPositionGlobalClampedToTopOfAtmosphere,
            rayDirection,
            directionToLight,
            100000000.,
            SkyViewLutSampleCount,
            distanceToSurface,
            transmittance);

        float transparency = 1. - avg(transmittance);

        gl_FragColor = vec4(radiance, transparency);

        if (distanceToSurface > 0.) {

            gl_FragColor =
                applyAerialPerspectiveRadianceBias(
                    applyAerialPerspectiveIntensity(
                        applyAerialPerspectiveSaturation(gl_FragColor)));

            #if HAS_DEPTH_TEXTURE
                // If there's no depth i.e., missing patch of the planet, but it should be a ground pixel,
                // then make the pixel opaque so that it does not show background through the planet.
                gl_FragColor.a = depth >= 1. ? 1. : gl_FragColor.a;
            #endif

        }

    #endif

    #if OUTPUT_TO_SRGB
        gl_FragColor = toGammaSpace(gl_FragColor);
    #endif

}