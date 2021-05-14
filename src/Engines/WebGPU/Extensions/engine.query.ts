import { WebGPUEngine } from "../../webgpuEngine";

declare type PerfCounter = import("../../../Misc/perfCounter").PerfCounter;

WebGPUEngine.prototype.getGPUFrameTimeCounter = function(): PerfCounter {
    return this._timestampQuery.gpuFrameTimeCounter;
};

WebGPUEngine.prototype.captureGPUFrameTime = function(value: boolean) {
    this._timestampQuery.enable = value;
};
