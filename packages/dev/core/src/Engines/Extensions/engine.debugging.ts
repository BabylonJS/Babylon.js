/* eslint-disable @typescript-eslint/no-unused-vars */
import { AbstractEngine } from "../../Engines/abstractEngine";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _debugPushGroup(groupName: string, targetObject?: number): void;

        /** @internal */
        _debugPopGroup(targetObject?: number): void;

        /** @internal */
        _debugInsertMarker(text: string, targetObject?: number): void;

        /** @internal */
        _debugFlushPendingCommands(): void;
    }
}

AbstractEngine.prototype._debugPushGroup = function (groupName: string, targetObject?: number): void {};

AbstractEngine.prototype._debugPopGroup = function (targetObject?: number): void {};

AbstractEngine.prototype._debugInsertMarker = function (text: string, targetObject?: number): void {};

AbstractEngine.prototype._debugFlushPendingCommands = function (): void {};
