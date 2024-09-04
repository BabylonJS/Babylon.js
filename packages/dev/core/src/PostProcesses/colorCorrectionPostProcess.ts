import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Camera } from "../Cameras/camera";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import type { Nullable } from "../types";

import type { Scene } from "../scene";

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
     * Gets the color table url used to create the LUT texture
     */
    @serialize()
    public colorTableUrl: string;

    /**
     * Gets a string identifying the name of the class
     * @returns "ColorCorrectionPostProcess" string
     */
    public override getClassName(): string {
        return "ColorCorrectionPostProcess";
    }

    constructor(
        name: string,
        colorTableUrl: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean
    ) {
        super(name, "colorCorrection", null, ["colorTable"], options, camera, samplingMode, engine, reusable);

        const scene = camera?.getScene() || null;
        this._colorTableTexture = new Texture(colorTableUrl, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
        this._colorTableTexture.anisotropicFilteringLevel = 1;
        this._colorTableTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._colorTableTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

        this.colorTableUrl = colorTableUrl;

        this.onApply = (effect: Effect) => {
            effect.setTexture("colorTable", this._colorTableTexture);
        };
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/colorCorrection.fragment")]));
        } else {
            list.push(Promise.all([import("../Shaders/colorCorrection.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<ColorCorrectionPostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new ColorCorrectionPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.colorTableUrl,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.ColorCorrectionPostProcess", ColorCorrectionPostProcess);
