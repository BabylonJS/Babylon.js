import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";
import { Matrix } from "../Maths/math.vector";

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

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/filter.fragment"));
        } else {
            list.push(import("../Shaders/filter.fragment"));
        }
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
            engine: engine || Engine.LastCreatedEngine!,
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
