/** This file must only contain pure code and pure imports */

import { Scene } from "../../scene.pure";
import { PerformanceViewerCollector } from "./performanceViewerCollector";

Scene.prototype.getPerfCollector = function (this: Scene): PerformanceViewerCollector {
    if (!this._perfCollector) {
        this._perfCollector = new PerformanceViewerCollector(this);
    }

    return this._perfCollector;
};
