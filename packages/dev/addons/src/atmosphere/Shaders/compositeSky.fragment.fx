// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define SAMPLE_SKY_VIEW_LUT
#if USE_SKY_VIEW_LUT
    #define EXCLUDE_RAY_MARCHING_FUNCTIONS
#endif

precision highp float;
precision highp sampler2D;

#include<__decl__atmosphereFragment>

#if USE_SKY_VIEW_LUT
uniform sampler2D skyViewLut;
#else
uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;
#endif

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec2 uv;
varying vec3 positionOnNearPlane;

void main() {

    gl_FragColor = vec4(0.);

    vec3 rayDirection = normalize(positionOnNearPlane);

    // If the sky view LUT is enabled, use it to render the sky when inside the atmosphere,
    // and use it to render the atmosphere itself when outside the atmosphere.
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

        #ifndef APPLY_TRANSMITTANCE_BLENDING
            skyColor.a = 0.;
        #endif
        gl_FragColor = skyColor;

        // If this is a "ground" pixel and there is no depth here, make the pixel opaque.
        // This prevents celestial objects showing through the planet.
        gl_FragColor.a = isRayIntersectingGround ? 1. : gl_FragColor.a;

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
            -1., // No planet hit.
            transmittance);

        #if APPLY_TRANSMITTANCE_BLENDING
            float transparency = 1. - avg(transmittance);
        #else
            float transparency = 0.;
        #endif
        gl_FragColor = vec4(radiance, transparency);

    #endif

    #if OUTPUT_TO_SRGB
        gl_FragColor = toGammaSpace(gl_FragColor);
    #endif

}