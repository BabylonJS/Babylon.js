import type { Nullable } from "core/types";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import type { AnimationConfiguration } from "./animationConfiguration";

/**
 * Input parameters required to load and play an animation
 */
export type AnimationInput = {
    /** The container where the canvas that displays the animation is rendered */
    container: HTMLDivElement;
    /** The source of the animation data, either a URL or the raw JSON data */
    animationSource: string | RawLottieAnimation;
    /** A map of variables to be used in the animation */
    variables: Nullable<Map<string, string>>;
    /** Configuration options for the animation */
    configuration: Nullable<Partial<AnimationConfiguration>>;
};
