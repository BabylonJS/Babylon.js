import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IDebuggingEngineExtension {
    /** @internal */
    _debugPushGroup(engineState: IBaseEnginePublic, groupName: string, targetObject?: number): void;

    /** @internal */
    _debugPopGroup(engineState: IBaseEnginePublic, targetObject?: number): void;

    /** @internal */
    _debugInsertMarker(engineState: IBaseEnginePublic, text: string, targetObject?: number): void;

    /** @internal */
    _debugFlushPendingCommands(engineState: IBaseEnginePublic): void;
}
