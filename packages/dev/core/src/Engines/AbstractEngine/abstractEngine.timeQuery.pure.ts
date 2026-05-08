/** This file must only contain pure code and pure imports */

import { AbstractEngine } from "../abstractEngine.pure";
import { PerfCounter } from "../../Misc/perfCounter";

let _registered = false;
export function registerAbstractEngineTimeQuery(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype.getGPUFrameTimeCounter = function () {
        if (!this._gpuFrameTime) {
            this._gpuFrameTime = new PerfCounter();
        }
        return this._gpuFrameTime;
    };

    AbstractEngine.prototype.captureGPUFrameTime = function (value: boolean): void {
        // Do nothing. Must be implemented by child classes
    };
}
