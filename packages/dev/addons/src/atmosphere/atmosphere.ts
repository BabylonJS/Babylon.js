// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { AbstractEngine } from "core/Engines/abstractEngine";
import { AtmospherePBRMaterialPlugin } from "./atmospherePBRMaterialPlugin";
import { AtmospherePerCameraVariables } from "./atmospherePerCameraVariables";
import { AtmospherePhysicalProperties } from "./atmospherePhysicalProperties";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Camera } from "core/Cameras/camera";
import { Color3 } from "core/Maths/math.color";
import { Constants } from "core/Engines/constants";
import type { DeepImmutable, Nullable } from "core/types";
import { DiffuseSkyIrradianceLut } from "./diffuseSkyIrradianceLut";
import type { DirectionalLight } from "core/Lights/directionalLight";
import type { Effect } from "core/Materials/effect";
import { EffectRenderer, EffectWrapper } from "core/Materials/effectRenderer";
import type { IAtmosphereOptions } from "./atmosphereOptions";
import type { IColor3Like, IVector3Like } from "core/Maths/math.like";
import type { IDisposable, Scene } from "core/scene";
import { Observable, type Observer } from "core/Misc/observable";
import { RegisterMaterialPlugin, UnregisterMaterialPlugin } from "core/Materials/materialPluginManager";
import type { RenderingGroupInfo } from "core/Rendering/renderingManager";
import { RenderTargetTexture, type RenderTargetTextureOptions } from "core/Materials/Textures/renderTargetTexture";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { TransmittanceLut } from "./transmittanceLut";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { Vector3 } from "core/Maths/math.vector";
import "./Shaders/compositeAerialPerspective.fragment";
import "./Shaders/compositeSky.fragment";
import "./Shaders/compositeGlobeAtmosphere.fragment";
import "./Shaders/fullscreenTriangle.vertex";
import "./Shaders/skyView.fragment";
import "./Shaders/aerialPerspective.fragment";
import "./Shaders/ShadersInclude/atmosphereFragmentDeclaration";
import "./Shaders/ShadersInclude/atmosphereFunctions";
import "./Shaders/ShadersInclude/atmosphereUboDeclaration";
import "./Shaders/ShadersInclude/atmosphereVertexDeclaration";
import "./Shaders/ShadersInclude/depthFunctions";

const MaterialPlugin = "atmo-pbr";

const AerialPerspectiveLutLayers = 32;

let UniqueId = 0;

/**
 * Renders a physically based atmosphere.
 * Use {@link IsSupported} to check if the atmosphere is supported before creating an instance.
 * @experimental
 */
export class Atmosphere implements IDisposable {
    private readonly _directionToLight = Vector3.Zero();
    private readonly _tempSceneAmbient = new Color3();
    private readonly _engine: AbstractEngine;
    private readonly _isDiffuseSkyIrradianceLutEnabled: boolean;
    private _physicalProperties: AtmospherePhysicalProperties;
    private _transmittanceLut: Nullable<TransmittanceLut>;
    private _diffuseSkyIrradianceLut: Nullable<DiffuseSkyIrradianceLut>;
    private _isSkyViewLutEnabled: boolean;
    private _isAerialPerspectiveLutEnabled: boolean;
    private _aerialPerspectiveTransmittanceScale: number;
    private _aerialPerspectiveSaturation: number;
    private _aerialPerspectiveIntensity: number;
    private _aerialPerspectiveRadianceBias: number;
    private _diffuseSkyIrradianceDesaturationFactor: number;
    private _additionalDiffuseSkyIrradianceIntensity: number;
    private _additionalDiffuseSkyIrradianceColor: Color3;
    private _additionalDiffuseSkyIrradiance = new Color3();
    private _diffuseSkyIrradianceIntensity: number;
    private _multiScatteringIntensity: number;
    private _groundAlbedo: Color3;
    private _minimumMultiScatteringColor: Color3;
    private _minimumMultiScatteringIntensity: number;
    private _lights: DirectionalLight[];
    private _atmosphereUbo: Nullable<UniformBuffer> = null;
    private _minimumMultiScattering = new Vector3();
    private _cameraAtmosphereVariables = new AtmospherePerCameraVariables();
    private _isLinearSpaceComposition: boolean;
    private _isLinearSpaceLight: boolean;
    private _lightRadianceAtCamera = new Vector3();
    private _linearLightColor = new Color3();
    private _originHeight: number;
    private _applyApproximateTransmittance: boolean;
    private _exposure: number;
    private _atmosphereUniformBufferAsArray: UniformBuffer[] = [];
    private _effectRenderer: Nullable<EffectRenderer> = null;
    private _skyRenderingGroup: number;
    private _aerialPerspectiveRenderingGroup: number;
    private _globeAtmosphereRenderingGroup: number;
    private _isEnabled = true;
    private _aerialPerspectiveLutHasBeenRendered = false;

    private _hasRenderedMultiScatteringLut = false;
    private _hasEverRenderedMultiScatteringLut = false;
    private _multiScatteringEffectWrapper: Nullable<EffectWrapper> = null;
    private _multiScatteringLutRenderTarget: Nullable<RenderTargetTexture> = null;

    private _aerialPerspectiveLutEffectWrapper: Nullable<EffectWrapper> = null;
    private _aerialPerspectiveLutEffectRenderer: Nullable<EffectRenderer> = null;
    private _aerialPerspectiveLutRenderTarget: Nullable<RenderTargetTexture> = null;

    private _skyViewLutEffectWrapper: Nullable<EffectWrapper> = null;
    private _skyViewLutEffectRenderer: Nullable<EffectRenderer> = null;
    private _skyViewLutRenderTarget: Nullable<RenderTargetTexture> = null;

    private _aerialPerspectiveCompositorEffectWrapper: Nullable<EffectWrapper> = null;
    private _skyCompositorEffectWrapper: Nullable<EffectWrapper> = null;
    private _globeAtmosphereCompositorEffectWrapper: Nullable<EffectWrapper> = null;

    private _onBeforeCameraRenderObserver: Nullable<Observer<Camera>> = null;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>> = null;
    private _onBeforeDrawPhaseObserver: Nullable<Observer<Scene>> = null;
    private _onAfterRenderingGroupObserver: Nullable<Observer<RenderingGroupInfo>> = null;

    /**
     * Checks if the {@link Atmosphere} is supported.
     * @param engine - The engine to check.
     * @returns True if the atmosphere is supported, false otherwise.
     */
    public static IsSupported(engine: AbstractEngine): boolean {
        return !engine._badOS && (engine.isWebGPU || engine.version >= 2);
    }

    /**
     * The unique ID of this atmosphere instance.
     */
    public readonly uniqueId = UniqueId++;

    /**
     * Called after the atmosphere variables have been updated for the specified camera.
     */
    public readonly onAfterUpdateVariablesForCameraObservable = new Observable<Camera>();

    /**
     * Called immediately before the light variables are finalized.
     */
    public readonly onBeforeLightVariablesUpdateObservable = new Observable<void>();

    /**
     * Called before the LUTs are rendered for this camera. This happens after the per-camera UBO update.
     */
    public readonly onBeforeRenderLutsForCameraObservable = new Observable<Camera>();

    /**
     * Called after the LUTs were rendered.
     */
    public readonly onAfterRenderLutsForCameraObservable = new Observable<Camera>();

    /**
     * If provided, this is the depth texture used for composition passes.
     * Expects an infinite far plane on the camera (camera.maxZ = 0) and the non-linear depth accessible in red channel.
     * @internal
     */
    public readonly depthTexture: Nullable<BaseTexture> = null;

    /**
     * Controls the overall brightness of the atmosphere rendering.
     */
    public get exposure(): number {
        return this._exposure;
    }

    public set exposure(value: number) {
        this._exposure = Math.max(0, value);
    }

    /**
     * Affects the overall intensity of the multiple scattering.
     */
    public get multiScatteringIntensity(): number {
        return this._multiScatteringIntensity;
    }

    public set multiScatteringIntensity(value: number) {
        const newValue = Math.max(0.0, value);
        if (newValue !== this._multiScatteringIntensity) {
            this._multiScatteringIntensity = value;
            this._diffuseSkyIrradianceLut?.markDirty();
        }
    }

    /**
     * Affects the multiply scattered light contribution in the atmosphere by describing the average light color reflected off the ground.
     */
    public get groundAlbedo(): DeepImmutable<IColor3Like> {
        return this._groundAlbedo;
    }

    public set groundAlbedo(value: DeepImmutable<IColor3Like>) {
        if (!this._groundAlbedo.equals(value)) {
            this._groundAlbedo.copyFrom(value);
            this._multiScatteringEffectWrapper?.dispose();
            this._multiScatteringEffectWrapper = null;
            this._hasRenderedMultiScatteringLut = false;
        }
    }

    /**
     * Can be used to clamp the multiple scattering to a minimum value.
     */
    public get minimumMultiScatteringColor(): DeepImmutable<IColor3Like> {
        return this._minimumMultiScatteringColor;
    }

    public set minimumMultiScatteringColor(value: DeepImmutable<IColor3Like>) {
        if (!this._minimumMultiScatteringColor.equals(value)) {
            const minimumScatteringColor = this._minimumMultiScatteringColor.copyFrom(value);
            this._minimumMultiScattering.x = minimumScatteringColor.r * this._minimumMultiScatteringIntensity;
            this._minimumMultiScattering.y = minimumScatteringColor.g * this._minimumMultiScatteringIntensity;
            this._minimumMultiScattering.z = minimumScatteringColor.b * this._minimumMultiScatteringIntensity;
            this._diffuseSkyIrradianceLut?.markDirty();
        }
    }

