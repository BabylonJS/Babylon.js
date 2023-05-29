import type { ShaderCustomProcessingFunction } from "../Engines/Processors/shaderProcessingOptions";
import type { SmartArray } from "../Misc/smartArray";

declare type BaseTexture = import("./Textures/baseTexture").BaseTexture;
declare type EffectFallbacks = import("./effectFallbacks").EffectFallbacks;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;
declare type UniformBuffer = import("./uniformBuffer").UniformBuffer;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
declare type IAnimatable = import("../Animations/animatable.interface").IAnimatable;
declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;

/** @internal */
export type MaterialPluginCreated = {};

/** @internal */
export type MaterialPluginDisposed = {
    forceDisposeTextures?: boolean;
};

/** @internal */
export type MaterialPluginHasTexture = {
    hasTexture: boolean;
    texture: BaseTexture;
};

/** @internal */
export type MaterialPluginIsReadyForSubMesh = {
    isReadyForSubMesh: boolean;
    defines: MaterialDefines;
    subMesh: SubMesh;
};

/** @internal */
export type MaterialPluginGetDefineNames = {
    defineNames?: { [name: string]: { type: string; default: any } };
};

/** @internal */
export type MaterialPluginPrepareEffect = {
    defines: MaterialDefines;
    fallbacks: EffectFallbacks;
    fallbackRank: number;
    customCode?: ShaderCustomProcessingFunction;
    attributes: string[];
    uniforms: string[];
    samplers: string[];
    uniformBuffersNames: string[];
    mesh: AbstractMesh;
};

/** @internal */
export type MaterialPluginPrepareDefines = {
    defines: MaterialDefines;
    mesh: AbstractMesh;
};

/** @internal */
export type MaterialPluginPrepareUniformBuffer = {
    ubo: UniformBuffer;
};

/** @internal */
export type MaterialPluginBindForSubMesh = {
    subMesh: SubMesh;
};

/** @internal */
export type MaterialPluginGetAnimatables = {
    animatables: IAnimatable[];
};

/** @internal */
export type MaterialPluginGetActiveTextures = {
    activeTextures: BaseTexture[];
};

/** @internal */
export type MaterialPluginFillRenderTargetTextures = {
    renderTargets: SmartArray<RenderTargetTexture>;
};

/** @internal */
export type MaterialPluginHasRenderTargetTextures = {
    hasRenderTargetTextures: boolean;
};

/** @internal */
export type MaterialPluginHardBindForSubMesh = {
    subMesh: SubMesh;
};

/**
 * @internal
 */
export enum MaterialPluginEvent {
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
    FillRenderTargetTextures = 0x0800,
    HasRenderTargetTextures = 0x1000,
    HardBindForSubMesh = 0x2000,
}
