import { PrePassRenderer } from "./prePassRenderer";
import { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import { _DevTools } from '../Misc/devTools';

/**
 * Contains all parameters needed for the prepass to perform
 * motion blur
 */
export class MotionBlurConfiguration implements PrePassEffectConfiguration {
    /**
     * Is motion blur enabled
     */
    public enabled = false;

    /**
     * Name of the configuration
     */
    public name = "motionBlur";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [
        PrePassRenderer.VELOCITY_TEXTURE_TYPE
    ];

    /**
     * Builds a motion blur configuration object
     * @param scene The scene
     */
    constructor() {

    }

    public dispose() {

    }
}