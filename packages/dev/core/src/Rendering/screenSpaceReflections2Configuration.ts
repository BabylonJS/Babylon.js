import { Constants } from "../Engines/constants";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";

/**
 * Contains all parameters needed for the prepass to perform
 * screen space reflections
 */
export class ScreenSpaceReflections2Configuration implements PrePassEffectConfiguration {
    /**
     * Is ssr enabled
     */
    public enabled = false;

    /**
     * Name of the configuration
     */
    public name = "screenSpaceReflections2";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [Constants.PREPASS_NORMAL_TEXTURE_TYPE, Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE];

    /**
     * @param useScreenspaceDepth If the effect should use the screenspace depth texture instead of a linear one
     */
    constructor(useScreenspaceDepth: boolean = false) {
        this.texturesRequired.push(useScreenspaceDepth ? Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE : Constants.PREPASS_DEPTH_TEXTURE_TYPE);
    }
}
