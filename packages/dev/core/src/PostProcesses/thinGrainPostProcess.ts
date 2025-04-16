// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * Post process used to render a grain effect
 */
export class ThinGrainPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "grain";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["intensity", "animatedSeed"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/grain.fragment"));
        } else {
            list.push(import("../Shaders/grain.fragment"));
        }
    }

    /**
     * Constructs a new grain post process
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
            fragmentShader: ThinGrainPostProcess.FragmentUrl,
            uniforms: ThinGrainPostProcess.Uniforms,
        });
    }

    /**
     * The intensity of the grain added (default: 30)
     */
    public intensity = 30;

    /**
     * If the grain should be randomized on every frame
     */
    public animated = false;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);
        this._drawWrapper.effect!.setFloat("intensity", this.intensity);
        this._drawWrapper.effect!.setFloat("animatedSeed", this.animated ? Math.random() + 1 : 1);
    }
}
