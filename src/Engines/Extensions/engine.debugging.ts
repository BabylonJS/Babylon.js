import { ThinEngine } from "../../Engines/thinEngine";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /** @hidden */
        _debugPushGroup(groupName: string, targetObject?: number): void;

        /** @hidden */
        _debugPopGroup(targetObject?: number): void;

        /** @hidden */
        _debugInsertMarker(text: string, targetObject?: number): void;

        /** @hidden */
        _debugFlushPendingCommands(): void;
    }
}

ThinEngine.prototype._debugPushGroup = function(groupName: string, targetObject?: number): void {
};

ThinEngine.prototype._debugPopGroup = function(targetObject?: number): void {
};

ThinEngine.prototype._debugInsertMarker = function(text: string, targetObject?: number): void {
};

ThinEngine.prototype._debugFlushPendingCommands = function(): void {
};
