import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";

/**
 * @internal
 */
export class DepthOfFieldMergePostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "depthOfFieldMerge";

    public static readonly Samplers = ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2"];

    /**
     * Gets a string identifying the name of the class
     * @returns "DepthOfFieldMergePostProcessImpl" string
     */
    public getClassName(): string {
        return "DepthOfFieldMergePostProcessImpl";
    }

    public bind() {}
}
