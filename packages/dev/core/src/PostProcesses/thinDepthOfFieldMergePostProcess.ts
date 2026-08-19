import { type Nullable, type AbstractEngine, type EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { EngineStore } from "../Engines/engineStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderLoader } from "core/Misc/shaderLoader";

/**
 * @internal
 */
export class ThinDepthOfFieldMergePostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "depthOfFieldMerge";

    public static readonly Samplers = ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2"];

    private static readonly _ShaderLoader = /*#__PURE__*/ new ShaderLoader({
        webGL: () => [import("../Shaders/depthOfFieldMerge.fragment")],
        webGPU: () => [import("../ShadersWGSL/depthOfFieldMerge.fragment")],
    });

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
        }

        const promise = ThinDepthOfFieldMergePostProcess._ShaderLoader.load(useWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL);
        if (promise !== null) {
            list.push(promise);
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || EngineStore.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinDepthOfFieldMergePostProcess.FragmentUrl,
            samplers: ThinDepthOfFieldMergePostProcess.Samplers,
        });
    }
}
