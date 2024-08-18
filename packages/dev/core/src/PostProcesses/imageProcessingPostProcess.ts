/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../types";
import type { Observer } from "../Misc/observable";
import { serialize } from "../Misc/decorators";
import type { Color4 } from "../Maths/math.color";
import type { Camera } from "../Cameras/camera";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Effect } from "../Materials/effect";
import type { ColorCurves } from "../Materials/colorCurves";
import type { IImageProcessingConfigurationDefines } from "../Materials/imageProcessingConfiguration.defines";
import { ImageProcessingConfiguration } from "../Materials/imageProcessingConfiguration";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "../Engines/engineStore";
import { Constants } from "../Engines/constants";

/**
 * ImageProcessingPostProcess
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#imageprocessing
 */
export class ImageProcessingPostProcess extends PostProcess {
    /**
     * Default configuration related to image processing available in the PBR Material.
     */
    protected _imageProcessingConfiguration: ImageProcessingConfiguration;

    /**
     * Gets the image processing configuration used either in this material.
     */
    public get imageProcessingConfiguration(): ImageProcessingConfiguration {
        return this._imageProcessingConfiguration;
    }

    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    public set imageProcessingConfiguration(value: ImageProcessingConfiguration) {
        // We are almost sure it is applied by post process as
        // We are in the post process :-)
        value.applyByPostProcess = true;
        this._attachImageProcessingConfiguration(value);
    }

    /**
     * Keep track of the image processing observer to allow dispose and replace.
     */
    private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>>;

