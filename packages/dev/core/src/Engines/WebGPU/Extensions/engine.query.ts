import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPURenderItemBeginOcclusionQuery, WebGPURenderItemEndOcclusionQuery } from "../webgpuBundleList";

import type { PerfCounter } from "../../../Misc/perfCounter";
import type { OcclusionQuery } from "../../../Engines/AbstractEngine/abstractEngine.query";

import "../../../Engines/AbstractEngine/abstractEngine.query";

ThinWebGPUEngine.prototype.getGPUFrameTimeCounter = function (): PerfCounter {
    return this._timestampQuery.gpuFrameTimeCounter;
};

ThinWebGPUEngine.prototype.captureGPUFrameTime = function (value: boolean) {
    this._timestampQuery.enable = value && !!this._caps.timerQuery;
};

ThinWebGPUEngine.prototype.createQuery = function (): OcclusionQuery {
    return this._occlusionQuery.createQuery();
};

ThinWebGPUEngine.prototype.deleteQuery = function (query: OcclusionQuery): ThinWebGPUEngine {
    this._occlusionQuery.deleteQuery(query as number);

    return this;
};

ThinWebGPUEngine.prototype.isQueryResultAvailable = function (query: OcclusionQuery): boolean {
    return this._occlusionQuery.isQueryResultAvailable(query as number);
};

ThinWebGPUEngine.prototype.getQueryResult = function (query: OcclusionQuery): number {
    return this._occlusionQuery.getQueryResult(query as number);
};

ThinWebGPUEngine.prototype.beginOcclusionQuery = function (algorithmType: number, query: OcclusionQuery): boolean {
    if (this.compatibilityMode) {
        if (this._occlusionQuery.canBeginQuery(query as number)) {
            this._currentRenderPass?.beginOcclusionQuery(query as number);
            return true;
        }
    } else {
        this._bundleList.addItem(new WebGPURenderItemBeginOcclusionQuery(query as number));
        return true;
    }

    return false;
};

ThinWebGPUEngine.prototype.endOcclusionQuery = function (): ThinWebGPUEngine {
    if (this.compatibilityMode) {
        this._currentRenderPass?.endOcclusionQuery();
    } else {
        this._bundleList.addItem(new WebGPURenderItemEndOcclusionQuery());
    }
    return this;
};
