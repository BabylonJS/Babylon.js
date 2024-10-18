// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, ThinPostProcessOptions } from "core/index";
import { ThinPostProcess } from "./thinPostProcess";

export class ThinBlackAndWhitePostProcess extends ThinPostProcess {
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

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: ThinPostProcessOptions) {
        super(name, ThinBlackAndWhitePostProcess.FragmentUrl, engine, {
            uniforms: ThinBlackAndWhitePostProcess.Uniforms,
            ...options,
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