    /**
     * This is an additional scaling factor applied to the {@link minimumMultiScatteringColor}.
     */
    public get minimumMultiScatteringIntensity(): number {
        return this._minimumMultiScatteringIntensity;
    }

    public set minimumMultiScatteringIntensity(value: number) {
        const newValue = Math.max(0.0, value);
        if (newValue !== this._minimumMultiScatteringIntensity) {
            this._minimumMultiScatteringIntensity = value;
            this._minimumMultiScattering.x = this._minimumMultiScatteringColor.r * value;
            this._minimumMultiScattering.y = this._minimumMultiScatteringColor.g * value;
            this._minimumMultiScattering.z = this._minimumMultiScatteringColor.b * value;
            this._diffuseSkyIrradianceLut?.markDirty();
        }
    }

    /**
     * Can be used to force the diffuse irradiance towards a gray color.
     */
    public get diffuseSkyIrradianceDesaturationFactor(): number {
        return this._diffuseSkyIrradianceDesaturationFactor;
    }

    public set diffuseSkyIrradianceDesaturationFactor(value: number) {
        const newValue = Math.max(value, 0.0);
        if (newValue !== this._diffuseSkyIrradianceDesaturationFactor) {
            this._diffuseSkyIrradianceDesaturationFactor = newValue;
            this._diffuseSkyIrradianceLut?.markDirty();
        }
    }

    /**
     * This is an additional amount of irradiance added to the diffuse irradiance.
     */
    public get additionalDiffuseSkyIrradianceIntensity(): number {
        return this._additionalDiffuseSkyIrradianceIntensity;
    }

    public set additionalDiffuseSkyIrradianceIntensity(value: number) {
        value = Math.max(0.0, value);
        if (value !== this._additionalDiffuseSkyIrradianceIntensity) {
            this._additionalDiffuseSkyIrradianceIntensity = value;
            this._additionalDiffuseSkyIrradianceColor.scaleToRef(value, this._additionalDiffuseSkyIrradiance);
        }
    }

    /**
     * This is the color for the additional amount of irradiance added to the diffuse irradiance.
     */
    public get additionalDiffuseSkyIrradianceColor(): DeepImmutable<IColor3Like> {
        return this._additionalDiffuseSkyIrradianceColor;
    }

    public set additionalDiffuseSkyIrradianceColor(value: DeepImmutable<IColor3Like>) {
        if (!this._additionalDiffuseSkyIrradianceColor.equals(value)) {
            this._additionalDiffuseSkyIrradianceColor.copyFrom(value).scaleToRef(this._additionalDiffuseSkyIrradianceIntensity, this._additionalDiffuseSkyIrradiance);
        }
    }

    /**
     * The final additional diffuse irradiance, taking into account the intensity and color.
     */
    public get additionalDiffuseSkyIrradiance(): DeepImmutable<IColor3Like> {
        return this._additionalDiffuseSkyIrradiance;
    }

    /**
     * The intensity of the diffuse irradiance.
     */
    public get diffuseSkyIrradianceIntensity(): number {
        return this._diffuseSkyIrradianceIntensity;
    }

    public set diffuseSkyIrradianceIntensity(value: number) {
        this._diffuseSkyIrradianceIntensity = Math.max(value, 0.0);
    }

    /**
     * True if the sky view LUT should be used for compositing the sky instead of a per-pixel ray march.
     */
    public get isSkyViewLutEnabled(): boolean {
        return this._isSkyViewLutEnabled;
    }

    public set isSkyViewLutEnabled(value: boolean) {
        this._isSkyViewLutEnabled = value;
        this._disposeSkyCompositor();
        this._disposeGlobeAtmosphereCompositor();
    }

    /**
     * Gets the sky view LUT render target or null if not enabled.
     * @returns The render target.
     */
    public get skyViewLutRenderTarget(): Nullable<RenderTargetTexture> {
        if (!this._isSkyViewLutEnabled) {
            return null;
        }

        if (this._skyViewLutRenderTarget !== null) {
            return this._skyViewLutRenderTarget;
        }

        const renderTarget = (this._skyViewLutRenderTarget = CreateRenderTargetTexture("atmo-skyView", { width: 128, height: 128 }, this.scene));
        renderTarget.coordinatesMode = Constants.TEXTURE_EQUIRECTANGULAR_MODE;

        this._skyViewLutEffectWrapper = CreateSkyViewEffectWrapper(this._engine, this.uniformBuffer);

        return renderTarget;
    }
    /**
     * True if the aerial perspective LUT should be used.
     * If false, full ray marching would be used instead.
     */
    public get isAerialPerspectiveLutEnabled(): boolean {
        return this._isAerialPerspectiveLutEnabled;
    }

    public set isAerialPerspectiveLutEnabled(value: boolean) {
        this._isAerialPerspectiveLutEnabled = value;
        this._disposeAerialPerspectiveCompositor();
    }

    /**
     * Gets the aerial perspective LUT render target or null if not enabled.
     * @returns The render target.
     */
    public get aerialPerspectiveLutRenderTarget(): Nullable<RenderTargetTexture> {
        if (!this._isAerialPerspectiveLutEnabled) {
            return null;
        }

        if (this._aerialPerspectiveLutRenderTarget !== null) {
            return this._aerialPerspectiveLutRenderTarget;
        }

        const scene = this.scene;
        const name = "atmo-aerialPerspective";
        const renderTarget = (this._aerialPerspectiveLutRenderTarget = CreateRenderTargetTexture(name, { width: 16, height: 64, layers: AerialPerspectiveLutLayers }, scene, {}));
        this._aerialPerspectiveLutEffectWrapper = CreateAerialPerspectiveEffectWrapper(this._engine, this.uniformBuffer);

        return renderTarget;
    }

    /**
     * The intensity of the aerial perspective.
     */
    public get aerialPerspectiveIntensity(): number {
        return this._aerialPerspectiveIntensity;
    }

    public set aerialPerspectiveIntensity(value: number) {
        value = Math.max(0.001, value);
        if (value !== this._aerialPerspectiveIntensity) {
            // Define only needs to change if the value is changing between 1 and not 1.
            const hasDefineChanged = (value === 1) !== (this._aerialPerspectiveIntensity === 1);
            this._aerialPerspectiveIntensity = value;
            if (hasDefineChanged) {
                this._disposeAerialPerspectiveCompositor();
                this._disposeGlobeAtmosphereCompositor();
            }
        }
    }

    /**
     * The amount of light transmitted into aerial perspective.
     * A scale of 1 is physically correct.
     */
    public get aerialPerspectiveTransmittanceScale(): number {
        return this._aerialPerspectiveTransmittanceScale;
    }

    public set aerialPerspectiveTransmittanceScale(value: number) {
        value = Math.max(0, value);
        if (value !== this._aerialPerspectiveTransmittanceScale) {
            this._aerialPerspectiveTransmittanceScale = value;
        }
    }

    /**
     * The amount of saturation applied to the aerial perspective.
     * Reducing to zero desaturates the aerial perspective completely.
     * A value of 1 has no effect.
     */
    public get aerialPerspectiveSaturation(): number {
        return this._aerialPerspectiveSaturation;
    }

    public set aerialPerspectiveSaturation(value: number) {
        value = Math.max(0.0, value);
        if (value !== this._aerialPerspectiveSaturation) {
            this._aerialPerspectiveSaturation = value;
        }
    }

    /**
     * A radiance bias applied to aerial perspective.
     */
    public get aerialPerspectiveRadianceBias(): number {
        return this._aerialPerspectiveRadianceBias;
    }

    public set aerialPerspectiveRadianceBias(value: number) {
        if (value !== this._aerialPerspectiveRadianceBias) {
            // Define only needs to change if the value is changing between 0 and not 0.
            const hasDefineChanged = (value === 0) !== (this._aerialPerspectiveRadianceBias === 0);
            this._aerialPerspectiveRadianceBias = value;
            if (hasDefineChanged) {
                this._disposeAerialPerspectiveCompositor();
                this._disposeGlobeAtmosphereCompositor();
            }
        }
    }

    /**
     * True if the composition should be in linear space (e.g. for HDR rendering).
     * Typically linear space is expected when ImageProcessing is enabled via PostProcesses.
     * False for non-linear output.
     */
    public get isLinearSpaceComposition(): boolean {
        return this._isLinearSpaceComposition;
    }

    public set isLinearSpaceComposition(value: boolean) {
        if (value !== this._isLinearSpaceComposition) {
            this._isLinearSpaceComposition = value;
            // Note, LUTs will remain in linear space. Up to compositors to apply gamma if needed.
            this._disposeSkyCompositor();
            this._disposeAerialPerspectiveCompositor();
            this._disposeGlobeAtmosphereCompositor();
        }
    }

    /**
     * True if the {@link light} value should be specified in linear space.
     * If using PBRMaterials, light value is expected to be linear.
     */
    public get isLinearSpaceLight(): boolean {
        return this._isLinearSpaceLight;
    }

    public set isLinearSpaceLight(value: boolean) {
        this._isLinearSpaceLight = value;
    }

    /**
     * The lookup table for transmittance.
     */
    public get transmittanceLut(): Nullable<TransmittanceLut> {
        return this._transmittanceLut;
    }

    /**
     * Gets the multiple scattering LUT render target.
     * @returns The render target.
     */
    public get multiScatteringLutRenderTarget(): Nullable<RenderTargetTexture> {
        return this._multiScatteringLutRenderTarget;
    }

