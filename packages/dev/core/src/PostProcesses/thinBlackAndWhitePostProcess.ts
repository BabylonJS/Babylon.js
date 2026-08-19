import { type Nullable, type AbstractEngine, type EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { EngineStore } from "../Engines/engineStore";
import { ShaderLoader } from "core/Misc/shaderLoader";

/**
 * Post process used to render in black and white
 */
export class ThinBlackAndWhitePostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "blackAndWhite";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["degree"];

    private static readonly _ShaderLoader = /*#__PURE__*/ new ShaderLoader({
        webGL: () => [import("../Shaders/blackAndWhite.fragment")],
        webGPU: () => [import("../ShadersWGSL/blackAndWhite.fragment")],
    });

    protected override _getShaderLoaders(): ShaderLoader[] {
        return [ThinBlackAndWhitePostProcess._ShaderLoader, ...super._getShaderLoaders()];
    }

    /**
     * Constructs a new black and white post process
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
            fragmentShader: ThinBlackAndWhitePostProcess.FragmentUrl,
            uniforms: ThinBlackAndWhitePostProcess.Uniforms,
        });
    }

    /**
     * Effect intensity (default: 1)
     */
    public degree = 1;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);
        this._drawWrapper.effect!.setFloat("degree", this.degree);
    }
}
