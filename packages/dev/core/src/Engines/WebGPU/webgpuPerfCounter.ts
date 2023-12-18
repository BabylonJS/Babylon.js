import { GPUPerfCounter } from "../../Misc/gpuPerfCounter";

/**
 * Class used to define a WebGPU performance counter
 */
export class WebGPUPerfCounter extends GPUPerfCounter {
    private _gpuTimeInFrameId = -1;

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
