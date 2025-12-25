// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

precision highp float;
precision highp sampler2D;
precision highp sampler2DArray;

// Composites the aerial perspective over any fragment with a depth value within the atmosphere.

#include<__decl__atmosphereFragment>

#if USE_AERIAL_PERSPECTIVE_LUT
uniform sampler2DArray aerialPerspectiveLut;
#endif

uniform sampler2D depthTexture;
uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;

#include<core/helperFunctions>
#include<depthFunctions>
#include<atmosphereFunctions>

varying vec2 uv;
varying vec3 positionOnNearPlane;

void main() {

    gl_FragColor = vec4(0.);

    // This requires a depth texture value.
    float depth = textureLod(depthTexture, uv, 0.).r;
    if (depth >= 1.) {
        discard;
    }

    vec3 rayDirection = normalize(positionOnNearPlane);

    float distanceFromCamera =
        reconstructDistanceFromCamera(
            depth,
            rayDirection,
            cameraForward,
            cameraNearPlane);
    float distanceToSurface = distanceFromCamera / 1000.;

    // First, attempt to sample from the aerial perspective LUT.
    vec4 aerialPerspective = vec4(0.);
    if (sampleAerialPerspectiveLut(
            uv,
            false, // don't clamp to LUT range-- will fallback to ray marching for pixels beyond the LUT range.
            distanceToSurface,
            NumAerialPerspectiveLutLayers,
            AerialPerspectiveLutKMPerSlice,
            AerialPerspectiveLutRangeKM,
            aerialPerspective)) {

            #ifndef APPLY_TRANSMITTANCE_BLENDING
                aerialPerspective.a = 0.;
            #endif
            gl_FragColor = aerialPerspective;

    } else {

        // The pixel wasn't covered by the LUT. This could be because LUTs are disabled
        // or this pixel's distance is beyond the LUT range. Fill in remaining pixels with ray marching.

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
            gl_FragColor = vec4(0.);
            return;
        }

        bool isAerialPerspectiveLut = clampedCameraRadius < atmosphereRadius;
        vec3 transmittance;
        vec3 radiance = integrateScatteredRadiance(
            isAerialPerspectiveLut, // isAerialPerspectiveLut
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
        gl_FragColor =
            applyAerialPerspectiveRadianceBias(
                applyAerialPerspectiveIntensity(
                    applyAerialPerspectiveSaturation(vec4(radiance, transparency))));


        #ifndef APPLY_TRANSMITTANCE_BLENDING
            gl_FragColor.a = 0.;
        #endif
    }

    #if OUTPUT_TO_SRGB
        gl_FragColor = toGammaSpace(gl_FragColor);
    #endif

}