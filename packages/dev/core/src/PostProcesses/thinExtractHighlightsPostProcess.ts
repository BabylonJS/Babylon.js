import { type Nullable, type AbstractEngine, type EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { ToGammaSpace } from "../Maths/math.constants";
import { EngineStore } from "../Engines/engineStore";
import { ShaderLoader } from "core/Misc/shaderLoader";

/**
 * Post process used to extract highlights.
 */
export class ThinExtractHighlightsPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "extractHighlights";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["threshold", "exposure"];

    private static readonly _ShaderLoader = /*#__PURE__*/ new ShaderLoader({
        webGL: () => [import("core/Shaders/extractHighlights.fragment")],
        webGPU: () => [import("core/ShadersWGSL/extractHighlights.fragment")],
    });

    protected override _getShaderLoaders(): ShaderLoader[] {
        return [ThinExtractHighlightsPostProcess._ShaderLoader, ...super._getShaderLoaders()];
    }

    /**
     * Constructs a new extract highlights post process
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
            fragmentShader: ThinExtractHighlightsPostProcess.FragmentUrl,
            uniforms: ThinExtractHighlightsPostProcess.Uniforms,
        });
    }

    /**
     * The luminance threshold, pixels below this value will be set to black.
     */
    public threshold = 0.9;

    /** @internal */
    public _exposure = 1;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat("threshold", Math.pow(this.threshold, ToGammaSpace));
        effect.setFloat("exposure", this._exposure);
    }
}
