import { ToGammaSpace } from "../Maths/math.constants";
import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class ExtractHighlightsPostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "extractHighlights";

    public static readonly Uniforms = ["threshold", "exposure"];

    public gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this.postProcess._webGPUReady = true;
            list.push(import("../ShadersWGSL/extractHighlights.fragment"));
        } else {
            list.push(import("../Shaders/extractHighlights.fragment"));
        }
    }

    /**
     * The luminance threshold, pixels below this value will be set to black.
     */
    public threshold = 0.9;

    /** @internal */
    public _exposure = 1;

    public bind() {
        const effect = this._drawWrapper.effect!;

        effect.setFloat("threshold", Math.pow(this.threshold, ToGammaSpace));
        effect.setFloat("exposure", this._exposure);
    }
}
