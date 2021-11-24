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
export type EventInfoPrepareDefines = EventInfo & {
    defines: MaterialDefines;
    mesh: AbstractMesh;
}

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
    0x0004: EventInfoHasRenderTargetTextures;
    0x0008: EventInfoHasTexture;
    0x0010: EventInfoIsReadyForSubMesh;
    0x0020: EventInfoGetDefineNames;
    0x0400: EventInfoPrepareDefines;
    0x1000: EventInfoBindForSubMesh;
    0x2000: EventInfoGetAnimatables;
    0x4000: EventInfoGetActiveTextures;
};

/**
 * @hidden
 */
export enum MaterialEvent {
    Created = 0x0001,
    Disposed = 0x0002,
    HasRenderTargetTextures = 0x0004,
    HasTexture = 0x0008,
    IsReadyForSubMesh = 0x0010,
    GetDefineNames = 0x0020,
    AddFallbacks = 0x0040,
    AddUniforms = 0x0080,
    AddSamplers = 0x0100,
    InjectCustomCode = 0x0200,
    PrepareDefines = 0x0400,
    PrepareUniformBuffer = 0x0800,
    BindForSubMesh = 0x1000,
    GetAnimatables = 0x2000,
    GetActiveTextures = 0x4000,
}

/**
 * Material event info interface.
 */
export interface MaterialEventInfoAddFallbacks {
    /**
     * Defines of the material we want to customize
     */
    defines: MaterialDefines;
    /**
     * The effect fallbacks
     */
    fallbacks: EffectFallbacks;
    /**
     * The effect fallback rank
     */
    fallbackRank: number;
}

/**
 * Material event info interface.
 */
export interface MaterialEventInfoAddUniforms {
    /**
     * The list of uniform names used in the shader
     */
    uniforms: string[];
}

/**
 * Material event info interface.
 */
export interface MaterialEventInfoAddSamplers {
    /**
     * The list of sampler (texture) names used in the shader
     */
    samplers: string[];
}

/**
 * Material event info interface.
 */
export interface MaterialEventInfoInjectCustomCode {
    /**
     * The customCode function to inject code.
     */
    customCode?: ShaderCustomProcessingFunction;
}

/**
 * Material event info interface.
 */
export interface MaterialEventInfoPrepareUniformBuffer {
    /**
     * The uniform buffer being prepared
     */
    ubo: UniformBuffer;
}
