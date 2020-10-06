import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";

import "../Shaders/fxaa.fragment";
import "../Shaders/fxaa.vertex";
import { _TypeStore } from '../Misc/typeStore';
import { SerializationHelper } from '../Misc/decorators';

declare type Scene = import("../scene").Scene;
/**
 * Fxaa post process
 * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#fxaa
 */
export class FxaaPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "FxaaPostProcess" string
     */
    public getClassName(): string {
        return "FxaaPostProcess";
    }

    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(name, "fxaa", ["texelSize"], null, options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "fxaa", undefined, true);

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

        const glInfo = engine.getGlInfo();
        if (glInfo && glInfo.renderer && glInfo.renderer.toLowerCase().indexOf("mali") > -1) {
            return "#define MALI 1\n";
        }

        return null;
    }

    /** @hidden */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(() => {
            return new FxaaPostProcess(
                parsedPostProcess.name,
                parsedPostProcess.options, targetCamera,
                parsedPostProcess.renderTargetSamplingMode,
                scene.getEngine(), parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.FxaaPostProcess"] = FxaaPostProcess;