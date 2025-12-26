import { Constants } from "../Engines/constants";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";

/**
 * Contains all parameters needed for the prepass to perform
 * selection outline rendering
 */
export class SelectionOutlineConfiguration implements PrePassEffectConfiguration {
    /**
     * Is selection outline enabled
     */
    public enabled = false;

    /**
     * Name of the configuration
     */
    public name = "selectionOutline";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [Constants.PREPASS_DEPTH_TEXTURE_TYPE];
}
