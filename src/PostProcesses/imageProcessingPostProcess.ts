import { Nullable } from "../types";
import { Observer } from "../Misc/observable";
import { serialize } from "../Misc/decorators";
import { Color4 } from "../Maths/math.color";
import { Camera } from "../Cameras/camera";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { Effect } from "../Materials/effect";
import { ColorCurves } from "../Materials/colorCurves";
import { ImageProcessingConfiguration, IImageProcessingConfigurationDefines } from "../Materials/imageProcessingConfiguration";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { EngineStore } from "../Engines/engineStore";
import { Constants } from "../Engines/constants";

import "../Shaders/imageProcessing.fragment";
import "../Shaders/postprocess.vertex";

/**
 * ImageProcessingPostProcess
 * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#imageprocessing
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
            var scene = null;
            var engine = this.getEngine();
            var camera = this.getCamera();

            if (camera) {
                scene = camera.getScene();
            }
            else if (engine && engine.scenes) {
                var scenes = engine.scenes;
                scene = scenes[scenes.length - 1];
            }
            else {
                scene = EngineStore.LastCreatedScene;
            }

            if (scene) {
                this._imageProcessingConfiguration = scene.imageProcessingConfiguration;
            }
            else {
                this._imageProcessingConfiguration = new ImageProcessingConfiguration();
            }
        }
        else {
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
    public get isSupported(): boolean {
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
     * Gets wether the color curves effect is enabled.
     */
    public get colorCurvesEnabled(): boolean {
        return this.imageProcessingConfiguration.colorCurvesEnabled;
    }
    /**
     * Sets wether the color curves effect is enabled.
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
     * Gets wether the color grading effect is enabled.
     */
    public get colorGradingEnabled(): boolean {
        return this.imageProcessingConfiguration.colorGradingEnabled;
    }
    /**
     * Gets wether the color grading effect is enabled.
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
     * Gets wether tonemapping is enabled or not.
     */
    public get toneMappingEnabled(): boolean {
        return this._imageProcessingConfiguration.toneMappingEnabled;
    }
    /**
     * Sets wether tonemapping is enabled or not
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
     * Gets Vignette centre X Offset.
     */
    public get vignetteCentreX(): number {
        return this.imageProcessingConfiguration.vignetteCentreX;
    }
    /**
     * Sets Vignette centre X Offset.
     */
    public set vignetteCentreX(value: number) {
        this.imageProcessingConfiguration.vignetteCentreX = value;
    }

    /**
     * Gets Vignette centre Y Offset.
     */
    public get vignetteCentreY(): number {
        return this.imageProcessingConfiguration.vignetteCentreY;
    }
    /**
     * Sets Vignette centre Y Offset.
     */
    public set vignetteCentreY(value: number) {
        this.imageProcessingConfiguration.vignetteCentreY = value;
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
     * Gets wether the vignette effect is enabled.
     */
    public get vignetteEnabled(): boolean {
        return this.imageProcessingConfiguration.vignetteEnabled;
    }
    /**
     * Sets wether the vignette effect is enabled.
     */
    public set vignetteEnabled(value: boolean) {
        this.imageProcessingConfiguration.vignetteEnabled = value;
    }

    @serialize()
    private _fromLinearSpace = true;
    /**
     * Gets wether the input of the processing is in Gamma or Linear Space.
     */
    public get fromLinearSpace(): boolean {
        return this._fromLinearSpace;
    }
    /**
     * Sets wether the input of the processing is in Gamma or Linear Space.
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
        TONEMAPPING: false,
        TONEMAPPING_ACES: false,
        CONTRAST: false,
        COLORCURVES: false,
        COLORGRADING: false,
        COLORGRADING3D: false,
        FROMLINEARSPACE: false,
        SAMPLER3DGREENDEPTH: false,
        SAMPLER3DBGRMAP: false,
        IMAGEPROCESSINGPOSTPROCESS: false,
        EXPOSURE: false,
    };

    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, imageProcessingConfiguration?: ImageProcessingConfiguration) {
        super(name, "imageProcessing", [], [], options, camera, samplingMode, engine, reusable,
            null, textureType, "postprocess", null, true);

        // Setup the configuration as forced by the constructor. This would then not force the
        // scene materials output in linear space and let untouched the default forward pass.
        if (imageProcessingConfiguration) {
            imageProcessingConfiguration.applyByPostProcess = true;
            this._attachImageProcessingConfiguration(imageProcessingConfiguration, true);
            // This will cause the shader to be compiled
            this.fromLinearSpace = false;
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
    /**
     *  "ImageProcessingPostProcess"
     * @returns "ImageProcessingPostProcess"
     */
    public getClassName(): string {
        return "ImageProcessingPostProcess";
    }

    protected _updateParameters(): void {
        this._defines.FROMLINEARSPACE = this._fromLinearSpace;
        this.imageProcessingConfiguration.prepareDefines(this._defines, true);
        var defines = "";
        for (const define in this._defines) {
            if ((<any>this._defines)[define]) {
                defines += `#define ${define};\r\n`;
            }
        }

        var samplers = ["textureSampler"];
        var uniforms = ["scale"];

        if (ImageProcessingConfiguration) {
            ImageProcessingConfiguration.PrepareSamplers(samplers, this._defines);
            ImageProcessingConfiguration.PrepareUniforms(uniforms, this._defines);
        }

        this.updateEffect(defines, uniforms, samplers);
    }

    public dispose(camera?: Camera): void {
        super.dispose(camera);

        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        if (this._imageProcessingConfiguration) {
            this.imageProcessingConfiguration.applyByPostProcess = false;
        }
    }
}
