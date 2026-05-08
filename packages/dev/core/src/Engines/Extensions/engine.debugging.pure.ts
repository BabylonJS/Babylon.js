import { AbstractEngine } from "../../Engines/abstractEngine.pure";
/** This file must only contain pure code and pure imports */

let _registered = false;
export function registerEngineDebugging(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype._debugPushGroup = function (groupName: string): void {};

    AbstractEngine.prototype._debugPopGroup = function (): void {};

    AbstractEngine.prototype._debugInsertMarker = function (text: string): void {};
}
