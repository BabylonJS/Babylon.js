import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Engine } from "../Engines/engine";
import { ToGammaSpace } from "../Maths/math.constants";
import { Constants } from "../Engines/constants";

import "../Shaders/extractHighlights.fragment";
import { serialize } from "../Misc/decorators";
import { RegisterClass } from "../Misc/typeStore";

/**
 * The extract highlights post process sets all pixels to black except pixels above the specified luminance threshold. Used as the first step for a bloom effect.
 */
export class ExtractHighlightsPostProcess extends PostProcess {
    /**
     * The luminance threshold, pixels below this value will be set to black.
     */
    @serialize()
    public threshold = 0.9;

    /** @internal */
    public _exposure = 1;

    /**
     * Post process which has the input texture to be used when performing highlight extraction
     * @internal
     */
    public _inputPostProcess: Nullable<PostProcess> = null;

    /**
     * Gets a string identifying the name of the class
     * @returns "ExtractHighlightsPostProcess" string
     */
    public getClassName(): string {
        return "ExtractHighlightsPostProcess";
    }

    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: Engine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        super(name, "extractHighlights", ["threshold", "exposure"], null, options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation);
        this.onApplyObservable.add((effect: Effect) => {
            this.externalTextureSamplerBinding = !!this._inputPostProcess;
            if (this._inputPostProcess) {
                effect.setTextureFromPostProcess("textureSampler", this._inputPostProcess);
            }
            effect.setFloat("threshold", Math.pow(this.threshold, ToGammaSpace));
            effect.setFloat("exposure", this._exposure);
        });
    }
}

RegisterClass("BABYLON.ExtractHighlightsPostProcess", ExtractHighlightsPostProcess);
