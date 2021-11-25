import { ShaderCustomProcessingFunction } from "../Engines/Processors/shaderProcessingOptions";

declare type BaseTexture = import("./Textures/baseTexture").BaseTexture;
declare type EffectFallbacks = import("./effectFallbacks").EffectFallbacks;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;
declare type UniformBuffer = import("./uniformBuffer").UniformBuffer;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
declare type IAnimatable = import("../Animations/animatable.interface").IAnimatable;

/** @hidden */
export type EventInfo = {};

/** @hidden */
export type EventInfoCreated = EventInfo & {};

/** @hidden */
export type EventInfoDisposed = EventInfo & {
    forceDisposeTextures?: boolean;
};

/** @hidden */
export type EventInfoHasRenderTargetTextures = EventInfo & {
    hasRenderTargetTextures: boolean;
};

/** @hidden */
export type EventInfoHasTexture = EventInfo & {
    hasTexture: boolean;
    texture: BaseTexture;
};

/** @hidden */
export type EventInfoIsReadyForSubMesh = EventInfo & {
    isReadyForSubMesh: boolean;
    defines: MaterialDefines;
    subMesh: SubMesh;
};

/** @hidden */
export type EventInfoGetDefineNames = EventInfo & {
    defineNames?: { [name: string]: { type: string; default: any } };
};

/** @hidden */
export type EventInfoPrepareEffect = EventInfo & {
    defines: MaterialDefines;
    fallbacks: EffectFallbacks;
    fallbackRank: number;
    customCode?: ShaderCustomProcessingFunction;
    uniforms: string[];
    samplers: string[];
};

/** @hidden */
export type EventInfoPrepareDefines = EventInfo & {
    defines: MaterialDefines;
    mesh: AbstractMesh;
};

/** @hidden */
export type EventInfoPrepareUniformBuffer = EventInfo & {
    ubo: UniformBuffer;
};

/** @hidden */
export type EventInfoBindForSubMesh = EventInfo & {
    subMesh: SubMesh;
};

/** @hidden */
export type EventInfoGetAnimatables = EventInfo & {
    animatables: IAnimatable[];
};

/** @hidden */
export type EventInfoGetActiveTextures = EventInfo & {
    activeTextures: BaseTexture[];
};

/** @hidden */
export type EventMapping = {
    0x0001: EventInfoCreated;
    0x0002: EventInfoDisposed;
    0x0004: EventInfoGetDefineNames;
    0x0008: EventInfoPrepareUniformBuffer;
    0x0010: EventInfoIsReadyForSubMesh;
    0x0020: EventInfoPrepareDefines;
    0x0040: EventInfoBindForSubMesh;
    0x0080: EventInfoPrepareEffect;
    0x0100: EventInfoGetAnimatables;
    0x0200: EventInfoGetActiveTextures;
    0x0400: EventInfoHasTexture;
    0x0800: EventInfoHasRenderTargetTextures;
};

/**
 * @hidden
 */
export enum MaterialEvent {
    Created = 0x0001,
    Disposed = 0x0002,
    GetDefineNames = 0x0004,
    PrepareUniformBuffer = 0x0008,
    IsReadyForSubMesh = 0x0010,
    PrepareDefines = 0x0020,
    BindForSubMesh = 0x0040,
    PrepareEffect = 0x0080,
    GetAnimatables = 0x0100,
    GetActiveTextures = 0x0200,
    HasTexture = 0x0400,
    HasRenderTargetTextures = 0x0800,
}
