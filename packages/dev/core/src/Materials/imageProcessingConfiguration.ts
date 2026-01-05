/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, serializeAsTexture, serializeAsColorCurves, serializeAsColor4 } from "../Misc/decorators";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import { Color4 } from "../Maths/math.color";
import { ColorCurves } from "../Materials/colorCurves";

import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Effect } from "../Materials/effect";
import { Mix } from "../Misc/tools.functions";
import { SerializationHelper } from "../Misc/decorators.serialization";
import type { IImageProcessingConfigurationDefines } from "./imageProcessingConfiguration.defines";
import { PrepareSamplersForImageProcessing, PrepareUniformsForImageProcessing } from "./imageProcessingConfiguration.functions";
import { RegisterClass } from "../Misc/typeStore";

/**
 * This groups together the common properties used for image processing either in direct forward pass
 * or through post processing effect depending on the use of the image processing pipeline in your scene
 * or not.
 */
export class ImageProcessingConfiguration {
    /**
     * Default tone mapping applied in BabylonJS.
     */
    public static readonly TONEMAPPING_STANDARD = 0;

    /**
     * ACES Tone mapping (used by default in unreal and unity). This can help getting closer
     * to other engines rendering to increase portability.
     */
    public static readonly TONEMAPPING_ACES = 1;

    /**
     * Neutral Tone mapping developped by the Khronos group in order to constrain
     * values between 0 and 1 without shifting Hue.
     */
    public static readonly TONEMAPPING_KHR_PBR_NEUTRAL = 2;

    /**
     * Color curves setup used in the effect if colorCurvesEnabled is set to true
     */
    @serializeAsColorCurves()
    public colorCurves: Nullable<ColorCurves> = new ColorCurves();

    @serialize()
    private _colorCurvesEnabled = false;
    /**
     * Gets whether the color curves effect is enabled.
     */
    public get colorCurvesEnabled(): boolean {
        return this._colorCurvesEnabled;
    }
    /**
     * Sets whether the color curves effect is enabled.
     */
    public set colorCurvesEnabled(value: boolean) {
        if (this._colorCurvesEnabled === value) {
            return;
        }

        this._colorCurvesEnabled = value;
        this._updateParameters();
    }

    @serializeAsTexture("colorGradingTexture")
    private _colorGradingTexture: Nullable<BaseTexture>;
    /**
     * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
     */
    public get colorGradingTexture(): Nullable<BaseTexture> {
        return this._colorGradingTexture;
    }
    /**
     * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
     */
    public set colorGradingTexture(value: Nullable<BaseTexture>) {
        if (this._colorGradingTexture === value) {
            return;
        }

        this._colorGradingTexture = value;
        this._updateParameters();
    }

    @serialize()
    private _colorGradingEnabled = false;
    /**
     * Gets whether the color grading effect is enabled.
     */
    public get colorGradingEnabled(): boolean {
        return this._colorGradingEnabled;
    }
    /**
     * Sets whether the color grading effect is enabled.
     */
    public set colorGradingEnabled(value: boolean) {
        if (this._colorGradingEnabled === value) {
            return;
        }

        this._colorGradingEnabled = value;
        this._updateParameters();
    }

    @serialize()
    private _colorGradingWithGreenDepth = true;
    /**
     * Gets whether the color grading effect is using a green depth for the 3d Texture.
     */
    public get colorGradingWithGreenDepth(): boolean {
        return this._colorGradingWithGreenDepth;
    }
    /**
     * Sets whether the color grading effect is using a green depth for the 3d Texture.
     */
    public set colorGradingWithGreenDepth(value: boolean) {
        if (this._colorGradingWithGreenDepth === value) {
            return;
        }

        this._colorGradingWithGreenDepth = value;
        this._updateParameters();
    }

