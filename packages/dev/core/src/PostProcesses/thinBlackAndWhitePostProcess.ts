// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

export class ThinBlackAndWhitePostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "blackAndWhite";

    public static readonly Uniforms = ["degree"];

    public override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/blackAndWhite.fragment"));
        } else {
            list.push(import("../Shaders/blackAndWhite.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            _useAsPostProcess: true,
            fragmentShader: ThinBlackAndWhitePostProcess.FragmentUrl,
            uniforms: ThinBlackAndWhitePostProcess.Uniforms,
        });
    }

    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    public degree = 1;

    public override bind() {
        super.bind();
        this._drawWrapper.effect!.setFloat("degree", this.degree);
    }
}
