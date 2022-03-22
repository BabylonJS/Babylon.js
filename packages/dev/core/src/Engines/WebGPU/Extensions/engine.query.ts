import type { OcclusionQuery } from "../../Extensions/engine.query";
import { WebGPUEngine } from "../../webgpuEngine";
import { WebGPURenderItemBeginOcclusionQuery, WebGPURenderItemEndOcclusionQuery } from "../webgpuBundleList";

declare type PerfCounter = import("../../../Misc/perfCounter").PerfCounter;

WebGPUEngine.prototype.getGPUFrameTimeCounter = function (): PerfCounter {
    return this._timestampQuery.gpuFrameTimeCounter;
};

WebGPUEngine.prototype.captureGPUFrameTime = function (value: boolean) {
    this._timestampQuery.enable = value && !!this._caps.timerQuery;
};

WebGPUEngine.prototype.createQuery = function (): OcclusionQuery {
    return this._occlusionQuery.createQuery();
};

WebGPUEngine.prototype.deleteQuery = function (query: OcclusionQuery): WebGPUEngine {
    this._occlusionQuery.deleteQuery(query as number);

    return this;
};

WebGPUEngine.prototype.isQueryResultAvailable = function (query: OcclusionQuery): boolean {
    return this._occlusionQuery.isQueryResultAvailable(query as number);
};

WebGPUEngine.prototype.getQueryResult = function (query: OcclusionQuery): number {
    return this._occlusionQuery.getQueryResult(query as number);
};

WebGPUEngine.prototype.beginOcclusionQuery = function (algorithmType: number, query: OcclusionQuery): boolean {
    if (this.compatibilityMode) {
        if (this._occlusionQuery.canBeginQuery) {
            this._currentRenderPass?.beginOcclusionQuery(query as number);
            return true;
        }
    } else {
        const renderPassIndex = this._getCurrentRenderPassIndex();
        const bundleList = renderPassIndex === 0 ? this._bundleList : this._bundleListRenderTarget;
        bundleList.addItem(new WebGPURenderItemBeginOcclusionQuery(query as number));
        return true;
    }

    return false;
};

WebGPUEngine.prototype.endOcclusionQuery = function (): WebGPUEngine {
    if (this.compatibilityMode) {
        this._currentRenderPass?.endOcclusionQuery();
    } else {
        const renderPassIndex = this._getCurrentRenderPassIndex();
        const bundleList = renderPassIndex === 0 ? this._bundleList : this._bundleListRenderTarget;
        bundleList.addItem(new WebGPURenderItemEndOcclusionQuery());
    }
    return this;
};