    /**
     * Attaches a new image processing configuration to the PBR Material.
     * @param configuration
     * @param doNotBuild
     */
    protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>, doNotBuild = false): void {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }

        // Detaches observer.
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        // Pick the scene configuration if needed.
        if (!configuration) {
            let scene = null;
            const engine = this.getEngine();
            const camera = this.getCamera();

            if (camera) {
                scene = camera.getScene();
            } else if (engine && engine.scenes) {
                const scenes = engine.scenes;
                scene = scenes[scenes.length - 1];
            } else {
                scene = EngineStore.LastCreatedScene;
            }

            if (scene) {
                this._imageProcessingConfiguration = scene.imageProcessingConfiguration;
            } else {
                this._imageProcessingConfiguration = new ImageProcessingConfiguration();
            }
        } else {
            this._imageProcessingConfiguration = configuration;
        }

        // Attaches observer.
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._updateParameters();
            });
        }

        // Ensure the effect will be rebuilt.
        if (!doNotBuild) {
            this._updateParameters();
        }
    }

    /**
     * If the post process is supported.
     */
    public override get isSupported(): boolean {
        const effect = this.getEffect();
        return !effect || effect.isSupported;
    }

    /**
     * Gets Color curves setup used in the effect if colorCurvesEnabled is set to true .
     */
    public get colorCurves(): Nullable<ColorCurves> {
        return this.imageProcessingConfiguration.colorCurves;
    }
    /**
     * Sets Color curves setup used in the effect if colorCurvesEnabled is set to true .
     */
    public set colorCurves(value: Nullable<ColorCurves>) {
        this.imageProcessingConfiguration.colorCurves = value;
    }

    /**
     * Gets whether the color curves effect is enabled.
     */
    public get colorCurvesEnabled(): boolean {
        return this.imageProcessingConfiguration.colorCurvesEnabled;
    }
    /**
     * Sets whether the color curves effect is enabled.
     */
    public set colorCurvesEnabled(value: boolean) {
        this.imageProcessingConfiguration.colorCurvesEnabled = value;
    }

    /**
     * Gets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
     */
    public get colorGradingTexture(): Nullable<BaseTexture> {
        return this.imageProcessingConfiguration.colorGradingTexture;
    }
    /**
     * Sets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
     */
    public set colorGradingTexture(value: Nullable<BaseTexture>) {
        this.imageProcessingConfiguration.colorGradingTexture = value;
    }

    /**
     * Gets whether the color grading effect is enabled.
     */
    public get colorGradingEnabled(): boolean {
        return this.imageProcessingConfiguration.colorGradingEnabled;
    }
    /**
     * Gets whether the color grading effect is enabled.
     */
    public set colorGradingEnabled(value: boolean) {
        this.imageProcessingConfiguration.colorGradingEnabled = value;
    }

    /**
     * Gets exposure used in the effect.
     */
    public get exposure(): number {
        return this.imageProcessingConfiguration.exposure;
    }
    /**
     * Sets exposure used in the effect.
     */
    public set exposure(value: number) {
        this.imageProcessingConfiguration.exposure = value;
    }

    /**
     * Gets whether tonemapping is enabled or not.
     */
    public get toneMappingEnabled(): boolean {
        return this._imageProcessingConfiguration.toneMappingEnabled;
    }
    /**
     * Sets whether tonemapping is enabled or not
     */
    public set toneMappingEnabled(value: boolean) {
        this._imageProcessingConfiguration.toneMappingEnabled = value;
    }

    /**
     * Gets the type of tone mapping effect.
     */
    public get toneMappingType(): number {
        return this._imageProcessingConfiguration.toneMappingType;
    }
    /**
     * Sets the type of tone mapping effect.
     */
    public set toneMappingType(value: number) {
        this._imageProcessingConfiguration.toneMappingType = value;
    }

    /**
     * Gets contrast used in the effect.
     */
    public get contrast(): number {
        return this.imageProcessingConfiguration.contrast;
    }
    /**
     * Sets contrast used in the effect.
     */
    public set contrast(value: number) {
        this.imageProcessingConfiguration.contrast = value;
    }

    /**
     * Gets Vignette stretch size.
     */
    public get vignetteStretch(): number {
        return this.imageProcessingConfiguration.vignetteStretch;
    }
    /**
     * Sets Vignette stretch size.
     */
    public set vignetteStretch(value: number) {
        this.imageProcessingConfiguration.vignetteStretch = value;
    }

    /**
     * Gets Vignette center X Offset.
     * @deprecated use vignetteCenterX instead
     */
    public get vignetteCentreX(): number {
        return this.imageProcessingConfiguration.vignetteCenterX;
    }
    /**
     * Sets Vignette center X Offset.
     * @deprecated use vignetteCenterX instead
     */
    public set vignetteCentreX(value: number) {
        this.imageProcessingConfiguration.vignetteCenterX = value;
    }

    /**
     * Gets Vignette center Y Offset.
     * @deprecated use vignetteCenterY instead
     */
    public get vignetteCentreY(): number {
        return this.imageProcessingConfiguration.vignetteCenterY;
    }
    /**
     * Sets Vignette center Y Offset.
     * @deprecated use vignetteCenterY instead
     */
    public set vignetteCentreY(value: number) {
        this.imageProcessingConfiguration.vignetteCenterY = value;
    }

    /**
     * Vignette center Y Offset.
     */
    public get vignetteCenterY(): number {
        return this.imageProcessingConfiguration.vignetteCenterY;
    }
    public set vignetteCenterY(value: number) {
        this.imageProcessingConfiguration.vignetteCenterY = value;
    }

    /**
     * Vignette center X Offset.
     */
    public get vignetteCenterX(): number {
        return this.imageProcessingConfiguration.vignetteCenterX;
    }
    public set vignetteCenterX(value: number) {
        this.imageProcessingConfiguration.vignetteCenterX = value;
    }

    /**
     * Gets Vignette weight or intensity of the vignette effect.
     */
    public get vignetteWeight(): number {
        return this.imageProcessingConfiguration.vignetteWeight;
    }
    /**
     * Sets Vignette weight or intensity of the vignette effect.
     */
    public set vignetteWeight(value: number) {
        this.imageProcessingConfiguration.vignetteWeight = value;
    }

    /**
     * Gets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
     * if vignetteEnabled is set to true.
     */
    public get vignetteColor(): Color4 {
        return this.imageProcessingConfiguration.vignetteColor;
    }
    /**
     * Sets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
     * if vignetteEnabled is set to true.
     */
    public set vignetteColor(value: Color4) {
        this.imageProcessingConfiguration.vignetteColor = value;
    }

    /**
     * Gets Camera field of view used by the Vignette effect.
     */
    public get vignetteCameraFov(): number {
        return this.imageProcessingConfiguration.vignetteCameraFov;
    }
    /**
     * Sets Camera field of view used by the Vignette effect.
     */
    public set vignetteCameraFov(value: number) {
        this.imageProcessingConfiguration.vignetteCameraFov = value;
    }

    /**
     * Gets the vignette blend mode allowing different kind of effect.
     */
    public get vignetteBlendMode(): number {
        return this.imageProcessingConfiguration.vignetteBlendMode;
    }
    /**
     * Sets the vignette blend mode allowing different kind of effect.
     */
    public set vignetteBlendMode(value: number) {
        this.imageProcessingConfiguration.vignetteBlendMode = value;
    }

    /**
     * Gets whether the vignette effect is enabled.
     */
    public get vignetteEnabled(): boolean {
        return this.imageProcessingConfiguration.vignetteEnabled;
    }
    /**
     * Sets whether the vignette effect is enabled.
     */
    public set vignetteEnabled(value: boolean) {
        this.imageProcessingConfiguration.vignetteEnabled = value;
    }

    /**
     * Gets intensity of the dithering effect.
     */
    public get ditheringIntensity(): number {
        return this.imageProcessingConfiguration.ditheringIntensity;
    }
    /**
     * Sets intensity of the dithering effect.
     */
    public set ditheringIntensity(value: number) {
        this.imageProcessingConfiguration.ditheringIntensity = value;
    }

    /**
     * Gets whether the dithering effect is enabled.
     */
    public get ditheringEnabled(): boolean {
        return this.imageProcessingConfiguration.ditheringEnabled;
    }
    /**
     * Sets whether the dithering effect is enabled.
     */
    public set ditheringEnabled(value: boolean) {
        this.imageProcessingConfiguration.ditheringEnabled = value;
    }

    @serialize()
    private _fromLinearSpace = true;
    /**
     * Gets whether the input of the processing is in Gamma or Linear Space.
     */
    public get fromLinearSpace(): boolean {
        return this._fromLinearSpace;
    }
    /**
     * Sets whether the input of the processing is in Gamma or Linear Space.
     */
    public set fromLinearSpace(value: boolean) {
        if (this._fromLinearSpace === value) {
            return;
        }

        this._fromLinearSpace = value;
        this._updateParameters();
    }

    /**
     * Defines cache preventing GC.
     */
    private _defines: IImageProcessingConfigurationDefines & { FROMLINEARSPACE: boolean } = {
        IMAGEPROCESSING: false,
        VIGNETTE: false,
        VIGNETTEBLENDMODEMULTIPLY: false,
        VIGNETTEBLENDMODEOPAQUE: false,
        TONEMAPPING: 0,
        CONTRAST: false,
        COLORCURVES: false,
        COLORGRADING: false,
        COLORGRADING3D: false,
        FROMLINEARSPACE: false,
        SAMPLER3DGREENDEPTH: false,
        SAMPLER3DBGRMAP: false,
        DITHER: false,
        IMAGEPROCESSINGPOSTPROCESS: false,
        EXPOSURE: false,
        SKIPFINALCOLORCLAMP: false,
    };

    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        imageProcessingConfiguration?: ImageProcessingConfiguration
    ) {
        super(name, "imageProcessing", [], [], options, camera, samplingMode, engine, reusable, null, textureType, "postprocess", null, true);

        // Setup the configuration as forced by the constructor. This would then not force the
        // scene materials output in linear space and let untouched the default forward pass.
        if (imageProcessingConfiguration) {
            imageProcessingConfiguration.applyByPostProcess = true;
            this._attachImageProcessingConfiguration(imageProcessingConfiguration, true);
            // This will cause the shader to be compiled
            this._updateParameters();
        }
        // Setup the default processing configuration to the scene.
        else {
            this._attachImageProcessingConfiguration(null, true);
            this.imageProcessingConfiguration.applyByPostProcess = true;
        }

        this.onApply = (effect: Effect) => {
            this.imageProcessingConfiguration.bind(effect, this.aspectRatio);
        };
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/imageProcessing.fragment"));
        } else {
            list.push(import("../Shaders/imageProcessing.fragment"));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     *  "ImageProcessingPostProcess"
     * @returns "ImageProcessingPostProcess"
     */
    public override getClassName(): string {
        return "ImageProcessingPostProcess";
    }

    /**
     * @internal
     */
    public _updateParameters(): void {
        this._defines.FROMLINEARSPACE = this._fromLinearSpace;
        this.imageProcessingConfiguration.prepareDefines(this._defines, true);
        let defines = "";
        for (const prop in this._defines) {
            const value = (<any>this._defines)[prop];
            const type = typeof value;

            switch (type) {
                case "number":
                case "string":
                    defines += `#define ${prop} ${value};\n`;
                    break;
                default:
                    if (value) {
                        defines += `#define ${prop};\n`;
                    }
                    break;
            }
        }

        const samplers = ["textureSampler"];
        const uniforms = ["scale"];

        if (ImageProcessingConfiguration) {
            ImageProcessingConfiguration.PrepareSamplers(samplers, this._defines);
            ImageProcessingConfiguration.PrepareUniforms(uniforms, this._defines);
        }

        this.updateEffect(defines, uniforms, samplers);
    }

    public override dispose(camera?: Camera): void {
        super.dispose(camera);

        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        if (this._imageProcessingConfiguration) {
            this.imageProcessingConfiguration.applyByPostProcess = false;
        }
    }
}
