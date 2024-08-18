import type { Nullable } from "../types";
import type { Matrix } from "../Maths/math.vector";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";

import { RegisterClass } from "../Misc/typeStore";
import { serializeAsMatrix } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";

/**
 * Applies a kernel filter to the image
 */
export class FilterPostProcess extends PostProcess {
    /** The matrix to be applied to the image */
    @serializeAsMatrix()
    public kernelMatrix: Matrix;

    /**
     * Gets a string identifying the name of the class
     * @returns "FilterPostProcess" string
     */
    public override getClassName(): string {
        return "FilterPostProcess";
    }

    /**
     *
     * @param name The name of the effect.
     * @param kernelMatrix The matrix to be applied to the image
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(
        name: string,
        kernelMatrix: Matrix,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean
    ) {
        super(name, "filter", ["kernelMatrix"], null, options, camera, samplingMode, engine, reusable);
        this.kernelMatrix = kernelMatrix;

        this.onApply = (effect: Effect) => {
            effect.setMatrix("kernelMatrix", this.kernelMatrix);
        };
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/filter.fragment")]));
        } else {
            list.push(Promise.all([import("../Shaders/filter.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<FilterPostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new FilterPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.kernelMatrix,
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

RegisterClass("BABYLON.FilterPostProcess", FilterPostProcess);
