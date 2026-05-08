import { AbstractEngine } from "../../Engines/abstractEngine.pure";
/** This file must only contain pure code and pure imports */

let _Registered = false;
/**
 * Register side effects for engineDebugging.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEngineDebugging(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    AbstractEngine.prototype._debugPushGroup = function (groupName: string): void {};

    AbstractEngine.prototype._debugPopGroup = function (): void {};

    AbstractEngine.prototype._debugInsertMarker = function (text: string): void {};
}
