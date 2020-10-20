import { Nullable } from "../types";
import { Engine } from "../Engines/engine";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";

import "../Shaders/anaglyph.fragment";
import { _TypeStore } from '../Misc/typeStore';

/**
 * Postprocess used to generate anaglyphic rendering
 */
export class AnaglyphPostProcess extends PostProcess {
    private _passedProcess: Nullable<PostProcess>;

    /**
     * Gets a string identifying the name of the class
     * @returns "AnaglyphPostProcess" string
     */
    public getClassName(): string {
        return "AnaglyphPostProcess";
    }

    /**
     * Creates a new AnaglyphPostProcess
     * @param name defines postprocess name
     * @param options defines creation options or target ratio scale
     * @param rigCameras defines cameras using this postprocess
     * @param samplingMode defines required sampling mode (BABYLON.Texture.NEAREST_SAMPLINGMODE by default)
     * @param engine defines hosting engine
     * @param reusable defines if the postprocess will be reused multiple times per frame
     */
    constructor(name: string, options: number | PostProcessOptions, rigCameras: Camera[], samplingMode?: number, engine?: Engine, reusable?: boolean) {
        super(name, "anaglyph", null, ["leftSampler"], options, rigCameras[1], samplingMode, engine, reusable);
        this._passedProcess = rigCameras[0]._rigPostProcess;

        this.onApplyObservable.add((effect: Effect) => {
            effect.setTextureFromPostProcess("leftSampler", this._passedProcess);
        });
    }
}

_TypeStore.RegisteredTypes["BABYLON.AnaglyphPostProcess"] = AnaglyphPostProcess;
