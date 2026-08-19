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

    protected override _getShaderLoaders(): ShaderLoader[] {
        return [ThinDepthOfFieldMergePostProcess._ShaderLoader, ...super._getShaderLoaders()];
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
