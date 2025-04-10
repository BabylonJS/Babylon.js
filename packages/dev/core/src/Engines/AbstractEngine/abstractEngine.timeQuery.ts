import { AbstractEngine } from "../abstractEngine";
import { PerfCounter } from "../../Misc/perfCounter";
import type { Nullable } from "../../types";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _gpuFrameTime: Nullable<PerfCounter>;
        /**
         * Get the performance counter associated with the frame time computation
         * @returns the perf counter
         */
        getGPUFrameTimeCounter(): PerfCounter;
        /**
         * Enable or disable the GPU frame time capture
         * @param value True to enable, false to disable
         */
        captureGPUFrameTime(value: boolean): void;
    }
}

AbstractEngine.prototype.getGPUFrameTimeCounter = function () {
    if (!this._gpuFrameTime) {
        this._gpuFrameTime = new PerfCounter();
    }
    return this._gpuFrameTime;
};

AbstractEngine.prototype.captureGPUFrameTime = function (value: boolean): void {
    // Do nothing. Must be implemented by child classes
};
