import { SmartArray } from "../Misc/smartArray";
import { EventInfo } from "./materialEvent";

declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;
declare type Effect = import("./effect").Effect;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;

/**
 *
 */
export type EventInfoFillRenderTargetTextures = EventInfo & {
    renderTargets: SmartArray<RenderTargetTexture>;
};

/**
 *
 */
export type EventInfoUnbind = EventInfo & {
    needMarkAsTextureDirty: boolean;
    effect: Effect;
};

/**
 *
 */
export type EventInfoHardBindForSubMesh = EventInfo & {
    subMesh: SubMesh;
};

/**
 *
 */
export type UserEventMapping = {
    0x10000: EventInfoFillRenderTargetTextures;
    0x20000: EventInfoUnbind;
    0x40000: EventInfoHardBindForSubMesh;
};

/**
 *
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
