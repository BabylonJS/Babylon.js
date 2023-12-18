import { PerfCounter } from "../../Misc/perfCounter";

/**
 * Class used to define a WebGPU performance counter
 */
export class WebGPUPerfCounter {
    private _gpuTimeInFrameId = -1;

    /**
     * The GPU time in nanoseconds spent in the last frame
     */
    public counter = new PerfCounter();

    /**
     * @internal
     */
    public _addDuration(currentFrameId: number, duration: number) {
        if (currentFrameId < this._gpuTimeInFrameId) {
            return;
        }
        if (this._gpuTimeInFrameId !== currentFrameId) {
            this.counter._fetchResult();
            this.counter.fetchNewFrame();
            this.counter.addCount(duration, false);
            this._gpuTimeInFrameId = currentFrameId;
        } else {
            this.counter.addCount(duration, false);
        }
    }
}
