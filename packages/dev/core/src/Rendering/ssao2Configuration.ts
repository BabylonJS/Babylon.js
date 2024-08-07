import { PREPASS_NORMAL_TEXTURE_TYPE, PREPASS_DEPTH_TEXTURE_TYPE } from "../Engines/constants";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";

/**
 * Contains all parameters needed for the prepass to perform
 * screen space subsurface scattering
 */
export class SSAO2Configuration implements PrePassEffectConfiguration {
    /**
     * Is subsurface enabled
     */
    public enabled = false;

    /**
     * Name of the configuration
     */
    public name = "ssao2";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [PREPASS_NORMAL_TEXTURE_TYPE, PREPASS_DEPTH_TEXTURE_TYPE];
}
