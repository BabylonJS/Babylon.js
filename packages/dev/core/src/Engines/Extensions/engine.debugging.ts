/* eslint-disable @typescript-eslint/no-unused-vars */
import { ThinEngine } from "../../Engines/thinEngine";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
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

ThinEngine.prototype._debugPushGroup = function (groupName: string, targetObject?: number): void {};

ThinEngine.prototype._debugPopGroup = function (targetObject?: number): void {};

ThinEngine.prototype._debugInsertMarker = function (text: string, targetObject?: number): void {};

ThinEngine.prototype._debugFlushPendingCommands = function (): void {};
