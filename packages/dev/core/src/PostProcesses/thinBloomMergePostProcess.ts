// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, ThinPostProcessOptions } from "core/index";
import { ThinPostProcess } from "./thinPostProcess";

/**
 * @internal
 */
export class ThinBloomMergePostProcess extends ThinPostProcess {
    public static readonly FragmentUrl = "bloomMerge";

    public static readonly Uniforms = ["bloomWeight"];

    public static readonly Samplers = ["bloomBlur"];

    public override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/bloomMerge.fragment"));
        } else {
            list.push(import("../Shaders/bloomMerge.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: ThinPostProcessOptions) {
        super(name, ThinBloomMergePostProcess.FragmentUrl, engine, {
            uniforms: ThinBloomMergePostProcess.Uniforms,
            samplers: ThinBloomMergePostProcess.Samplers,
            ...options,
        });
    }

    /** Weight of the bloom to be added to the original input. */
    public weight = 1;

    public override bind() {
        super.bind();
        this._drawWrapper.effect!.setFloat("bloomWeight", this.weight);
    }
}
