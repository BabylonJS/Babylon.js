/** This file must only contain pure code and pure imports */

import { AbstractEngine } from "../abstractEngine.pure";
import { PerfCounter } from "../../Misc/perfCounter";

let _Registered = false;
/**
 * Register side effects for abstractEngineTimeQuery.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineTimeQuery(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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
