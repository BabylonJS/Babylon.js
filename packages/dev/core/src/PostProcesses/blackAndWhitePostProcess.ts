import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { AbstractEngine } from "../Engines/abstractEngine";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import type { Nullable } from "../types";

import type { Scene } from "../scene";

/**
 * Post process used to render in black and white
 */
export class BlackAndWhitePostProcess extends PostProcess {
    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    @serialize()
    public degree = 1;

    /**
     * Gets a string identifying the name of the class
     * @returns "BlackAndWhitePostProcess" string
     */
    public override getClassName(): string {
        return "BlackAndWhitePostProcess";
    }

    /**
     * Creates a black and white post process
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#black-and-white
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: AbstractEngine, reusable?: boolean) {
        super(name, "blackAndWhite", ["degree"], null, options, camera, samplingMode, engine, reusable);

        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat("degree", this.degree);
        });
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/blackAndWhite.fragment"));
        } else {
            list.push(import("../Shaders/blackAndWhite.fragment"));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<BlackAndWhitePostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new BlackAndWhitePostProcess(
                    parsedPostProcess.name,
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

RegisterClass("BABYLON.BlackAndWhitePostProcess", BlackAndWhitePostProcess);
