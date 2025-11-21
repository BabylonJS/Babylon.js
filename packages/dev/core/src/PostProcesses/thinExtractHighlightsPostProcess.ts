import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { ToGammaSpace } from "../Maths/math.constants";
import { Engine } from "../Engines/engine";

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

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/extractHighlights.fragment"));
        } else {
            list.push(import("../Shaders/extractHighlights.fragment"));
        }
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
            engine: engine || Engine.LastCreatedEngine!,
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