    /**
     * The lookup table for diffuse sky irradiance, or null if not enabled.
     */
    public get diffuseSkyIrradianceLut(): Nullable<DiffuseSkyIrradianceLut> {
        return this._diffuseSkyIrradianceLut;
    }

    /**
     * The properties used to describe the size and optical parameters of the atmosphere.
     */
    public get physicalProperties(): AtmospherePhysicalProperties {
        return this._physicalProperties;
    }

    /**
     * The height in kilometers of the scene's origin.
     */
    public get originHeight(): number {
        return this._originHeight;
    }

    public set originHeight(value: number) {
        this._originHeight = value;
    }

    /**
     * When atmospheric scattering is applied to surfaces, if this value is set to true,
     * a grayscale approximation of the transmittance is used to dim surfaces.
     *
     * When set to false, the atmospheric composition does not dim the surfaces behind it.
     * It is up to the client application to apply transmittance manually.
     */
    public get applyApproximateTransmittance(): boolean {
        return this._applyApproximateTransmittance;
    }

    public set applyApproximateTransmittance(value: boolean) {
        if (this._applyApproximateTransmittance !== value) {
            this._applyApproximateTransmittance = value;
            this._disposeSkyCompositor();
            this._disposeAerialPerspectiveCompositor();
            this._disposeGlobeAtmosphereCompositor();
        }
    }

    /**
     * The directional lights in the scene which represent the suns illuminating the atmosphere.
     * Each frame, the color and intensity of the lights are updated based on the camera position and the light's direction.
     */
    public get lights(): ReadonlyArray<DirectionalLight> {
        return this._lights;
    }

    /**
     * The rendering group ID for the sky compositor.
     * The sky will only be rendered for this group.
     */
    public get skyRenderingGroup(): number {
        return this._skyRenderingGroup;
    }

    public set skyRenderingGroup(value: number) {
        this._skyRenderingGroup = value;
        this.scene.renderingManager.getRenderingGroup(value);
    }

    /**
     * The rendering group ID for the aerial perspective compositor.
     * Aerial perspective will only be rendered for this group.
     */
    public get aerialPerspectiveRenderingGroup(): number {
        return this._aerialPerspectiveRenderingGroup;
    }

    public set aerialPerspectiveRenderingGroup(value: number) {
        this._aerialPerspectiveRenderingGroup = value;
        this.scene.renderingManager.getRenderingGroup(value);
    }

    /**
     * The rendering group ID for the globe atmosphere compositor.
     * The globe atmosphere will only be rendered for this group.
     */
    public get globeAtmosphereRenderingGroup(): number {
        return this._globeAtmosphereRenderingGroup;
    }

    public set globeAtmosphereRenderingGroup(value: number) {
        this._globeAtmosphereRenderingGroup = value;
        this.scene.renderingManager.getRenderingGroup(value);
    }

