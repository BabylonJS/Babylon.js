import { Scene } from "../../scene";
import { PerformanceViewerCollector } from "./performanceViewerCollector";

Scene.prototype._getPerfCollector = function(this: Scene): PerformanceViewerCollector {
    if (!this._perfCollector) {
        this._perfCollector = new PerformanceViewerCollector(this);
    }

    return this._perfCollector;
};
