import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * Post process used to apply a sharpen effect
 */
export class ThinSharpenPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "sharpen";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["sharpnessAmounts", "screenSize"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/sharpen.fragment"));
        } else {
            list.push(import("../Shaders/sharpen.fragment"));
        }
    }

    /**
     * Constructs a new sharpen post process
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
            fragmentShader: ThinSharpenPostProcess.FragmentUrl,
            uniforms: ThinSharpenPostProcess.Uniforms,
        });
    }

    /**
     * How much of the original color should be applied. Setting this to 0 will display edge detection. (default: 1)
     */
    public colorAmount: number = 1.0;
    /**
     * How much sharpness should be applied (default: 0.3)
     */
    public edgeAmount: number = 0.3;

    /**
     * The width of the source texture
     */
    public textureWidth: number = 0;

    /**
     * The height of the source texture
     */
    public textureHeight: number = 0;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat2("screenSize", this.textureWidth, this.textureHeight);
        effect.setFloat2("sharpnessAmounts", this.edgeAmount, this.colorAmount);
    }
}
