import { Animation } from "../Animations/animation";

/**
 * Class used to override all child animations of a given target
 */
export class AnimationPropertiesOverride {
    /**
     * @returns a value indicating if animation blending must be used
     */
    public enableBlending = false;

    /**
     * @returns the blending speed to use when enableBlending is true
     */
    public blendingSpeed = 0.01;

    /**
     * @returns the default loop mode to use
     */
    public loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;
}
