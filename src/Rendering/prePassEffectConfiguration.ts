import { PostProcess } from "../PostProcesses/postProcess";

/**
 * Interface for defining prepass effects in the prepass post-process pipeline
 */
export interface PrePassEffectConfiguration {
    /**
     * Post process to attach for this effect
     */
    postProcess: PostProcess;
    /**
     * Is the effect enabled
     */
    enabled: boolean;
    /**
     * Disposes the effect configuration
     */
    dispose(): void;
    /**
     * Disposes the effect configuration
     */
    createPostProcess: () => PostProcess;
}