    @serialize()
    private _colorGradingBGR = true;
    /**
     * Gets whether the color grading texture contains BGR values.
     */
    public get colorGradingBGR(): boolean {
        return this._colorGradingBGR;
    }
    /**
     * Sets whether the color grading texture contains BGR values.
     */
    public set colorGradingBGR(value: boolean) {
        if (this._colorGradingBGR === value) {
            return;
        }

        this._colorGradingBGR = value;
        this._updateParameters();
    }

    /** @internal */
    @serialize()
    public _exposure = 1.0;
    /**
     * Gets the Exposure used in the effect.
     */
    public get exposure(): number {
        return this._exposure;
    }
    /**
     * Sets the Exposure used in the effect.
     */
    public set exposure(value: number) {
        if (this._exposure === value) {
            return;
        }

        this._exposure = value;
        this._updateParameters();
    }

    @serialize()
    private _toneMappingEnabled = false;
    /**
     * Gets whether the tone mapping effect is enabled.
     */
    public get toneMappingEnabled(): boolean {
        return this._toneMappingEnabled;
    }
    /**
     * Sets whether the tone mapping effect is enabled.
     */
    public set toneMappingEnabled(value: boolean) {
        if (this._toneMappingEnabled === value) {
            return;
        }

        this._toneMappingEnabled = value;
        this._updateParameters();
    }

    @serialize()
    private _toneMappingType = ImageProcessingConfiguration.TONEMAPPING_STANDARD;
    /**
     * Gets the type of tone mapping effect.
     */
    public get toneMappingType(): number {
        return this._toneMappingType;
    }
    /**
     * Sets the type of tone mapping effect used in BabylonJS.
     */
    public set toneMappingType(value: number) {
        if (this._toneMappingType === value) {
            return;
        }

        this._toneMappingType = value;
        this._updateParameters();
    }

    @serialize()
    protected _contrast = 1.0;
    /**
     * Gets the contrast used in the effect.
     */
    public get contrast(): number {
        return this._contrast;
    }
    /**
     * Sets the contrast used in the effect.
     */
    public set contrast(value: number) {
        if (this._contrast === value) {
            return;
        }

        this._contrast = value;
        this._updateParameters();
    }

    /**
     * Vignette stretch size.
     */
    @serialize()
    public vignetteStretch = 0;

    /**
     * Vignette center X Offset.
     */
    @serialize()
    public vignetteCenterX = 0;

    /**
     * Vignette center Y Offset.
     */
    @serialize()
    public vignetteCenterY = 0;

    /**
     * Back Compat: Vignette center Y Offset.
     * @deprecated use vignetteCenterY instead
     */
    public get vignetteCentreY(): number {
        return this.vignetteCenterY;
    }
    public set vignetteCentreY(value: number) {
        this.vignetteCenterY = value;
    }

    /**
     * Back Compat: Vignette center X Offset.
     * @deprecated use vignetteCenterX instead
     */
    public get vignetteCentreX(): number {
        return this.vignetteCenterX;
    }
    public set vignetteCentreX(value: number) {
        this.vignetteCenterX = value;
    }

    /**
     * Vignette weight or intensity of the vignette effect.
     */
    @serialize()
    public vignetteWeight = 1.5;

    /**
     * Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
     * if vignetteEnabled is set to true.
     */
    @serializeAsColor4()
    public vignetteColor: Color4 = new Color4(0, 0, 0, 0);

    /**
     * Camera field of view used by the Vignette effect.
     */
    @serialize()
    public vignetteCameraFov = 0.5;

    @serialize()
    private _vignetteBlendMode = ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
    /**
     * Gets the vignette blend mode allowing different kind of effect.
     */
    public get vignetteBlendMode(): number {
        return this._vignetteBlendMode;
    }
    /**
     * Sets the vignette blend mode allowing different kind of effect.
     */
    public set vignetteBlendMode(value: number) {
        if (this._vignetteBlendMode === value) {
            return;
        }

        this._vignetteBlendMode = value;
        this._updateParameters();
    }

