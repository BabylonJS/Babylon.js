import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { ToGammaSpace } from "../Maths/math.constants";
import { Constants } from "../Engines/constants";

import "../Shaders/extractHighlights.fragment";

/**
 * The extract highlights post process sets all pixels to black except pixels above the specified luminance threshold. Used as the first step for a bloom effect.
 */
export class ExtractHighlightsPostProcess extends PostProcess {
    /**
     * The luminance threshold, pixels below this value will be set to black.
     */
    public threshold = 0.9;

    /** @hidden */
    public _exposure = 1;
    /**
     * Post process which has the input texture to be used when performing highlight extraction
     * @hidden
     */
    public _inputPostProcess: Nullable<PostProcess> = null;
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
        super(name, "extractHighlights", ["threshold", "exposure"], null, options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation);
        this.onApplyObservable.add((effect: Effect) => {
            if (this._inputPostProcess) {
                effect.setTextureFromPostProcess("textureSampler", this._inputPostProcess);
            }
            effect.setFloat('threshold', Math.pow(this.threshold, ToGammaSpace));
            effect.setFloat('exposure', this._exposure);
        });
    }
}
