/**
 * Defines an animation to be applied to a model (translation, scale or rotation).
 */
export interface IModelAnimationConfiguration {
    /**
     * Time of animation, in seconds
     */
    time?: number;

    /**
     * Scale to apply
     */
    scaling?: {
        x: number;
        y: number;
        z: number;
    };

    /**
     * Easing function to apply
     */
    easingFunction?: number;

    /**
     * An Easing mode to apply to the easing function
     * See BABYLON.EasingFunction
     */
    easingMode?: number;
}