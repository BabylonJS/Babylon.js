import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Camera } from "../Cameras/camera";
import type { AbstractEngine } from "../Engines/abstractEngine";

import { RegisterClass } from "../Misc/typeStore";
import { SerializationHelper } from "../Misc/decorators.serialization";
import type { Nullable } from "../types";

import type { Scene } from "../scene";
import { BlackAndWhitePostProcessImpl } from "./blackAndWhitePostProcessImpl";

/**
 * Post process used to render in black and white
 */
export class BlackAndWhitePostProcess extends PostProcess {
    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    public get degree() {
        return this._impl.degree;
    }

    public set degree(value: number) {
        this._impl.degree = value;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "BlackAndWhitePostProcess" string
     */
    public override getClassName(): string {
        return "BlackAndWhitePostProcess";
    }

    private _impl: BlackAndWhitePostProcessImpl;

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
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: AbstractEngine, reusable?: boolean) {
        super(name, BlackAndWhitePostProcessImpl.FragmentUrl, {
            uniforms: BlackAndWhitePostProcessImpl.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            ...(options as PostProcessOptions),
        });

        this._impl = new BlackAndWhitePostProcessImpl(this);

        this.onApplyObservable.add(() => {
            this._impl.bind();
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
        const postProcess: BlackAndWhitePostProcess = SerializationHelper.Parse(
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

        postProcess._impl.parse(parsedPostProcess, scene, rootUrl);

        return postProcess;
    }
}

RegisterClass("BABYLON.BlackAndWhitePostProcess", BlackAndWhitePostProcess);
