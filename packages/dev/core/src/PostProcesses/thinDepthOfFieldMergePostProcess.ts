// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * @internal
 */
export class ThinDepthOfFieldMergePostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "depthOfFieldMerge";

    public static readonly Samplers = ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/depthOfFieldMerge.fragment"));
        } else {
            list.push(import("../Shaders/depthOfFieldMerge.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinDepthOfFieldMergePostProcess.FragmentUrl,
            samplers: ThinDepthOfFieldMergePostProcess.Samplers,
        });
    }
}
