// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { ToGammaSpace } from "../Maths/math.constants";
import { Engine } from "../Engines/engine";

export class ThinExtractHighlightsPostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "extractHighlights";

    public static readonly Uniforms = ["threshold", "exposure"];

    public override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/extractHighlights.fragment"));
        } else {
            list.push(import("../Shaders/extractHighlights.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            _useAsPostProcess: true,
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

    public override bind() {
        super.bind();

        const effect = this._drawWrapper.effect!;

        effect.setFloat("threshold", Math.pow(this.threshold, ToGammaSpace));
        effect.setFloat("exposure", this._exposure);
    }
}
