import { type Nullable, type AbstractEngine, type EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { EngineStore } from "../Engines/engineStore";
import { Matrix } from "../Maths/math.vector.pure";
import { ShaderLoader } from "core/Misc/shaderLoader";

/**
 * Post process used to apply a kernel filter
 */
export class ThinFilterPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "filter";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["kernelMatrix"];

    private static readonly _ShaderLoader = /*#__PURE__*/ new ShaderLoader({
        webGL: () => [import("../Shaders/filter.fragment")],
        webGPU: () => [import("../ShadersWGSL/filter.fragment")],
    });

    protected override _getShaderLoaders(): ShaderLoader[] {
        return [ThinFilterPostProcess._ShaderLoader, ...super._getShaderLoaders()];
    }

    /**
     * Constructs a new filter post process
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
            fragmentShader: ThinFilterPostProcess.FragmentUrl,
            uniforms: ThinFilterPostProcess.Uniforms,
        });
    }

    /**
     * The matrix to be applied to the image
     */
    public kernelMatrix = Matrix.Identity();

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);
        this._drawWrapper.effect!.setMatrix("kernelMatrix", this.kernelMatrix);
    }
}
