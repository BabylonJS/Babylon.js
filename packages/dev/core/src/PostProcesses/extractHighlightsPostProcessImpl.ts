import { serialize } from "core/Misc";
import { ToGammaSpace } from "../Maths/math.constants";
import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class ExtractHighlightsPostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "extractHighlights";

    public static readonly Uniforms = ["threshold", "exposure"];

    /**
     * Gets a string identifying the name of the class
     * @returns "ExtractHighlightsPostProcessImpl" string
     */
    public getClassName(): string {
        return "ExtractHighlightsPostProcessImpl";
    }

    /**
     * The luminance threshold, pixels below this value will be set to black.
     */
    @serialize()
    public threshold = 0.9;

    /** @internal */
    public _exposure = 1;

    public bind() {
        const effect = this._drawWrapper.effect!;

        effect.setFloat("threshold", Math.pow(this.threshold, ToGammaSpace));
        effect.setFloat("exposure", this._exposure);
    }
}