    /**
     * Gets the uniform buffer used to store the atmosphere's physical properties.
     */
    public get uniformBuffer(): UniformBuffer {
        if (this._atmosphereUbo === null) {
            const atmosphereUbo = (this._atmosphereUbo = new UniformBuffer(this._engine, undefined, true, "Atmosphere"));
            atmosphereUbo.addUniform("peakRayleighScattering", 3);
            atmosphereUbo.addUniform("planetRadius", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("peakMieScattering", 3);
            atmosphereUbo.addUniform("atmosphereThickness", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("peakMieAbsorption", 3);
            atmosphereUbo.addUniform("planetRadiusSquared", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("peakMieExtinction", 3);
            atmosphereUbo.addUniform("atmosphereRadius", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("peakOzoneAbsorption", 3);
            atmosphereUbo.addUniform("atmosphereRadiusSquared", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("horizonDistanceToAtmosphereEdge", 1);
            atmosphereUbo.addUniform("horizonDistanceToAtmosphereEdgeSquared", 1);
            atmosphereUbo.addUniform("planetRadiusWithOffset", 1);
            atmosphereUbo.addUniform("planetRadiusOffset", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("atmosphereExposure", 1);
            atmosphereUbo.addUniform("aerialPerspectiveRadianceBias", 1);
            atmosphereUbo.addUniform("inverseAtmosphereThickness", 1);
            atmosphereUbo.addUniform("aerialPerspectiveTransmittanceScale", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("inverseViewProjectionWithoutTranslation", 16);
            // 16-byte boundary
            atmosphereUbo.addUniform("directionToLight", 3);
            atmosphereUbo.addUniform("multiScatteringIntensity", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("directionToLightRelativeToCameraGeocentricNormal", 3);
            atmosphereUbo.addUniform("cameraRadius", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("lightRadianceAtCamera", 3);
            atmosphereUbo.addUniform("diffuseSkyIrradianceDesaturationFactor", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("groundAlbedo", 3);
            atmosphereUbo.addUniform("aerialPerspectiveSaturation", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("minMultiScattering", 3);
            atmosphereUbo.addUniform("diffuseSkyIrradianceIntensity", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("cameraPositionGlobal", 3);
            atmosphereUbo.addUniform("lightIntensity", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("clampedCameraPositionGlobal", 3);
            atmosphereUbo.addUniform("aerialPerspectiveIntensity", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("cameraGeocentricNormal", 3);
            atmosphereUbo.addUniform("clampedCameraRadius", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("cameraForward", 3);
            atmosphereUbo.addUniform("clampedCameraHeight", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("cameraPosition", 3);
            atmosphereUbo.addUniform("cosCameraHorizonAngleFromZenith", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("viewport", 4);
            // 16-byte boundary
            atmosphereUbo.addUniform("additionalDiffuseSkyIrradiance", 3);
            atmosphereUbo.addUniform("cameraHeight", 1);
            // 16-byte boundary
            atmosphereUbo.addUniform("cameraNearPlane", 1);
            atmosphereUbo.addUniform("originHeight", 1);
            atmosphereUbo.addUniform("sinCameraAtmosphereHorizonAngleFromNadir", 1);
            atmosphereUbo.create();
        }
        return this._atmosphereUbo;
    }

    /**
     * Gets the camera-related variables for this atmosphere. Updated each frame.
     */
    public get cameraAtmosphereVariables(): AtmospherePerCameraVariables {
        return this._cameraAtmosphereVariables;
    }

    /**
     * Constructs the {@link Atmosphere}.
     * @param name - The name of this instance.
     * @param scene - The scene to which the atmosphere will be added.
     * @param lights - The light sources that illuminate the atmosphere. Currently only supports one light, and that light should be the first light in the scene.
     * @param options - The options used to create the atmosphere.
     */
    public constructor(
        public readonly name: string,
        public readonly scene: Scene,
        lights: DirectionalLight[],
        options?: IAtmosphereOptions
    ) {
        const engine = (this._engine = scene.getEngine());

        if (!engine.isWebGPU && engine.version < 2) {
            throw new Error(`Atmosphere is not supported on WebGL ${engine.version}.`);
        }

        this._physicalProperties = options?.physicalProperties ?? new AtmospherePhysicalProperties();
        this._physicalProperties.onChangedObservable.add(() => {
            this._transmittanceLut?.markDirty();
        });

        if (lights.length !== 1) {
            throw new Error("Atmosphere only supports one light source currently.");
        }
        this._lights = lights;

        this.depthTexture = options?.depthTexture ?? null;
        this._exposure = options?.exposure ?? 1.0;
        this._isLinearSpaceLight = options?.isLinearSpaceLight ?? false;
        this._isLinearSpaceComposition = options?.isLinearSpaceComposition ?? false;
        this._applyApproximateTransmittance = options?.applyApproximateTransmittance ?? true;
        this._aerialPerspectiveRadianceBias = options?.aerialPerspectiveRadianceBias ?? 0.0;
        this._aerialPerspectiveTransmittanceScale = options?.aerialPerspectiveTransmittanceScale ?? 1.0;
        this._aerialPerspectiveSaturation = options?.aerialPerspectiveSaturation ?? 1.0;
        this._aerialPerspectiveIntensity = options?.aerialPerspectiveIntensity ?? 1.0;
        this._diffuseSkyIrradianceDesaturationFactor = options?.diffuseSkyIrradianceDesaturationFactor ?? 0.5;
        this._diffuseSkyIrradianceIntensity = options?.diffuseSkyIrradianceIntensity ?? 1.0;
        this._additionalDiffuseSkyIrradianceIntensity = options?.additionalDiffuseSkyIrradianceIntensity ?? 0.01;
        this._multiScatteringIntensity = options?.multiScatteringIntensity ?? 1.0;
        this._minimumMultiScatteringIntensity = options?.minimumMultiScatteringIntensity ?? 0.000618;
        this._isSkyViewLutEnabled = options?.isSkyViewLutEnabled ?? true;
        this._isAerialPerspectiveLutEnabled = options?.isAerialPerspectiveLutEnabled ?? true;
        this._originHeight = options?.originHeight ?? 0;
        this._additionalDiffuseSkyIrradianceColor = options?.additionalDiffuseSkyIrradianceColor
            ? new Color3().copyFrom(options.additionalDiffuseSkyIrradianceColor)
            : new Color3(163 / 255.0, 199 / 255.0, 1.0);
        this._groundAlbedo = options?.groundAlbedo ? new Color3().copyFrom(options.groundAlbedo) : new Color3().set(124.0 / 255.0, 165.0 / 255.0, 1.0);
        const minimumMultiScatteringColor = (this._minimumMultiScatteringColor = options?.minimumMultiScatteringColor
            ? new Color3().copyFrom(options.minimumMultiScatteringColor)
            : new Color3(30.0 / 255.0, 40.0 / 255.0, 77.0 / 255.0));

        this._skyRenderingGroup = options?.skyRenderingGroup ?? 0;
        this._aerialPerspectiveRenderingGroup = options?.aerialPerspectiveRenderingGroup ?? 0;
        this._globeAtmosphereRenderingGroup = options?.globeAtmosphereRenderingGroup ?? 0;

        this._additionalDiffuseSkyIrradianceColor.scaleToRef(this._additionalDiffuseSkyIrradianceIntensity, this._additionalDiffuseSkyIrradiance);
        this._minimumMultiScattering.x = minimumMultiScatteringColor.r * this._minimumMultiScatteringIntensity;
        this._minimumMultiScattering.y = minimumMultiScatteringColor.g * this._minimumMultiScatteringIntensity;
        this._minimumMultiScattering.z = minimumMultiScatteringColor.b * this._minimumMultiScatteringIntensity;

        // Initialize light direction and color.
        {
            const light = lights[0];
            this._directionToLight.copyFrom(light.direction).scaleInPlace(-1);
            const lightColor = this._linearLightColor.copyFrom(light.diffuse);
            if (!this._isLinearSpaceLight) {
                lightColor.toLinearSpaceToRef(lightColor);
            }
            const intensity = light.intensity;
            this._lightRadianceAtCamera.set(intensity * lightColor.r, intensity * lightColor.g, intensity * lightColor.b);
        }

        this._effectRenderer = new EffectRenderer(engine, {
            // Full screen triangle.
            indices: [0, 2, 1],
            positions: [-1, -1, -1, 3, 3, -1],
        });

        this._transmittanceLut = new TransmittanceLut(this);
        this._multiScatteringLutRenderTarget = CreateRenderTargetTexture("atmo-multiScattering", { width: 32, height: 32 }, scene);
        this._multiScatteringEffectWrapper = CreateMultiScatteringEffectWrapper(engine, this.uniformBuffer, this._groundAlbedo);
        this._isDiffuseSkyIrradianceLutEnabled = options?.isDiffuseSkyIrradianceLutEnabled ?? true;
        if (this._isDiffuseSkyIrradianceLutEnabled) {
            this._diffuseSkyIrradianceLut = new DiffuseSkyIrradianceLut(this);
        }
        if (this._isSkyViewLutEnabled) {
            this.skyViewLutRenderTarget!;
        }
        if (this._isAerialPerspectiveLutEnabled) {
            this.aerialPerspectiveLutRenderTarget!;
        }

        // Render global LUTs once per frame (not per camera).
        this._onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            this.renderGlobalLuts();
        });

        // Before rendering, make sure the per-camera variables have been updated.
        this._onBeforeCameraRenderObserver = scene.onBeforeCameraRenderObservable.add((x) => {
            this._updatePerCameraVariables(x);
            this._renderLutsForCamera(x);
        });

        {
            const renderingManager = scene.renderingManager;
            if (this._skyRenderingGroup >= 0) {
                renderingManager.getRenderingGroup(this._skyRenderingGroup);
            }
            if (this._aerialPerspectiveRenderingGroup >= 0) {
                renderingManager.getRenderingGroup(this._aerialPerspectiveRenderingGroup);
            }
            if (this._globeAtmosphereRenderingGroup >= 0) {
                renderingManager.getRenderingGroup(this._globeAtmosphereRenderingGroup);
            }

            // Mark all rendering groups as being "not empty" before rendering the corresponding targets.
            // This ensures onAfterRenderTargetsRenderObservable is called for empty groups,
            // which allows the atmosphere to be rendered even when the groups are otherwise empty e.g.,
            // a scene with only the atmosphere in it, and no other Meshes.
            this._onBeforeDrawPhaseObserver = scene.onBeforeDrawPhaseObservable.add(() => {
                if (this._skyRenderingGroup >= 0) {
                    renderingManager.getRenderingGroup(this._skyRenderingGroup)._empty = false;
                }
                if (this._aerialPerspectiveRenderingGroup >= 0) {
                    renderingManager.getRenderingGroup(this._aerialPerspectiveRenderingGroup)._empty = false;
                }
                if (this._globeAtmosphereRenderingGroup >= 0) {
                    renderingManager.getRenderingGroup(this._globeAtmosphereRenderingGroup)._empty = false;
                }
            });

            // Draw compositors after the respective rendering group.
            this._onAfterRenderingGroupObserver = scene.onAfterRenderingGroupObservable.add((group) => {
                if (group.renderingManager !== scene.renderingManager) {
                    return;
                }

                const groupId = group.renderingGroupId;

                if (this._skyRenderingGroup === groupId) {
                    this.drawSkyCompositor();
                }

                if (this._aerialPerspectiveRenderingGroup === groupId) {
                    this.drawAerialPerspectiveCompositor();
                }

                if (this._globeAtmosphereRenderingGroup === groupId) {
                    this.drawGlobeAtmosphereCompositor();
                }
            });
        }

        // Ensure the atmosphere is disposed when the scene is disposed.
        scene.onDisposeObservable.addOnce(() => {
            scene.removeExternalData("atmosphere");
            this.dispose();
        });
        scene.addExternalData("atmosphere", this);

        // Registers a material plugin which will allow common materials to sample the atmosphere environment maps e.g.,
        // sky view LUT for glossy reflections and diffuse sky illiminance LUT for irradiance.
        // It also handles aerial perspective application when Atmosphere is not provided with a depth texture.
        UnregisterMaterialPlugin(MaterialPlugin);
        RegisterMaterialPlugin(MaterialPlugin, (material) => {
            if (material.getClassName() === "PBRMaterial") {
                return new AtmospherePBRMaterialPlugin(material, this, this.depthTexture === null);
            }
            return null;
        });
    }

    /**
     * @override
     */
    public dispose(): void {
        this._onBeforeCameraRenderObserver?.remove();
        this._onBeforeCameraRenderObserver = null;
        this._onBeforeDrawPhaseObserver?.remove();
        this._onBeforeDrawPhaseObserver = null;
        this._onAfterRenderingGroupObserver?.remove();
        this._onAfterRenderingGroupObserver = null;
        this._onBeforeRenderObserver?.remove();
        this._onBeforeRenderObserver = null;
        this._globeAtmosphereCompositorEffectWrapper?.dispose();
        this._globeAtmosphereCompositorEffectWrapper = null;
        this._skyCompositorEffectWrapper?.dispose();
        this._skyCompositorEffectWrapper = null;
        this._aerialPerspectiveCompositorEffectWrapper?.dispose();
        this._aerialPerspectiveCompositorEffectWrapper = null;
        this._skyViewLutRenderTarget?.dispose();
        this._skyViewLutRenderTarget = null;
        this._skyViewLutEffectWrapper?.dispose();
        this._skyViewLutEffectWrapper = null;
        this._skyViewLutEffectRenderer?.dispose();
        this._skyViewLutEffectRenderer = null;
        this._aerialPerspectiveLutRenderTarget?.dispose();
        this._aerialPerspectiveLutRenderTarget = null;
        this._aerialPerspectiveLutEffectWrapper?.dispose();
        this._aerialPerspectiveLutEffectWrapper = null;
        this._aerialPerspectiveLutEffectRenderer?.dispose();
        this._aerialPerspectiveLutEffectRenderer = null;
        this._multiScatteringEffectWrapper?.dispose();
        this._multiScatteringEffectWrapper = null;
        this._multiScatteringLutRenderTarget?.dispose();
        this._multiScatteringLutRenderTarget = null;
        this._transmittanceLut?.dispose();
        this._transmittanceLut = null;
        this._diffuseSkyIrradianceLut?.dispose();
        this._diffuseSkyIrradianceLut = null;
        this._atmosphereUbo?.dispose();
        this._atmosphereUbo = null;
        this._effectRenderer?.dispose();
        this._effectRenderer = null;
        this._atmosphereUniformBufferAsArray.length = 0;

        UnregisterMaterialPlugin(MaterialPlugin);
    }

    /**
     * True if the atmosphere is enabled.
     * @returns - True if the atmosphere is enabled.
     */
    public isEnabled() {
        return this._isEnabled;
    }

    /**
     * Sets the enabled state of the atmosphere.
     * @param enabled - True to enable the atmosphere, false to disable it.
     */
    public setEnabled(enabled: boolean) {
        this._isEnabled = enabled;
    }

    /**
     * The class name of the {@link Atmosphere}.
     * @returns - The class name of the atmosphere.
     */
    public getClassName(): string {
        return "Atmosphere";
    }

    /**
     * Gets the color of a light after being transmitted through the atmosphere to a point specified by its distance to the planet center and its geocentric normal.
     * NOTE, the result is always a linear space color.
     * @param directionToLight - The direction of the light.
     * @param pointRadius - The distance from the planet center to the point in kilometers.
     * @param pointGeocentricNormal - The geocentric normal at the point i.e., normalize(point - planet center).
     * @param result - The color to store the result in.
     * @returns The result color.
     */
    public getTransmittedColorToRef = <T extends IColor3Like>(directionToLight: IVector3Like, pointRadius: number, pointGeocentricNormal: IVector3Like, result: T): T =>
        this._transmittanceLut!.getTransmittedColorToRef(directionToLight, pointRadius, pointGeocentricNormal, result);

    /**
     * Gets the diffuse sky irradiance. Result is always in linear space.
     * @param directionToLight - The direction of the point to the light.
     * @param pointRadius - The distance from the planet center to the point in kilometers.
     * @param pointGeocentricNormal - The geocentric normal at the point: normalize(point - planet center).
     * @param lightIrradiance - The irradiance of the light.
     * @param result - The color to store the result in.
     * @returns The result color.
     */
    public getDiffuseSkyIrradianceToRef = <T extends IColor3Like>(
        directionToLight: IVector3Like,
        pointRadius: number,
        pointGeocentricNormal: IVector3Like,
        lightIrradiance: number,
        result: T
    ): T =>
        this._diffuseSkyIrradianceLut?.getDiffuseSkyIrradianceToRef(directionToLight, pointRadius, pointGeocentricNormal, lightIrradiance, result) ??
        ((result.r = 0), (result.g = 0), (result.b = 0), result);
    /**
     * Draws the multiple scattering LUT using {@link EffectWrapper} and {@link EffectRenderer}.
     */
    private _drawMultiScatteringLut(): void {
        const transmittanceLut = this._transmittanceLut!.renderTarget;
        DrawEffect(
            this._engine,
            this._effectRenderer!,
            this._multiScatteringEffectWrapper,
            this._multiScatteringLutRenderTarget,
            (effectRenderer, renderTarget, effect, engine) => {
                this.bindUniformBufferToEffect(effect);
                engine.bindFramebuffer(renderTarget!, undefined, undefined, undefined, true);
                effectRenderer.bindBuffers(effect);
                effect.setTexture("transmittanceLut", transmittanceLut);
                effectRenderer.draw();
            }
        );
    }

    /**
     * Draws the aerial perspective compositor using {@link EffectWrapper} and {@link EffectRenderer}.
     */
    public drawAerialPerspectiveCompositor(): void {
        // Only works if we have a depth texture.
        if (this.depthTexture === null) {
            return;
        }

        const isEnabled = this.isEnabled();
        if (!isEnabled) {
            return;
        }

        const engine = this._engine;
        const effectWrapper = (this._aerialPerspectiveCompositorEffectWrapper ??= CreateAerialPerspectiveCompositorEffectWrapper(
            engine,
            this.uniformBuffer,
            this._isAerialPerspectiveLutEnabled,
            this._isSkyViewLutEnabled,
            this._isLinearSpaceComposition,
            this._applyApproximateTransmittance,
            this._aerialPerspectiveIntensity,
            this._aerialPerspectiveRadianceBias
        ));

        if (!this._isGlobalLutsReady) {
            return;
        }

        // Aerial perspective compositor only renders when inside the atmosphere.
        const isOutsideAtmosphere = this._cameraAtmosphereVariables.clampedCameraRadius > this._physicalProperties.atmosphereRadius;
        if (isOutsideAtmosphere) {
            return;
        }

        const skyViewLut = this._isSkyViewLutEnabled ? this.skyViewLutRenderTarget : null;
        const multiScatteringLut = this._multiScatteringLutRenderTarget!;
        const transmittanceLut = this._transmittanceLut!.renderTarget;
        const aerialPerspectiveLut = this._isAerialPerspectiveLutEnabled ? this.aerialPerspectiveLutRenderTarget : null;
        if (
            !effectWrapper.isReady() ||
            !(skyViewLut?.isReady() ?? true) ||
            !multiScatteringLut.isReady() ||
            !transmittanceLut.isReady() ||
            !(aerialPerspectiveLut?.isReady() ?? true) ||
            !this.depthTexture.isReady()
        ) {
            return;
        }

        DrawEffect(
            engine,
            this._effectRenderer!,
            effectWrapper,
            null, // No render target, it will render to the current buffer.
            (effectRenderer, _, effect) => {
                if (this.depthTexture === null) {
                    throw new Error("Depth texture is required for aerial perspective compositor.");
                }
                this.bindUniformBufferToEffect(effect);
                effectRenderer.bindBuffers(effect);
                effect.setTexture("transmittanceLut", transmittanceLut);
                effect.setTexture("multiScatteringLut", multiScatteringLut);
                if (this._isSkyViewLutEnabled) {
                    effect.setTexture("skyViewLut", skyViewLut);
                }
                if (this._isAerialPerspectiveLutEnabled) {
                    effect.setTexture("aerialPerspectiveLut", aerialPerspectiveLut);
                }
                effect.setTexture("depthTexture", this.depthTexture);
                effectRenderer.draw();
            },
            1, // depth to use in the compositor.
            this.applyApproximateTransmittance ? Constants.ALPHA_PREMULTIPLIED_PORTERDUFF : Constants.ALPHA_ONEONE,
            true, // depthTest
            false, // depthWrite
            Constants.ALWAYS, // depthFunction
            false // restoreDefaultFramebuffer
        );
    }

    /**
     * Draws the sky compositor using {@link EffectWrapper} and {@link EffectRenderer}.
     */
    public drawSkyCompositor(): void {
        const isEnabled = this.isEnabled();
        if (!isEnabled) {
            return;
        }

        const engine = this._engine;
        const effectWrapper = (this._skyCompositorEffectWrapper ??= CreateSkyCompositorEffectWrapper(
            engine,
            this.uniformBuffer,
            this._isSkyViewLutEnabled,
            this._isLinearSpaceComposition,
            this._applyApproximateTransmittance
        ));

        if (!this._isGlobalLutsReady) {
            return;
        }

        // The sky compositor only renders when inside the atmosphere.
        const isOutsideAtmosphere = this._cameraAtmosphereVariables.clampedCameraRadius > this._physicalProperties.atmosphereRadius;
        if (isOutsideAtmosphere) {
            return;
        }

        if (this.depthTexture !== null && !this.depthTexture.isReady()) {
            return;
        }

        const skyViewLut = this._isSkyViewLutEnabled ? this.skyViewLutRenderTarget : null;
        const multiScatteringLut = this._multiScatteringLutRenderTarget!;
        const transmittanceLut = this._transmittanceLut!.renderTarget;
        if (!effectWrapper.isReady() || !(skyViewLut?.isReady() ?? true) || !multiScatteringLut.isReady() || !transmittanceLut.isReady()) {
            return;
        }

        DrawEffect(
            engine,
            this._effectRenderer!,
            effectWrapper,
            null, // No render target, it will render to the current buffer.
            (effectRenderer, _, effect) => {
                this.bindUniformBufferToEffect(effect);
                effectRenderer.bindBuffers(effect);
                effect.setTexture("multiScatteringLut", multiScatteringLut);
                effect.setTexture("transmittanceLut", transmittanceLut);
                if (this._isSkyViewLutEnabled) {
                    effect.setTexture("skyViewLut", skyViewLut);
                }
                effectRenderer.draw();
            },
            1, // depth to use in the compositor.
            this._applyApproximateTransmittance ? Constants.ALPHA_PREMULTIPLIED_PORTERDUFF : Constants.ALPHA_ONEONE,
            true, // depthTest
            false, // depthWrite
            Constants.EQUAL, // depthFunction
            false // restoreDefaultFramebuffer
        );
    }

    /**
     * Draws the globe atmosphere compositor using {@link EffectWrapper} and {@link EffectRenderer}.
     */
    public drawGlobeAtmosphereCompositor(): void {
        const isEnabled = this.isEnabled();
        if (!isEnabled) {
            return;
        }

        const engine = this._engine;
        const effectWrapper = (this._globeAtmosphereCompositorEffectWrapper ??= CreateGlobeAtmosphereCompositorEffectWrapper(
            engine,
            this.uniformBuffer,
            this._isSkyViewLutEnabled,
            this._isLinearSpaceComposition,
            this._applyApproximateTransmittance,
            this._aerialPerspectiveIntensity,
            this._aerialPerspectiveRadianceBias,
            this.depthTexture !== null
        ));

        if (!this._isGlobalLutsReady) {
            return;
        }

        // Globe atmosphere compositor only renders when outside the atmosphere.
        const isOutsideAtmosphere = this._cameraAtmosphereVariables.clampedCameraRadius > this._physicalProperties.atmosphereRadius;
        if (!isOutsideAtmosphere) {
            return;
        }

        const skyViewLut = this._isSkyViewLutEnabled ? this.skyViewLutRenderTarget : null;
        const multiScatteringLut = this._multiScatteringLutRenderTarget!;
        const transmittanceLut = this._transmittanceLut!.renderTarget;
        if (!effectWrapper.isReady() || !(skyViewLut?.isReady() ?? true) || !multiScatteringLut.isReady() || !transmittanceLut.isReady()) {
            return;
        }

        if (this.depthTexture !== null && !this.depthTexture.isReady()) {
            return;
        }

        DrawEffect(
            engine,
            this._effectRenderer!,
            effectWrapper,
            null, // No render target, it will render to the current buffer.
            (effectRenderer, _, effect) => {
                this.bindUniformBufferToEffect(effect);
                effectRenderer.bindBuffers(effect);
                effect.setTexture("transmittanceLut", transmittanceLut);
                effect.setTexture("multiScatteringLut", multiScatteringLut);
                if (this._isSkyViewLutEnabled) {
                    effect.setTexture("skyViewLut", skyViewLut);
                }
                if (this.depthTexture !== null) {
                    effect.setTexture("depthTexture", this.depthTexture);
                }
                effectRenderer.draw();
            },
            1, // depth to use in the compositor.
            this._applyApproximateTransmittance ? Constants.ALPHA_PREMULTIPLIED_PORTERDUFF : Constants.ALPHA_ONEONE,
            true, // depthTest
            false, // depthWrite
            Constants.ALWAYS, // depthFunction
            false // restoreDefaultFramebuffer
        );
    }

    private _disposeSkyCompositor(): void {
        this._skyCompositorEffectWrapper?.dispose();
        this._skyCompositorEffectWrapper = null;
    }

    private _disposeAerialPerspectiveCompositor(): void {
        this._aerialPerspectiveCompositorEffectWrapper?.dispose();
        this._aerialPerspectiveCompositorEffectWrapper = null;
    }

    private _disposeGlobeAtmosphereCompositor(): void {
        this._globeAtmosphereCompositorEffectWrapper?.dispose();
        this._globeAtmosphereCompositorEffectWrapper = null;
    }

    private get _isGlobalLutsReady(): boolean {
        return (
            this._hasEverRenderedMultiScatteringLut &&
            !!this._transmittanceLut?.hasLutData &&
            (!this._isDiffuseSkyIrradianceLutEnabled || this._diffuseSkyIrradianceLut!.hasLutData)
        );
    }

    /**
     * Updates the camera variables that are specific to the atmosphere.
     * @param camera - The camera to update the variables for.
     */
    private _updatePerCameraVariables(camera: Camera): void {
        const light = this._lights[0];
        const directionToLight = this._directionToLight.copyFrom(light.direction).scaleInPlace(-1);

        const properties = this._physicalProperties;
        const cameraAtmosphereVariables = this._cameraAtmosphereVariables;
        cameraAtmosphereVariables.update(camera, properties.planetRadius, properties.planetRadiusWithOffset, properties.atmosphereRadius, directionToLight, this.originHeight);

        this._transmittanceLut!.updateLightParameters(light, cameraAtmosphereVariables.clampedCameraRadius, cameraAtmosphereVariables.cameraGeocentricNormal);
        this._linearLightColor.copyFrom(light.diffuse);

        this.getDiffuseSkyIrradianceToRef(directionToLight, 0, cameraAtmosphereVariables.cameraGeocentricNormal, light.intensity, this._tempSceneAmbient);
        if (!this.isLinearSpaceLight) {
            this._tempSceneAmbient.toGammaSpaceToRef(this._tempSceneAmbient);
        }
        this.scene.ambientColor = this._tempSceneAmbient;

        this.onAfterUpdateVariablesForCameraObservable.notifyObservers(camera);
    }

    /**
     * Renders the lookup tables, some of which can vary per-camera.
     * It is expected that updatePerCameraVariables was previously called.
     * @param camera - The camera to render the LUTs for.
     */
    private _renderLutsForCamera(camera: Camera): void {
        {
            this.onBeforeLightVariablesUpdateObservable.notifyObservers();

            const light = this.lights[0];
            if (!this.isLinearSpaceLight) {
                light.diffuse = light.diffuse.toGammaSpaceToRef(light.diffuse);
                light.specular = light.specular.toGammaSpaceToRef(light.specular);
            }
            const intensity = light.intensity;
            this._lightRadianceAtCamera.set(intensity * this._linearLightColor.r, intensity * this._linearLightColor.g, intensity * this._linearLightColor.b);
        }

        if (this.uniformBuffer.useUbo) {
            this.updateUniformBuffer();
        }

        // Render the LUTs.
        const isEnabled = this.isEnabled();
        {
            this.onBeforeRenderLutsForCameraObservable.notifyObservers(camera);

            // If atmosphere is enabled, render the per-camera LUTs (sky view and aerial perspective).
            if (isEnabled && !this._transmittanceLut!.isDirty && this._hasRenderedMultiScatteringLut) {
                if (this._isSkyViewLutEnabled) {
                    this._drawSkyViewLut();
                }

                if (this._isAerialPerspectiveLutEnabled) {
                    // Only need to render aerial perspective LUT when inside the atmosphere.
                    if (this._cameraAtmosphereVariables.clampedCameraRadius <= this._physicalProperties.atmosphereRadius) {
                        this._drawAerialPerspectiveLut();
                    } else {
                        // Make sure to clear the LUT to some initial value if this would have otherwise been the first time rendering it.
                        if (!this._aerialPerspectiveLutHasBeenRendered) {
                            this._clearAerialPerspectiveLut();
                        }
                    }
                    this._aerialPerspectiveLutHasBeenRendered = true;
                }
            }

            this.onAfterRenderLutsForCameraObservable.notifyObservers(camera);
        }
    }

    /**
     * Renders the lookup tables that do not depend on a camera position.
     */
    public renderGlobalLuts(): void {
        if (this.uniformBuffer.useUbo) {
            this.updateUniformBuffer();
        }

        const hasNewTransmittanceLut = this._transmittanceLut!.render();
        if (hasNewTransmittanceLut) {
            this._hasRenderedMultiScatteringLut = false;
            this._diffuseSkyIrradianceLut?.markDirty();
        }

        if (!this._transmittanceLut!.isDirty && !this._hasRenderedMultiScatteringLut) {
            this._multiScatteringEffectWrapper ??= CreateMultiScatteringEffectWrapper(this._engine, this.uniformBuffer, this._groundAlbedo);
            if (this._multiScatteringEffectWrapper?.isReady() && this._multiScatteringLutRenderTarget?.isReady()) {
                this._drawMultiScatteringLut();
                this._hasRenderedMultiScatteringLut = true;
                this._hasEverRenderedMultiScatteringLut = true;
            }
        }

        if (!this._transmittanceLut!.isDirty && this._hasRenderedMultiScatteringLut) {
            this._diffuseSkyIrradianceLut?.render(); // Will only render if needed.
        }
    }

    /**
     * Binds the atmosphere's uniform buffer to an {@link Effect}.
     * @param effect - The {@link Effect} to bind the uniform buffer to.
     */
    public bindUniformBufferToEffect(effect: Effect): void {
        const uniformBuffer = this.uniformBuffer;
        const isWGSL = effect.shaderLanguage === ShaderLanguage.WGSL;
        const blockName = isWGSL ? "atmosphere" : uniformBuffer.name;
        uniformBuffer.bindToEffect(effect, blockName);
        uniformBuffer.useUbo ? uniformBuffer.update() : this.updateUniformBuffer();
    }

    /**
     * Updates the values in the atmosphere's uniform buffer.
     */
    public updateUniformBuffer(): void {
        const physicalProperties = this._physicalProperties;
        const cameraAtmosphereVariables = this._cameraAtmosphereVariables;
        const ubo = this.uniformBuffer;

        ubo.updateVector3("peakRayleighScattering", physicalProperties.rayleighScattering);
        ubo.updateFloat("planetRadius", physicalProperties.planetRadius);
        ubo.updateVector3("peakMieScattering", physicalProperties.mieScattering);
        ubo.updateFloat("atmosphereThickness", physicalProperties.atmosphereThickness);
        ubo.updateVector3("peakMieAbsorption", physicalProperties.mieAbsorption);
        ubo.updateFloat("planetRadiusSquared", physicalProperties.planetRadiusSquared);
        ubo.updateVector3("peakMieExtinction", physicalProperties.mieExtinction);
        ubo.updateFloat("atmosphereRadius", physicalProperties.atmosphereRadius);
        ubo.updateVector3("peakOzoneAbsorption", physicalProperties.ozoneAbsorption);
        ubo.updateFloat("atmosphereRadiusSquared", physicalProperties.atmosphereRadiusSquared);
        ubo.updateFloat("horizonDistanceToAtmosphereEdge", physicalProperties.horizonDistanceToAtmosphereEdge);
        ubo.updateFloat("horizonDistanceToAtmosphereEdgeSquared", physicalProperties.horizonDistanceToAtmosphereEdgeSquared);
        ubo.updateFloat("planetRadiusWithOffset", physicalProperties.planetRadiusWithOffset);
        ubo.updateFloat("planetRadiusOffset", physicalProperties.planetRadiusOffset);
        ubo.updateFloat("aerialPerspectiveRadianceBias", this._aerialPerspectiveRadianceBias);
        ubo.updateFloat("inverseAtmosphereThickness", 1 / physicalProperties.atmosphereThickness);
        ubo.updateFloat("aerialPerspectiveTransmittanceScale", this._aerialPerspectiveTransmittanceScale);
        ubo.updateMatrix("inverseViewProjectionWithoutTranslation", cameraAtmosphereVariables.inverseViewProjectionMatrixWithoutTranslation);
        ubo.updateVector3("directionToLight", this._directionToLight);
        ubo.updateFloat("multiScatteringIntensity", this.multiScatteringIntensity);
        ubo.updateVector3("directionToLightRelativeToCameraGeocentricNormal", cameraAtmosphereVariables.directionToLightRelativeToCameraGeocentricNormal);
        ubo.updateFloat("cameraRadius", cameraAtmosphereVariables.cameraRadius);
        ubo.updateVector3("lightRadianceAtCamera", this._lightRadianceAtCamera);
        ubo.updateFloat("diffuseSkyIrradianceDesaturationFactor", this._diffuseSkyIrradianceDesaturationFactor);
        ubo.updateColor3("groundAlbedo", this._groundAlbedo);
        ubo.updateFloat("aerialPerspectiveSaturation", this._aerialPerspectiveSaturation);
        ubo.updateVector3("minMultiScattering", this._minimumMultiScattering);
        ubo.updateFloat("diffuseSkyIrradianceIntensity", this._diffuseSkyIrradianceIntensity);
        ubo.updateVector3("cameraPositionGlobal", cameraAtmosphereVariables.cameraPositionGlobal);
        ubo.updateFloat("lightIntensity", this.lights[0].getScaledIntensity());
        ubo.updateVector3("clampedCameraPositionGlobal", cameraAtmosphereVariables.clampedCameraPositionGlobal);
        ubo.updateFloat("aerialPerspectiveIntensity", this._aerialPerspectiveIntensity);
        ubo.updateVector3("cameraGeocentricNormal", cameraAtmosphereVariables.cameraGeocentricNormal);
        ubo.updateFloat("clampedCameraRadius", cameraAtmosphereVariables.clampedCameraRadius);
        ubo.updateVector3("cameraForward", cameraAtmosphereVariables.cameraForward);
        ubo.updateFloat("clampedCameraHeight", cameraAtmosphereVariables.clampedCameraHeight);
        ubo.updateVector3("cameraPosition", cameraAtmosphereVariables.cameraPosition);
        ubo.updateFloat("cosCameraHorizonAngleFromZenith", cameraAtmosphereVariables.cosCameraHorizonAngleFromZenith);
        ubo.updateVector4("viewport", cameraAtmosphereVariables.viewport);
        ubo.updateColor3("additionalDiffuseSkyIrradiance", this._additionalDiffuseSkyIrradiance);
        ubo.updateFloat("cameraHeight", cameraAtmosphereVariables.cameraHeight);
        ubo.updateFloat("cameraNearPlane", cameraAtmosphereVariables.cameraNearPlane);
        ubo.updateFloat("originHeight", this._originHeight);
        ubo.updateFloat("sinCameraAtmosphereHorizonAngleFromNadir", cameraAtmosphereVariables.sinCameraAtmosphereHorizonAngleFromNadir);
        ubo.updateFloat("atmosphereExposure", this._exposure);
    }

    /**
     * Draws the aerial perspective LUT using {@link EffectWrapper} and {@link EffectRenderer}.
     */
    private _drawAerialPerspectiveLut(): void {
        const transmittanceLut = this._transmittanceLut!.renderTarget;
        const multiScatteringLut = this._multiScatteringLutRenderTarget;
        DrawEffect(
            this._engine,
            this._effectRenderer!,
            this._aerialPerspectiveLutEffectWrapper,
            this._aerialPerspectiveLutRenderTarget,
            (effectRenderer, renderTarget, effect, engine) => {
                this.bindUniformBufferToEffect(effect);
                effect.setTexture("transmittanceLut", transmittanceLut);
                effect.setTexture("multiScatteringLut", multiScatteringLut);
                for (let layer = 0; layer < AerialPerspectiveLutLayers; layer++) {
                    engine.bindFramebuffer(renderTarget!, undefined, undefined, undefined, true, undefined, layer);
                    effectRenderer.bindBuffers(effect);
                    effect.setFloat("layerIdx", layer);
                    effectRenderer.draw();
                }
            }
        );
    }

    private _clearAerialPerspectiveLut(): void {
        const renderTarget = this._aerialPerspectiveLutRenderTarget?.renderTarget;
        if (renderTarget) {
            const engine = this._engine;
            const clearColor = { r: 0, g: 0, b: 0, a: 0 };
            for (let layer = 0; layer < AerialPerspectiveLutLayers; layer++) {
                engine.bindFramebuffer(renderTarget, undefined, undefined, undefined, true, undefined, layer);
                engine.clear(clearColor, true, false, false);
            }
        }
    }

    /**
     * Draws the sky view LUT using {@link EffectWrapper} and {@link EffectRenderer}.
     */
    private _drawSkyViewLut(): void {
        const transmittanceLut = this._transmittanceLut!.renderTarget;
        const multiScatteringLut = this._multiScatteringLutRenderTarget!;
        DrawEffect(this._engine, this._effectRenderer!, this._skyViewLutEffectWrapper, this._skyViewLutRenderTarget, (effectRenderer, renderTarget, effect, engine) => {
            this.bindUniformBufferToEffect(effect);
            engine.bindFramebuffer(renderTarget!, undefined, undefined, undefined, true);
            effectRenderer.bindBuffers(effect);
            effect.setTexture("transmittanceLut", transmittanceLut);
            effect.setTexture("multiScatteringLut", multiScatteringLut);
            effectRenderer.draw();
        });
    }
}

/**
 * Creates an {@link EffectWrapper} with the given parameters.
 * @param engine - The engine to use.
 * @param name - The name of the effect wrapper.
 * @param fragmentShader - The fragment shader source.
 * @param uniformNames - The uniform names to use.
 * @param samplerNames - The sampler names to use.
 * @param uniformBuffers - The uniform buffers to use.
 * @param defineNames - Array of define names to prepend with "#define ".
 * @returns The effect wrapper.
 */
const CreateEffectWrapper = (
    engine: AbstractEngine,
    name: string,
    fragmentShader: string,
    uniformNames?: string[],
    samplerNames?: string[],
    uniformBuffers?: string[],
    defineNames?: string[]
): EffectWrapper => {
    const defines = defineNames?.map((defineName) => `#define ${defineName}`) ?? [];
    return new EffectWrapper({
        engine,
        name,
        vertexShader: "fullscreenTriangle",
        fragmentShader,
        attributeNames: ["position"],
        uniformNames,
        uniformBuffers,
        samplerNames,
        defines,
        useShaderStore: true,
    });
};

const CreateMultiScatteringEffectWrapper = (engine: AbstractEngine, uniformBuffer: UniformBuffer, groundAlbedo: Color3): EffectWrapper => {
    const name = "atmo-multiScattering";
    const useUbo = uniformBuffer.useUbo;
    const useWebGPU = engine.isWebGPU && !EffectWrapper.ForceGLSL;
    const uboName = useWebGPU ? "atmosphere" : uniformBuffer.name;

    const defines = ["#define POSITION_VEC2"];
    if (!groundAlbedo.equals(Color3.BlackReadOnly)) {
        defines.push("#define USE_GROUND_ALBEDO");
    }

    return new EffectWrapper({
        engine,
        name,
        vertexShader: "fullscreenTriangle",
        fragmentShader: "multiScattering",
        attributeNames: ["position"],
        uniformNames: ["depth", ...(useUbo ? [] : uniformBuffer.getUniformNames())],
        uniformBuffers: useUbo ? [uboName] : [],
        samplerNames: ["transmittanceLut"],
        defines,
        useShaderStore: true,
        shaderLanguage: useWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        extraInitializations: (_, list) => {
            list.push(
                Promise.all(
                    useWebGPU
                        ? [import("./ShadersWGSL/fullscreenTriangle.vertex"), import("./ShadersWGSL/multiScattering.fragment")]
                        : [import("./Shaders/fullscreenTriangle.vertex"), import("./Shaders/multiScattering.fragment")]
                )
            );
        },
    });
};

const CreateRenderTargetTexture = (
    name: string,
    size: number | { width: number; height: number; layers?: number },
    scene: Scene,
    options?: RenderTargetTextureOptions
): RenderTargetTexture => {
    const caps = scene.getEngine().getCaps();
    const textureType = caps.textureHalfFloatRender
        ? Constants.TEXTURETYPE_HALF_FLOAT
        : caps.textureFloatRender
          ? Constants.TEXTURETYPE_FLOAT
          : Constants.TEXTURETYPE_UNSIGNED_BYTE;
    const rtOptions: RenderTargetTextureOptions = {
        generateMipMaps: false,
        generateDepthBuffer: false,
        generateStencilBuffer: false,
        gammaSpace: false,
        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        type: textureType,
        format: Constants.TEXTUREFORMAT_RGBA,
        ...options,
    };
    const renderTarget = new RenderTargetTexture(name, size, scene, rtOptions);

    renderTarget.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    renderTarget.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    renderTarget.anisotropicFilteringLevel = 1;
    renderTarget.skipInitialClear = true;
    return renderTarget;
};

/**
 * Common setup and teardown for drawing LUTs or composition passes.
 * @param engine - The engine to use.
 * @param effectRenderer - The effect renderer to use.
 * @param effectWrapper - The effect wrapper to use.
 * @param renderTarget - The render target.
 * @param drawCallback - Callback function that performs the drawing.
 * @param depth - The depth value to set in the effect.
 * @param alphaMode - The alpha mode to set before drawing.
 * @param depthTest - Whether to enable depth testing.
 * @param depthWrite - Optional depth write state to set before drawing.
 * @param depthFunction - The depth function to set before drawing.
 * @param restoreDefaultFramebuffer - Whether to restore the default framebuffer after drawing.
 */
const DrawEffect = (
    engine: AbstractEngine,
    effectRenderer: EffectRenderer,
    effectWrapper: Nullable<EffectWrapper>,
    renderTarget: Nullable<RenderTargetTexture>,
    drawCallback: (effectRenderer: EffectRenderer, renderTarget: Nullable<RenderTargetWrapper>, effect: Effect, engine: AbstractEngine) => void,
    depth = 0,
    alphaMode = Constants.ALPHA_DISABLE,
    depthTest = true,
    depthWrite?: boolean,
    depthFunction = Constants.LEQUAL,
    restoreDefaultFramebuffer = true
): void => {
    if ((renderTarget !== null && !renderTarget.isReady()) || !effectWrapper?.isReady()) {
        return;
    }

    effectRenderer.saveStates();

    // Set additional depth/stencil states before calling applyEffectWrapper.
    const currentDepthWrite = engine.getDepthWrite();
    if (depthWrite !== undefined) {
        engine.setDepthWrite(depthWrite);
    }
    const currentDepthFunction = engine.getDepthFunction();
    engine.setDepthFunction(depthFunction);

    // Likewise with the alpha mode, which can affect depth state too.
    const currentAlphaMode = engine.getAlphaMode();
    if (alphaMode !== Constants.ALPHA_DISABLE) {
        engine.setAlphaMode(alphaMode);
    }

    const currentCull = engine.depthCullingState.cull;

    effectRenderer.setViewport();
    effectRenderer.applyEffectWrapper(effectWrapper, depthTest); // Note, stencil is false by default.

    engine.depthCullingState.cull = false;

    const effect = effectWrapper.effect;

    effect.setFloat("depth", depth);

    // Call the specific drawing logic.
    drawCallback(effectRenderer, renderTarget?.renderTarget!, effect, engine);

    // Restore state (order matters!)
    engine.depthCullingState.cull = currentCull;
    engine.setAlphaMode(currentAlphaMode);
    if (currentDepthWrite !== undefined) {
        engine.setDepthWrite(currentDepthWrite);
    }
    if (currentDepthFunction) {
        engine.setDepthFunction(currentDepthFunction);
    }
    effectRenderer.restoreStates();

    // And restore the default framebuffer.
    if (restoreDefaultFramebuffer) {
        engine.restoreDefaultFramebuffer();
    }
};

/**
 * Creates an EffectWrapper for the sky compositor.
 * @param engine - The engine to use.
 * @param uniformBuffer - The uniform buffer to use.
 * @param isSkyViewLutEnabled - Whether the sky view LUT is enabled.
 * @param isLinearSpaceComposition - Whether composition is in linear space.
 * @param applyApproximateTransmittance - Whether to apply approximate transmittance.
 * @returns The created EffectWrapper.
 */
const CreateSkyCompositorEffectWrapper = (
    engine: AbstractEngine,
    uniformBuffer: UniformBuffer,
    isSkyViewLutEnabled: boolean,
    isLinearSpaceComposition: boolean,
    applyApproximateTransmittance: boolean
): EffectWrapper => {
    const useUbo = uniformBuffer.useUbo;
    const defines = ["POSITION_VEC2", "COMPUTE_WORLD_RAY"];
    if (isSkyViewLutEnabled) {
        defines.push("USE_SKY_VIEW_LUT");
    }
    if (!isLinearSpaceComposition) {
        defines.push("OUTPUT_TO_SRGB");
    }
    if (applyApproximateTransmittance) {
        defines.push("APPLY_TRANSMITTANCE_BLENDING");
    }
    const textures = isSkyViewLutEnabled ? ["skyViewLut"] : ["transmittanceLut", "multiScatteringLut"];
    return CreateEffectWrapper(
        engine,
        "atmo-skyCompositor",
        "compositeSky",
        ["depth", ...(useUbo ? [] : uniformBuffer.getUniformNames())],
        textures,
        useUbo ? [uniformBuffer.name] : [],
        defines
    );
};

/**
 * Creates an EffectWrapper for the aerial perspective LUT.
 * @param engine - The engine to use.
 * @param uniformBuffer - The uniform buffer to use.
 * @returns The created EffectWrapper.
 */
const CreateAerialPerspectiveEffectWrapper = (engine: AbstractEngine, uniformBuffer: UniformBuffer): EffectWrapper =>
    CreateEffectWrapper(
        engine,
        "atmo-aerialPerspective",
        "aerialPerspective",
        ["layerIdx", "depth", ...(uniformBuffer.useUbo ? [] : uniformBuffer.getUniformNames())],
        ["transmittanceLut", "multiScatteringLut"],
        uniformBuffer.useUbo ? [uniformBuffer.name] : [],
        ["POSITION_VEC2", "COMPUTE_WORLD_RAY"]
    );

/**
 * Creates an EffectWrapper for the aerial perspective compositor.
 * @param engine - The engine to use.
 * @param uniformBuffer - The uniform buffer.
 * @param isAerialPerspectiveLutEnabled - Whether the aerial perspective LUT is enabled.
 * @param isSkyViewLutEnabled - Whether the sky view LUT is enabled.
 * @param isLinearSpaceComposition - Whether composition is in linear space.
 * @param applyApproximateTransmittance - Whether to apply approximate transmittance.
 * @param aerialPerspectiveIntensity - The aerial perspective intensity.
 * @param aerialPerspectiveRadianceBias - The aerial perspective radiance bias.
 * @returns The created EffectWrapper.
 */
const CreateAerialPerspectiveCompositorEffectWrapper = (
    engine: AbstractEngine,
    uniformBuffer: UniformBuffer,
    isAerialPerspectiveLutEnabled: boolean,
    isSkyViewLutEnabled: boolean,
    isLinearSpaceComposition: boolean,
    applyApproximateTransmittance: boolean,
    aerialPerspectiveIntensity: number,
    aerialPerspectiveRadianceBias: number
): EffectWrapper => {
    const useUbo = uniformBuffer.useUbo;
    const defines = ["POSITION_VEC2", "COMPUTE_WORLD_RAY"];
    if (isAerialPerspectiveLutEnabled) {
        defines.push("USE_AERIAL_PERSPECTIVE_LUT");
    }
    if (isSkyViewLutEnabled) {
        defines.push("USE_SKY_VIEW_LUT");
    }
    if (aerialPerspectiveIntensity !== 1) {
        defines.push("APPLY_AERIAL_PERSPECTIVE_INTENSITY");
    }
    if (!isLinearSpaceComposition) {
        defines.push("OUTPUT_TO_SRGB");
    }
    if (applyApproximateTransmittance) {
        defines.push("APPLY_TRANSMITTANCE_BLENDING");
    }
    if (aerialPerspectiveRadianceBias !== 0.0) {
        defines.push("APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS");
    }

    const samplers = ["transmittanceLut", "multiScatteringLut", "depthTexture"];
    if (isSkyViewLutEnabled) {
        samplers.push("skyViewLut");
    }
    if (isAerialPerspectiveLutEnabled) {
        samplers.push("aerialPerspectiveLut");
    }

    return CreateEffectWrapper(
        engine,
        "atmo-aerialPerspectiveCompositor",
        "compositeAerialPerspective",
        ["depth", ...(useUbo ? [] : uniformBuffer.getUniformNames())],
        samplers,
        useUbo ? [uniformBuffer.name] : [],
        defines
    );
};

/**
 * Creates an EffectWrapper for the globe atmosphere compositor.
 * @param engine - The engine to use.
 * @param uniformBuffer - The uniform buffer to use.
 * @param isSkyViewLutEnabled - Whether the sky view LUT is enabled.
 * @param isLinearSpaceComposition - Whether composition is in linear space.
 * @param applyApproximateTransmittance - Whether to apply approximate transmittance.
 * @param aerialPerspectiveIntensity - The aerial perspective intensity.
 * @param aerialPerspectiveRadianceBias - The aerial perspective radiance bias.
 * @param hasDepthTexture - Whether a depth texture is available.
 * @returns The created EffectWrapper.
 */
const CreateGlobeAtmosphereCompositorEffectWrapper = (
    engine: AbstractEngine,
    uniformBuffer: UniformBuffer,
    isSkyViewLutEnabled: boolean,
    isLinearSpaceComposition: boolean,
    applyApproximateTransmittance: boolean,
    aerialPerspectiveIntensity: number,
    aerialPerspectiveRadianceBias: number,
    hasDepthTexture: boolean
): EffectWrapper => {
    const useUbo = uniformBuffer.useUbo;
    const defines = ["POSITION_VEC2", "COMPUTE_WORLD_RAY"];
    if (isSkyViewLutEnabled) {
        defines.push("USE_SKY_VIEW_LUT");
    }
    if (aerialPerspectiveIntensity !== 1) {
        defines.push("APPLY_AERIAL_PERSPECTIVE_INTENSITY");
    }
    if (!isLinearSpaceComposition) {
        defines.push("OUTPUT_TO_SRGB");
    }
    if (hasDepthTexture) {
        defines.push("HAS_DEPTH_TEXTURE");
    }
    if (applyApproximateTransmittance) {
        defines.push("APPLY_TRANSMITTANCE_BLENDING");
    }
    if (aerialPerspectiveRadianceBias !== 0.0) {
        defines.push("APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS");
    }

    const samplers = ["transmittanceLut", "multiScatteringLut"];
    if (isSkyViewLutEnabled) {
        samplers.push("skyViewLut");
    }
    if (hasDepthTexture) {
        samplers.push("depthTexture");
    }

    return CreateEffectWrapper(
        engine,
        "atmo-globeAtmosphereCompositor",
        "compositeGlobeAtmosphere",
        ["depth", ...(useUbo ? [] : uniformBuffer.getUniformNames())],
        samplers,
        useUbo ? [uniformBuffer.name] : [],
        defines
    );
};

/**
 * Creates an EffectWrapper for the sky view LUT.
 * @param engine - The engine to use.
 * @param uniformBuffer - The uniform buffer to use.
 * @returns The created EffectWrapper.
 */
const CreateSkyViewEffectWrapper = (engine: AbstractEngine, uniformBuffer: UniformBuffer): EffectWrapper =>
    CreateEffectWrapper(
        engine,
        "atmo-skyView",
        "skyView",
        ["depth", ...(uniformBuffer.useUbo ? [] : uniformBuffer.getUniformNames())],
        ["transmittanceLut", "multiScatteringLut"],
        uniformBuffer.useUbo ? [uniformBuffer.name] : [],
        ["POSITION_VEC2"]
    );
