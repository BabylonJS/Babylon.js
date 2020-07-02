import { PrePassEffectConfiguration } from "./prepassEffectConfiguration";
/**
 * Contains all parameters needed for the prepass to perform
 * screen space subsurface scattering
 */
export class SSAO2Configuration implements PrePassEffectConfiguration {

    public enabled = false;

    /**
     * Builds a ssao 2 configuration object
     */
    constructor() {

    }

    public dispose() {
    }
}