    @serialize()
    private _vignetteEnabled = false;
    /**
     * Gets whether the vignette effect is enabled.
     */
    public get vignetteEnabled(): boolean {
        return this._vignetteEnabled;
    }
    /**
     * Sets whether the vignette effect is enabled.
     */
    public set vignetteEnabled(value: boolean) {
        if (this._vignetteEnabled === value) {
            return;
        }

        this._vignetteEnabled = value;
        this._updateParameters();
    }

    @serialize()
    private _ditheringEnabled = false;
    /**
     * Gets whether the dithering effect is enabled.
     * The dithering effect can be used to reduce banding.
     */
    public get ditheringEnabled(): boolean {
        return this._ditheringEnabled;
    }
    /**
     * Sets whether the dithering effect is enabled.
     * The dithering effect can be used to reduce banding.
     */
    public set ditheringEnabled(value: boolean) {
        if (this._ditheringEnabled === value) {
            return;
        }

        this._ditheringEnabled = value;
        this._updateParameters();
    }

    @serialize()
    private _ditheringIntensity = 1.0 / 255.0;
    /**
     * Gets the dithering intensity. 0 is no dithering. Default is 1.0 / 255.0.
     */
    public get ditheringIntensity(): number {
        return this._ditheringIntensity;
    }
    /**
     * Sets the dithering intensity. 0 is no dithering. Default is 1.0 / 255.0.
     */
    public set ditheringIntensity(value: number) {
        if (this._ditheringIntensity === value) {
            return;
        }

        this._ditheringIntensity = value;
        this._updateParameters();
    }

    /** @internal */
    @serialize()
    public _skipFinalColorClamp = false;
    /**
     * If apply by post process is set to true, setting this to true will skip the final color clamp step in the fragment shader
     * Applies to PBR materials.
     */
    public get skipFinalColorClamp(): boolean {
        return this._skipFinalColorClamp;
    }
    /**
     * If apply by post process is set to true, setting this to true will skip the final color clamp step in the fragment shader
     * Applies to PBR materials.
     */
    public set skipFinalColorClamp(value: boolean) {
        if (this._skipFinalColorClamp === value) {
            return;
        }

        this._skipFinalColorClamp = value;
        this._updateParameters();
    }

    /** @internal */
    @serialize()
    public _applyByPostProcess = false;
    /**
     * Gets whether the image processing is applied through a post process or not.
     */
    public get applyByPostProcess(): boolean {
        return this._applyByPostProcess;
    }
    /**
     * Sets whether the image processing is applied through a post process or not.
     */
    public set applyByPostProcess(value: boolean) {
        if (this._applyByPostProcess === value) {
            return;
        }

        this._applyByPostProcess = value;
        this._updateParameters();
    }

