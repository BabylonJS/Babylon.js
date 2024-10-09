import { serialize } from "core/Misc";
import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class BloomMergePostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "bloomMerge";

    public static readonly Uniforms = ["bloomWeight"];

    public static readonly Samplers = ["bloomBlur"];

    /**
     * Gets a string identifying the name of the class
     * @returns "BloomMergePostProcessImpl" string
     */
    public getClassName(): string {
        return "BloomMergePostProcessImpl";
    }

    /** Weight of the bloom to be added to the original input. */
    @serialize()
    public weight = 1;

    public bind() {
        this._drawWrapper.effect!.setFloat("bloomWeight", this.weight);
    }
}
