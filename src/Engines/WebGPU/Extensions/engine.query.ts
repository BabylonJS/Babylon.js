import { OcclusionQuery } from "../../Extensions/engine.query";
import { WebGPUEngine } from "../../webgpuEngine";

declare type PerfCounter = import("../../../Misc/perfCounter").PerfCounter;

WebGPUEngine.prototype.getGPUFrameTimeCounter = function(): PerfCounter {
    return this._timestampQuery.gpuFrameTimeCounter;
};

WebGPUEngine.prototype.captureGPUFrameTime = function(value: boolean) {
    this._timestampQuery.enable = value;
};

WebGPUEngine.prototype.createQuery = function(): OcclusionQuery {
    return this._occlusionQuery.createQuery();
};

WebGPUEngine.prototype.deleteQuery = function(query: OcclusionQuery): WebGPUEngine {
    this._occlusionQuery.deleteQuery(query as number);

    return this;
};

WebGPUEngine.prototype.isQueryResultAvailable = function(query: OcclusionQuery): boolean {
    return this._occlusionQuery.isQueryResultAvailable(query as number);
};

WebGPUEngine.prototype.getQueryResult = function(query: OcclusionQuery): number {
    return this._occlusionQuery.getQueryResult(query as number);
};

WebGPUEngine.prototype.beginOcclusionQuery = function(algorithmType: number, query: OcclusionQuery): boolean {
    if (this._occlusionQuery.canBeginQuery) {
        this._currentRenderPass?.beginOcclusionQuery(query as number);
        return true;
    }

    return false;
};

WebGPUEngine.prototype.endOcclusionQuery = function(algorithmType: number): WebGPUEngine {
    this._currentRenderPass?.endOcclusionQuery();
    return this;
};
