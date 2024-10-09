import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { ExtractHighlightsPostProcessImpl } from "./extractHighlightsPostProcessImpl";
import type { Scene } from "core/scene";
import { SerializationHelper } from "core/Misc/decorators.serialization";

/**
 * The extract highlights post process sets all pixels to black except pixels above the specified luminance threshold. Used as the first step for a bloom effect.
 */
export class ExtractHighlightsPostProcess extends PostProcess {
    /**
     * The luminance threshold, pixels below this value will be set to black.
     */
    public get threshold() {
        return this._impl.threshold;
    }

    public set threshold(value: number) {
        this._impl.threshold = value;
    }

    /** @internal */
    public get _exposure() {
        return this._impl._exposure;
    }

    /** @internal */
    public set _exposure(value: number) {
        this._impl._exposure = value;
    }

    /**
     * Post process which has the input texture to be used when performing highlight extraction
     * @internal
     */
    public _inputPostProcess: Nullable<PostProcess> = null;

    /**
     * Gets a string identifying the name of the class
     * @returns "ExtractHighlightsPostProcess" string
     */
    public override getClassName(): string {
        return "ExtractHighlightsPostProcess";
    }

    protected override _impl: ExtractHighlightsPostProcessImpl;

    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        super(name, ExtractHighlightsPostProcessImpl.FragmentUrl, {
            uniforms: ExtractHighlightsPostProcessImpl.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            implementation: new ExtractHighlightsPostProcessImpl(),
            ...(options as PostProcessOptions),
        });

        this.onApplyObservable.add((effect: Effect) => {
            this.externalTextureSamplerBinding = !!this._inputPostProcess;
            if (this._inputPostProcess) {
                effect.setTextureFromPostProcess("textureSampler", this._inputPostProcess);
            }
            this._impl.bind();
        });
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/extractHighlights.fragment"));
        } else {
            list.push(import("../Shaders/extractHighlights.fragment"));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<ExtractHighlightsPostProcess> {
        const postProcess: ExtractHighlightsPostProcess = SerializationHelper.Parse(
            () => {
                return new ExtractHighlightsPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable,
                    parsedPostProcess.textureType
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

RegisterClass("BABYLON.ExtractHighlightsPostProcess", ExtractHighlightsPostProcess);
