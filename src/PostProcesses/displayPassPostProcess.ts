import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";

import "../Shaders/displayPass.fragment";
import { _TypeStore } from '../Misc/typeStore';
import { SerializationHelper } from '../Misc/decorators';

declare type Scene = import("../scene").Scene;

/**
 * DisplayPassPostProcess which produces an output the same as it's input
 */
export class DisplayPassPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "DisplayPassPostProcess" string
     */
    public getClassName(): string {
        return "DisplayPassPostProcess";
    }   

    /**
     * Creates the DisplayPassPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean) {
        super(name, "displayPass", ["passSampler"], ["passSampler"], options, camera, samplingMode, engine, reusable);
    }

    /** @hidden */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<DisplayPassPostProcess> {
        return SerializationHelper.Parse(() => {
            return new DisplayPassPostProcess(
                parsedPostProcess.name, 
                parsedPostProcess.options, targetCamera, 
                parsedPostProcess.renderTargetSamplingMode,
                scene.getEngine(), parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }        
}

_TypeStore.RegisteredTypes["BABYLON.DisplayPassPostProcess"] = DisplayPassPostProcess;

