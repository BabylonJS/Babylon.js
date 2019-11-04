declare type Effect = import("./effect").Effect;

/**
 * Interface used to define common properties for effect fallbacks
 */
export interface IEffectFallbacks {
    /**
     * Removes the defines that should be removed when falling back.
     * @param currentDefines defines the current define statements for the shader.
     * @param effect defines the current effect we try to compile
     * @returns The resulting defines with defines of the current rank removed.
     */
    reduce(currentDefines: string, effect: Effect): string;

    /**
     * Removes the fallback from the bound mesh.
     */
    unBindMesh(): void;

    /**
     * Checks to see if more fallbacks are still availible.
     */
    hasMoreFallbacks: boolean;
}