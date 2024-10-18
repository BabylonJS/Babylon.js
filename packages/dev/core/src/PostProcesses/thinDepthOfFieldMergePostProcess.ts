// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, ThinPostProcessOptions } from "core/index";
import { ThinPostProcess } from "./thinPostProcess";

/**
 * @internal
 */
export class ThinDepthOfFieldMergePostProcess extends ThinPostProcess {
    public static readonly FragmentUrl = "depthOfFieldMerge";

    public static readonly Samplers = ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2"];

    public override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/depthOfFieldMerge.fragment"));
        } else {
            list.push(import("../Shaders/depthOfFieldMerge.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: ThinPostProcessOptions) {
        super(name, ThinDepthOfFieldMergePostProcess.FragmentUrl, engine, {
            samplers: ThinDepthOfFieldMergePostProcess.Samplers,
            ...options,
        });
    }
}
