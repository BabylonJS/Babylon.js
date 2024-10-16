import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class BlackAndWhitePostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "blackAndWhite";

    public static readonly Uniforms = ["degree"];

    public gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this.postProcess._webGPUReady = true;
            list.push(import("../ShadersWGSL/blackAndWhite.fragment"));
        } else {
            list.push(import("../Shaders/blackAndWhite.fragment"));
        }
    }

    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    public degree = 1;

    public bind() {
        this._drawWrapper.effect!.setFloat("degree", this.degree);
    }
}
