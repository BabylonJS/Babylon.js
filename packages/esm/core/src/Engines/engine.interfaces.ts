import type { IOfflineProvider } from "@babylonjs/core/Offline/IOfflineProvider.js";

export enum EngineType {
    BASE,
    NULL,
    NATIVE,
    WEBGL,
    WEBGPU,
}

export interface IEngineInitOptions {
    type: EngineType;
}

export interface ISceneLike {
    addPendingData(data: any): void;
    removePendingData(data: any): void;
    offlineProvider: IOfflineProvider;
}
