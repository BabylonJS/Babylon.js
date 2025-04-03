// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

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

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/blackAndWhite.fragment"));
        } else {
            list.push(import("../Shaders/blackAndWhite.fragment"));
        }
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
            engine: engine || Engine.LastCreatedEngine!,
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
