/**
 * Interface used to define GPU Frame Time
 */
export interface IGPUFrameTime {
    /**
     * The GPU time in nanoseconds spent in the last frame
     */
    gpuTimeInFrame: number;

    /** @internal */
    _gpuTimeInFrameId: number;
}
