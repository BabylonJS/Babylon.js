// Copyright (c) Microsoft Corporation.
// MIT License

import type { AtmospherePhysicalProperties } from "./atmospherePhysicalProperties";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IColor3Like } from "core/Maths/math.like";

/**
 * Creation options for the {@link Atmosphere}.
 */
export interface IAtmosphereOptions {
    /**
     * The properties that define the atmosphere's composition and size.
     */
    physicalProperties?: AtmospherePhysicalProperties;

    /**
     * An optional depth texture that will be used by the fullscreen passes that render the sky, aerial perspective, or globe atmosphere.
     * This enables deferred rendering scenarios, where atmospheric effects need to be composited onto geometry buffers.
     * Expects infinite far plane on the camera (camera.maxZ = 0) and a non-linear depth to be stored in the red channel.
     */
    depthTexture?: BaseTexture;

    /**
     * Controls the overall brightness of the atmosphere rendering.
     * A value of 1.0 is physically correct.
     */
    exposure?: number;

    /**
     * Whether the light values should be specified in linear space.
     * Set to true when using PBRMaterials, which expect linear light values.
     */
    isLinearSpaceLight?: boolean;

    /**
     * Whether the composition of the sky should be in linear space.
     * Set to true for HDR rendering or when using image post-processes.
     */
    isLinearSpaceComposition?: boolean;

    /**
     * Whether to apply approximate transmittance to dim surfaces behind the atmosphere.
     * When true, distant surfaces are dimmed using a grayscale approximation of transmittance.
     */
    applyApproximateTransmittance?: boolean;

    /**
     * Whether to use the sky view LUT for compositing the sky.
     * When false, full ray marching is required (slower).
     */
    isSkyViewLutEnabled?: boolean;

    /**
     * Whether to use the aerial perspective LUT.
     * When false, full ray marching is required for aerial perspective (slower).
     */
    isAerialPerspectiveLutEnabled?: boolean;

    /**
     * Radiance bias applied to the aerial perspective.
     * Positive values brighten the aerial perspective, negative values darken it.
     * The default is 0 (no change).
     */
    aerialPerspectiveRadianceBias?: number;

    /**
     * Scale factor for the amount of light transmitted into aerial perspective from the light source.
     * The default is 1 (no scaling).
     */
    aerialPerspectiveTransmittanceScale?: number;

    /**
     * Amount of saturation applied to the aerial perspective.
     * Lower values make the aerial perspective more gray.
     * The default is 1 (no saturation change).
     */
    aerialPerspectiveSaturation?: number;

    /**
     * Overall intensity multiplier for the aerial perspective effect.
     * Higher values increase haziness.
     * The default is 1 (no intensity change).
     */
    aerialPerspectiveIntensity?: number;

    /**
     * Whether to use the diffuse sky irradiance LUT.
     */
    isDiffuseSkyIrradianceLutEnabled?: boolean;

    /**
     * Higher values result in more desaturated diffuse irradiance.
     * The default is 0 (no desaturation).
     */
    diffuseSkyIrradianceDesaturationFactor?: number;

    /**
     * Overall intensity multiplier for the diffuse irradiance.
     * The default is 1 (no intensity change).
     */
    diffuseSkyIrradianceIntensity?: number;

    /**
     * Controls the intensity of the additional diffuse irradiance amount.
     */
    additionalDiffuseSkyIrradianceIntensity?: number;

    /**
     * Controls the color of the additional diffuse irradiance amount.
     */
    additionalDiffuseSkyIrradianceColor?: IColor3Like;

    /**
     * Higher values increase the contribution of multiple scattering to the overall atmosphere.
     * Default is 1 (no intensity change).
     */
    multiScatteringIntensity?: number;

    /**
     * Average color of light reflected off the ground.
     * Affects the multiply scattered light contribution in the atmosphere.
     */
    groundAlbedo?: IColor3Like;

    /**
     * Minimum color for multiple scattering.
     * Useful for creating a quick, but not physically accurate, night sky.
     */
    minimumMultiScatteringColor?: IColor3Like;

    /**
     * Controls the intensity of the {@link minimumMultiScatteringColor}.
     * Useful for creating a quick, but not physically accurate, night sky.
     */
    minimumMultiScatteringIntensity?: number;

    /**
     * Height in kilometers of the scene's origin relative to the planet surface.
     */
    originHeight?: number;

    /**
     * The rendering group ID for the sky compositor.
     * When specified, the sky will only be rendered for this group.
     * If not specified, defaults to group 0.
     */
    skyRenderingGroup?: number;

    /**
     * The rendering group ID for the aerial perspective compositor.
     * When specified, aerial perspective will only be rendered for this group.
     * If not specified, defaults to group 0.
     */
    aerialPerspectiveRenderingGroup?: number;

    /**
     * The rendering group ID for the globe atmosphere compositor.
     * When specified, the globe atmosphere will only be rendered for this group.
     * If not specified, defaults to group 0.
     */
    globeAtmosphereRenderingGroup?: number;
}
