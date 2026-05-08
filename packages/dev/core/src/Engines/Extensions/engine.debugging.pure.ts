import { AbstractEngine } from "../../Engines/abstractEngine";
/** This file must only contain pure code and pure imports */



/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Note that users may not import this file, so each time we want to call one of them, we must check if it exists.
 * @internal
 */

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _debugPushGroup(groupName: string): void;

        /** @internal */
        _debugPopGroup(): void;

        /** @internal */
        _debugInsertMarker(text: string): void;
    }
}

export {};


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
