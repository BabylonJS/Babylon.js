import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";

import "../Shaders/sceneCompositor.fragment";
import "../Shaders/postprocess.vertex";

/**
 * Scene compositor post process
 */
export class SceneCompositorPostProcess extends PostProcess {
    /** @hidden */
    public texelWidth: number;
    /** @hidden */
    public texelHeight: number;

    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(name, "sceneCompositor", ["texelSize"], null, options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "postprocess", undefined, true);

        const defines = this._getDefines();
        this.updateEffect(defines);

        this.onApplyObservable.add((effect: Effect) => {
            var texelSize = this.texelSize;
            effect.setFloat2("texelSize", texelSize.x, texelSize.y);
        });
    }

    private _getDefines(): Nullable<string> {
        const engine = this.getEngine();
        if (!engine) {
            return null;
        }

        return "";
    }
}
