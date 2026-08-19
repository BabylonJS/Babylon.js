import { type Nullable, type AbstractEngine, type EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { EngineStore } from "../Engines/engineStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderLoader } from "core/Misc/shaderLoader";

/**
 * Postprocess used to generate anaglyphic rendering
 */
export class ThinAnaglyphPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "anaglyph";

    /**
     * The list of samplers used by the effect
     */
    public static readonly Samplers = ["leftSampler"];

    private static readonly _ShaderLoader = /*#__PURE__*/ new ShaderLoader({
        webGL: () => [import("../Shaders/anaglyph.fragment")],
        webGPU: () => [import("../ShadersWGSL/anaglyph.fragment")],
    });

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
        }

        const promise = ThinAnaglyphPostProcess._ShaderLoader.load(useWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL);
        if (promise !== null) {
            list.push(promise);
        }
    }

    /**
     * Constructs a new anaglyph post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || EngineStore.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinAnaglyphPostProcess.FragmentUrl,
            samplers: ThinAnaglyphPostProcess.Samplers,
        });
    }
}
