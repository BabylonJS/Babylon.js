import { Constants } from "../Engines/constants";
import { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import { _DevTools } from '../Misc/devTools';

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
    public readonly texturesRequired: number[] = [
        Constants.PREPASS_NORMAL_TEXTURE_TYPE,
        Constants.PREPASS_DEPTH_TEXTURE_TYPE,
    ];
}