    @serialize()
    private _isEnabled = true;
    /**
     * Gets whether the image processing is enabled or not.
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }
    /**
     * Sets whether the image processing is enabled or not.
     */
    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }

        this._isEnabled = value;
        this._updateParameters();
    }

    /**
     * Width of the output texture used in the post process. If not provided, uses the width of the screen.
     */
    @serialize()
    public outputTextureWidth = 0;

    /**
     * Height of the output texture used in the post process. If not provided, uses the height of the screen.
     */
    @serialize()
    public outputTextureHeight = 0;

    /**
     * An event triggered when the configuration changes and requires Shader to Update some parameters.
     */
    public onUpdateParameters = new Observable<ImageProcessingConfiguration>();

    /**
     * Method called each time the image processing information changes requires to recompile the effect.
     */
    protected _updateParameters(): void {
        this.onUpdateParameters.notifyObservers(this);
    }

    /**
     * Gets the current class name.
     * @returns "ImageProcessingConfiguration"
     */
    public getClassName(): string {
        return "ImageProcessingConfiguration";
    }

    /**
     * Prepare the list of uniforms associated with the Image Processing effects.
     * @param uniforms The list of uniforms used in the effect
     * @param defines the list of defines currently in use
     */
    public static PrepareUniforms: (uniforms: string[], defines: IImageProcessingConfigurationDefines) => void = PrepareUniformsForImageProcessing;

    /**
     * Prepare the list of samplers associated with the Image Processing effects.
     * @param samplersList The list of uniforms used in the effect
     * @param defines the list of defines currently in use
     */
    public static PrepareSamplers: (samplersList: string[], defines: IImageProcessingConfigurationDefines) => void = PrepareSamplersForImageProcessing;

    /**
     * Prepare the list of defines associated to the shader.
     * @param defines the list of defines to complete
     * @param forPostProcess Define if we are currently in post process mode or not
     */
    public prepareDefines(defines: IImageProcessingConfigurationDefines, forPostProcess = false): void {
        if (forPostProcess !== this.applyByPostProcess || !this._isEnabled) {
            defines.VIGNETTE = false;
            defines.TONEMAPPING = 0;
            defines.CONTRAST = false;
            defines.EXPOSURE = false;
            defines.COLORCURVES = false;
            defines.COLORGRADING = false;
            defines.COLORGRADING3D = false;
            defines.DITHER = false;
            defines.IMAGEPROCESSING = false;
            defines.SKIPFINALCOLORCLAMP = this.skipFinalColorClamp;
            defines.IMAGEPROCESSINGPOSTPROCESS = this.applyByPostProcess && this._isEnabled;
            return;
        }

        defines.VIGNETTE = this.vignetteEnabled;
        defines.VIGNETTEBLENDMODEMULTIPLY = this.vignetteBlendMode === ImageProcessingConfiguration._VIGNETTEMODE_MULTIPLY;
        defines.VIGNETTEBLENDMODEOPAQUE = !defines.VIGNETTEBLENDMODEMULTIPLY;

        if (!this._toneMappingEnabled) {
            defines.TONEMAPPING = 0;
        } else {
            switch (this._toneMappingType) {
                case ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL:
                    defines.TONEMAPPING = 3;
                    break;
                case ImageProcessingConfiguration.TONEMAPPING_ACES:
                    defines.TONEMAPPING = 2;
                    break;
                default:
                    defines.TONEMAPPING = 1;
                    break;
            }
        }

        defines.CONTRAST = this.contrast !== 1.0;
        defines.EXPOSURE = this.exposure !== 1.0;
        defines.COLORCURVES = this.colorCurvesEnabled && !!this.colorCurves;
        defines.COLORGRADING = this.colorGradingEnabled && !!this.colorGradingTexture;
        if (defines.COLORGRADING) {
            defines.COLORGRADING3D = this.colorGradingTexture!.is3D;
        } else {
            defines.COLORGRADING3D = false;
        }
        defines.SAMPLER3DGREENDEPTH = this.colorGradingWithGreenDepth;
        defines.SAMPLER3DBGRMAP = this.colorGradingBGR;
        defines.DITHER = this._ditheringEnabled;
        defines.IMAGEPROCESSINGPOSTPROCESS = this.applyByPostProcess;
        defines.SKIPFINALCOLORCLAMP = this.skipFinalColorClamp;
        defines.IMAGEPROCESSING =
            defines.VIGNETTE || !!defines.TONEMAPPING || defines.CONTRAST || defines.EXPOSURE || defines.COLORCURVES || defines.COLORGRADING || defines.DITHER;
    }

    /**
     * Returns true if all the image processing information are ready.
     * @returns True if ready, otherwise, false
     */
    public isReady() {
        // Color Grading texture can not be none blocking.
        return !this.colorGradingEnabled || !this.colorGradingTexture || this.colorGradingTexture.isReady();
    }

    /**
     * Binds the image processing to the shader.
     * @param effect The effect to bind to
     * @param overrideAspectRatio Override the aspect ratio of the effect
     */
    public bind(effect: Effect, overrideAspectRatio?: number): void {
        // Color Curves
        if (this._colorCurvesEnabled && this.colorCurves) {
            ColorCurves.Bind(this.colorCurves, effect);
        }

        // Vignette and dither handled together due to common uniform.
        if (this._vignetteEnabled || this._ditheringEnabled) {
            const inverseWidth = 1 / (this.outputTextureWidth || effect.getEngine().getRenderWidth());
            const inverseHeight = 1 / (this.outputTextureHeight || effect.getEngine().getRenderHeight());
            effect.setFloat2("vInverseScreenSize", inverseWidth, inverseHeight);

            if (this._ditheringEnabled) {
                effect.setFloat("ditherIntensity", 0.5 * this._ditheringIntensity);
            }

            if (this._vignetteEnabled) {
                const aspectRatio = overrideAspectRatio != null ? overrideAspectRatio : inverseHeight / inverseWidth;

                let vignetteScaleY = Math.tan(this.vignetteCameraFov * 0.5);
                let vignetteScaleX = vignetteScaleY * aspectRatio;

                const vignetteScaleGeometricMean = Math.sqrt(vignetteScaleX * vignetteScaleY);
                vignetteScaleX = Mix(vignetteScaleX, vignetteScaleGeometricMean, this.vignetteStretch);
                vignetteScaleY = Mix(vignetteScaleY, vignetteScaleGeometricMean, this.vignetteStretch);

                effect.setFloat4("vignetteSettings1", vignetteScaleX, vignetteScaleY, -vignetteScaleX * this.vignetteCenterX, -vignetteScaleY * this.vignetteCenterY);

                const vignettePower = -2.0 * this.vignetteWeight;
                effect.setFloat4("vignetteSettings2", this.vignetteColor.r, this.vignetteColor.g, this.vignetteColor.b, vignettePower);
            }
        }

        // Exposure
        effect.setFloat("exposureLinear", this.exposure);

        // Contrast
        effect.setFloat("contrast", this.contrast);

        // Color transform settings
        if (this.colorGradingTexture) {
            effect.setTexture("txColorTransform", this.colorGradingTexture);
            const textureSize = this.colorGradingTexture.getSize().height;

            effect.setFloat4(
                "colorTransformSettings",
                (textureSize - 1) / textureSize, // textureScale
                0.5 / textureSize, // textureOffset
                textureSize, // textureSize
                this.colorGradingTexture.level // weight
            );
        }
    }

    /**
     * Clones the current image processing instance.
     * @returns The cloned image processing
     */
    public clone(): ImageProcessingConfiguration {
        return SerializationHelper.Clone(() => new ImageProcessingConfiguration(), this);
    }

    /**
     * Serializes the current image processing instance to a json representation.
     * @returns a JSON representation
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses the image processing from a json representation.
     * @param source the JSON source to parse
     * @returns The parsed image processing
     */
    public static Parse(source: any): ImageProcessingConfiguration {
        const parsed = SerializationHelper.Parse(() => new ImageProcessingConfiguration(), source, null, null);
        // Backward compatibility
        if (source.vignetteCentreX !== undefined) {
            parsed.vignetteCenterX = source.vignetteCentreX;
        }
        if (source.vignetteCentreY !== undefined) {
            parsed.vignetteCenterY = source.vignetteCentreY;
        }

        return parsed;
    }

    // Static constants associated to the image processing.
    private static _VIGNETTEMODE_MULTIPLY = 0;
    private static _VIGNETTEMODE_OPAQUE = 1;

    /**
     * Used to apply the vignette as a mix with the pixel color.
     */
    public static get VIGNETTEMODE_MULTIPLY(): number {
        return this._VIGNETTEMODE_MULTIPLY;
    }

    /**
     * Used to apply the vignette as a replacement of the pixel color.
     */
    public static get VIGNETTEMODE_OPAQUE(): number {
        return this._VIGNETTEMODE_OPAQUE;
    }
}

// References the dependencies.
SerializationHelper._ImageProcessingConfigurationParser = ImageProcessingConfiguration.Parse;

// Register Class Name
RegisterClass("BABYLON.ImageProcessingConfiguration", ImageProcessingConfiguration);
