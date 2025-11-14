import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * Post process used to apply a screen space curvature post process
 */
export class ThinScreenSpaceCurvaturePostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "screenSpaceCurvature";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["curvature_ridge", "curvature_valley"];

    /**
     * The list of samplers used by the effect
     */
    public static readonly Samplers = ["normalSampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/screenSpaceCurvature.fragment"));
        } else {
            list.push(import("../Shaders/screenSpaceCurvature.fragment"));
        }
    }

    /**
     * Constructs a new screen space curvature post process
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
            fragmentShader: ThinScreenSpaceCurvaturePostProcess.FragmentUrl,
            uniforms: ThinScreenSpaceCurvaturePostProcess.Uniforms,
            samplers: ThinScreenSpaceCurvaturePostProcess.Samplers,
        });
    }

    /**
     * Defines how much ridge the curvature effect displays.
     */
    public ridge: number = 1;

    /**
     * Defines how much valley the curvature effect displays.
     */
    public valley: number = 1;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat("curvature_ridge", 0.5 / Math.max(this.ridge * this.ridge, 1e-4));
        effect.setFloat("curvature_valley", 0.7 / Math.max(this.valley * this.valley, 1e-4));
    }
}
