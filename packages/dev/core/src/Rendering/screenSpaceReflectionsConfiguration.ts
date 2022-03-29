import { Constants } from "../Engines/constants";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";

/**
 * Contains all parameters needed for the prepass to perform
 * screen space reflections
 */
export class ScreenSpaceReflectionsConfiguration implements PrePassEffectConfiguration {
    /**
     * Is ssr enabled
     */
    public enabled = false;

    /**
     * Name of the configuration
     */
    public name = "screenSpaceReflections";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [Constants.PREPASS_NORMAL_TEXTURE_TYPE, Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE, Constants.PREPASS_POSITION_TEXTURE_TYPE];
}
