import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

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

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/anaglyph.fragment"));
        } else {
            list.push(import("../Shaders/anaglyph.fragment"));
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
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinAnaglyphPostProcess.FragmentUrl,
            samplers: ThinAnaglyphPostProcess.Samplers,
        });
    }
}
