import { SmartArray } from "../Misc/smartArray";
import { EventInfo } from "./materialEvent";

declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;

/**
 * Properties used by the FillRenderTargetTextures event
 */
export type EventInfoFillRenderTargetTextures = EventInfo & {
    renderTargets: SmartArray<RenderTargetTexture>;
};

/** @hidden */
export type EventInfoHasRenderTargetTextures = EventInfo & {
    hasRenderTargetTextures: boolean;
};

/**
 * Properties used by the HardBindForSubMesh event
 */
export type EventInfoHardBindForSubMesh = EventInfo & {
    subMesh: SubMesh;
};

/**
 * Mapping between material user event and event structures
 */
export type UserEventMapping = {
    0x10000: EventInfoFillRenderTargetTextures;
    0x20000: EventInfoHasRenderTargetTextures;
    0x40000: EventInfoHardBindForSubMesh;
};

/**
 * List of the material user events
 */
export enum MaterialUserEvent {
    /**
     * FillRenderTargetTextures event.
     */
    FillRenderTargetTextures = 0x10000,
    /**
     * HasRenderTargetTextures event.
     */
    HasRenderTargetTextures = 0x20000,
    /**
     * HardBindForSubMesh event.
     */
    HardBindForSubMesh = 0x40000,
}
