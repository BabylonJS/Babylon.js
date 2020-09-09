import { PrePassRenderer } from "./prePassRenderer";
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
        PrePassRenderer.DEPTHNORMAL_TEXTURE_TYPE
    ];

    /**
     * Builds a ssao2 configuration object
     * @param scene The scene
     */
    constructor() {

    }

    /**
     * Disposes the configuration
     */
    public dispose() {
        // pass
    }
}