// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * @internal
 */
export class ThinBloomMergePostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "bloomMerge";

    public static readonly Uniforms = ["bloomWeight"];

    public static readonly Samplers = ["bloomBlur"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/bloomMerge.fragment"));
        } else {
            list.push(import("../Shaders/bloomMerge.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinBloomMergePostProcess.FragmentUrl,
            uniforms: ThinBloomMergePostProcess.Uniforms,
            samplers: ThinBloomMergePostProcess.Samplers,
        });
    }

    /** Weight of the bloom to be added to the original input. */
    public weight = 1;

    public override bind() {
        super.bind();
        this._drawWrapper.effect!.setFloat("bloomWeight", this.weight);
    }
}
