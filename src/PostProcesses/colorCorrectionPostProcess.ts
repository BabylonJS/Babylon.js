import { PostProcess, PostProcessOptions } from "./postProcess";
import { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { Engine } from "../Engines/engine";
import { Camera } from "../Cameras/camera";

import "../Shaders/colorCorrection.fragment";
import { _TypeStore } from '../Misc/typeStore';

/**
 *
 * This post-process allows the modification of rendered colors by using
 * a 'look-up table' (LUT). This effect is also called Color Grading.
 *
 * The object needs to be provided an url to a texture containing the color
 * look-up table: the texture must be 256 pixels wide and 16 pixels high.
 * Use an image editing software to tweak the LUT to match your needs.
 *
 * For an example of a color LUT, see here:
 * @see http://udn.epicgames.com/Three/rsrc/Three/ColorGrading/RGBTable16x1.png
 * For explanations on color grading, see here:
 * @see http://udn.epicgames.com/Three/ColorGrading.html
 *
 */
export class ColorCorrectionPostProcess extends PostProcess {

    private _colorTableTexture: Texture;

    /**
     * Gets a string identifying the name of the class
     * @returns "ColorCorrectionPostProcess" string
     */
    public getClassName(): string {
        return "ColorCorrectionPostProcess";
    }           

    constructor(name: string, colorTableUrl: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
        super(name, 'colorCorrection', null, ['colorTable'], options, camera, samplingMode, engine, reusable);

        this._colorTableTexture = new Texture(colorTableUrl, camera.getScene(), true, false, Texture.TRILINEAR_SAMPLINGMODE);
        this._colorTableTexture.anisotropicFilteringLevel = 1;
        this._colorTableTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._colorTableTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

        this.onApply = (effect: Effect) => {
            effect.setTexture("colorTable", this._colorTableTexture);
        };
    }
}

_TypeStore.RegisteredTypes["BABYLON.ColorCorrectionPostProcess"] = ColorCorrectionPostProcess;
