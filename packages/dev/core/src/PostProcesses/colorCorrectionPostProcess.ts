import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Camera } from "../Cameras/camera";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import type { Nullable } from "../types";

import type { Scene } from "../scene";
import { ThinColorCorrectionPostProcess } from "./thinColorCorrectionPostProcess";

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
    /**
     * Gets the color table url used to create the LUT texture
     */
    @serialize()
    public get colorTableUrl() {
        return this._effectWrapper.colorTableUrl;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "ColorCorrectionPostProcess" string
     */
    public override getClassName(): string {
        return "ColorCorrectionPostProcess";
    }

    protected override _effectWrapper: ThinColorCorrectionPostProcess;

    constructor(
        name: string,
        colorTableUrl: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean
    ) {
        const localOptions = {
            samplers: ThinColorCorrectionPostProcess.Samplers,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            ...(options as PostProcessOptions),
        };

        const scene = camera?.getScene() || null;

        super(name, ThinColorCorrectionPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinColorCorrectionPostProcess(name, scene, colorTableUrl, localOptions) : undefined,
            ...localOptions,
        });
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
