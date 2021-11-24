import { SmartArray } from "../Misc/smartArray";
import { EventInfo } from "./materialEvent";

declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;
declare type Effect = import("./effect").Effect;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;

/**
 * Properties used by the FillRenderTargetTextures event
 */
export type EventInfoFillRenderTargetTextures = EventInfo & {
    renderTargets: SmartArray<RenderTargetTexture>;
};

/**
 * Properties used by the Unbind event
 */
export type EventInfoUnbind = EventInfo & {
    needMarkAsTextureDirty: boolean;
    effect: Effect;
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
    0x20000: EventInfoUnbind;
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
     * Unbind event.
     */
    Unbind = 0x20000,
    /**
     * HardBindForSubMesh event.
     */
    HardBindForSubMesh = 0x40000,
}
