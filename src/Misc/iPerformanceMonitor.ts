/**
 * Interface for performance monitor tracks rolling average frame-time and frame-time variance over a user defined sliding-window
 */
export interface IPerformanceMonitor {
    /**
     * Enables contributions to the sliding window sample set
     */
    enable(): void;

    /**
     * Disables contributions to the sliding window sample set
     * Samples will not be interpolated over the disabled period
     */
    disable(): void;

    /**
     * Samples current frame
     * @param timeMs A timestamp in milliseconds of the current frame to compare with other frames
     */
    sampleFrame(timeMs?: number): void;

    /**
     * Returns the average frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
     */
    averageFrameTime: number;

    /**
     * Returns the variance frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
     */
    averageFrameTimeVariance: number;

    /**
     * Returns the frame time of the most recent frame
     */
    instantaneousFrameTime: number;

    /**
     * Returns the average framerate in frames per second over the sliding window (or the subset of frames sampled so far)
     */
    averageFPS: number;

    /**
     * Returns the average framerate in frames per second using the most recent frame time
     */
    instantaneousFPS: number;
}