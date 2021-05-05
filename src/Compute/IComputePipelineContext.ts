/**
 * Class used to store and describe the pipeline context associated with a compute effect
 */
export interface IComputePipelineContext {
    /**
     * Gets a boolean indicating that this pipeline context is supporting asynchronous creating
     */
    isAsync: boolean;
    /**
     * Gets a boolean indicating that the context is ready to be used (like shader / pipeline are compiled and ready for instance)
     */
    isReady: boolean;

    /** @hidden */
    _name?:  string;

    /** @hidden */
    _getComputeShaderCode(): string | null;

    /** Releases the resources associated with the pipeline. */
    dispose(): void;
}