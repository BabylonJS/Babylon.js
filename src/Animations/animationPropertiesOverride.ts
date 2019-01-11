import { Animation } from "../Animations/animation";

/**
 * Class used to override all child animations of a given target
 */
export class AnimationPropertiesOverride {
    /**
     * Gets or sets a value indicating if animation blending must be used
     */
    public enableBlending = false;

    /**
     * Gets or sets the blending speed to use when enableBlending is true
     */
    public blendingSpeed = 0.01;

    /**
     * Gets or sets the default loop mode to use
     */
    public loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;
}
