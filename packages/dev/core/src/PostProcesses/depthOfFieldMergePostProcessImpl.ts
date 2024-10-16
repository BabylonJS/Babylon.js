import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class DepthOfFieldMergePostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "depthOfFieldMerge";

    public static readonly Samplers = ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2"];

    public gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this.postProcess._webGPUReady = true;
            list.push(import("../ShadersWGSL/depthOfFieldMerge.fragment"));
        } else {
            list.push(import("../Shaders/depthOfFieldMerge.fragment"));
        }
    }

    public bind() {}
}
