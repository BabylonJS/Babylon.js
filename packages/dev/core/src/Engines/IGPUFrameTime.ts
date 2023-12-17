import type { PerfCounter } from "core/Misc/perfCounter";

/**
 * Interface used to define GPU Frame Time
 */
export interface IGPUFrameTime {
    /**
     * The GPU time in nanoseconds spent in the last frame
     */
    gpuTimeInFrame: PerfCounter;

    /** @internal */
    _gpuTimeInFrameId: number;
}
