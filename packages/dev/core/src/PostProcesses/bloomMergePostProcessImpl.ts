import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class BloomMergePostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "bloomMerge";

    public static readonly Uniforms = ["bloomWeight"];

    public static readonly Samplers = ["bloomBlur"];

    public gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this.postProcess._webGPUReady = true;
            list.push(import("../ShadersWGSL/bloomMerge.fragment"));
        } else {
            list.push(import("../Shaders/bloomMerge.fragment"));
        }
    }

    /** Weight of the bloom to be added to the original input. */
    public weight = 1;

    public bind() {
        this._drawWrapper.effect!.setFloat("bloomWeight", this.weight);
    }
}
