/* eslint-disable @typescript-eslint/no-unused-vars */
import { AbstractEngine } from "../../Engines/abstractEngine";

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

AbstractEngine.prototype._debugPushGroup = function (groupName: string): void {};

AbstractEngine.prototype._debugPopGroup = function (): void {};

AbstractEngine.prototype._debugInsertMarker = function (text: string): void {};
