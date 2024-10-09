import { serialize } from "core/Misc";
import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class BlackAndWhitePostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "blackAndWhite";

    public static readonly Uniforms = ["degree"];

    /**
     * Gets a string identifying the name of the class
     * @returns "BlackAndWhitePostProcessImpl" string
     */
    public getClassName(): string {
        return "BlackAndWhitePostProcessImpl";
    }

    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    @serialize()
    public degree = 1;

    public bind() {
        this._drawWrapper.effect!.setFloat("degree", this.degree);
    }
}
