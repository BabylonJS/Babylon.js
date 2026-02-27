// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Composites the aerial perspective over any fragment with a depth value within the atmosphere.

#include<atmosphereUboDeclaration>

#if USE_AERIAL_PERSPECTIVE_LUT
var aerialPerspectiveLutSampler: sampler;
var aerialPerspectiveLut: texture_2d_array<f32>;
#endif

var depthTextureSampler: sampler;
var depthTexture: texture_2d<f32>;

var transmittanceLutSampler: sampler;
var transmittanceLut: texture_2d<f32>;

var multiScatteringLutSampler: sampler;
var multiScatteringLut: texture_2d<f32>;

#include<core/helperFunctions>
#include<depthFunctions>
#include<atmosphereFunctions>

varying vUV: vec2f;
varying positionOnNearPlane: vec3f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    fragmentOutputs.color = vec4f(0.);

    // This requires a depth texture value.
    let depth = textureSampleLevel(depthTexture, depthTextureSampler, input.vUV, 0.).r;
    if (depth >= 1.) {
        discard;
    }

    let rayDirection = normalize(input.positionOnNearPlane);

    let distanceFromCamera =
        reconstructDistanceFromCamera(
            depth,
            rayDirection,
            atmosphere.cameraForward,
            atmosphere.cameraNearPlane);
    let distanceToSurface = distanceFromCamera / 1000.;

    // First, attempt to sample from the aerial perspective LUT.
    var aerialPerspective = vec4f(0.);
    if (sampleAerialPerspectiveLut(
            input.vUV,
            false, // don't clamp to LUT range-- will fallback to ray marching for pixels beyond the LUT range.
            distanceToSurface,
            NumAerialPerspectiveLutLayers,
            AerialPerspectiveLutKMPerSlice,
            AerialPerspectiveLutRangeKM,
            &aerialPerspective)) {

            #ifndef APPLY_TRANSMITTANCE_BLENDING
                aerialPerspective = vec4f(aerialPerspective.rgb, 0.);
            #endif
            fragmentOutputs.color = aerialPerspective;

    } else {

        // The pixel wasn't covered by the LUT. This could be because LUTs are disabled
        // or this pixel's distance is beyond the LUT range. Fill in remaining pixels with ray marching.

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
            fragmentOutputs.color = vec4f(0.);
            return fragmentOutputs;
        }

        let isAerialPerspectiveLut = atmosphere.clampedCameraRadius < atmosphere.atmosphereRadius;
        var transmittance: vec3f;
        let radiance = integrateScatteredRadiance(
            isAerialPerspectiveLut, // isAerialPerspectiveLut
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
        fragmentOutputs.color =
            applyAerialPerspectiveRadianceBias(
                applyAerialPerspectiveIntensity(
                    applyAerialPerspectiveSaturation(vec4f(radiance, transparency))));

        #ifndef APPLY_TRANSMITTANCE_BLENDING
            fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb, 0.);
        #endif
    }

    #if OUTPUT_TO_SRGB
        fragmentOutputs.color = toGammaSpace(fragmentOutputs.color);
    #endif
}
