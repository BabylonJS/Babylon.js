import { SmartArray } from "../Misc/smartArray";

declare type Engine = import("../Engines/engine").Engine;
declare type Scene = import("../scene").Scene;
declare type BaseTexture = import("./Textures/baseTexture").BaseTexture;
declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;
declare type Effect = import("./effect").Effect;
declare type EffectFallbacks = import("./effectFallbacks").EffectFallbacks;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;
declare type UniformBuffer = import("./uniformBuffer").UniformBuffer;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
declare type IAnimatable = import("../Animations/animatable.interface").IAnimatable;

/**
 * Flags to filter observables in events for material plugins.
 */
 export enum MaterialEvent {
    /**
     * Created material event.
     */
    Created = 0x0001,
    /**
     * Called the disableAlphaBlending getter event.
     */
    GetDisableAlphaBlending = 0x0002,
    /**
     * Material disposed event.
     */
    Disposed = 0x0004,

    HasRenderTargetTextures = 0x0008,

    HasTexture = 0x0010,

    IsReadyForSubMesh = 0x0020,

    CollectDefineNames = 0x0040,

    FillRenderTargetTextures = 0x0080,

    AddFallbacks = 0x0100,

    AddUniforms = 0x0200,

    AddSamplers = 0x0400,

    InjectCustomCode = 0x0800,

    PrepareDefines = 0x1000,

    PrepareUniformBuffer = 0x2000,

    Unbind = 0x4000,

    HardBindForSubMesh = 0x8000,

    BindForSubMesh = 0x010000,

    GetAnimatables = 0x020000,

    GetActiveTextures = 0x040000,

    /**
     * All material events.
     */
    All = 0xFFFFFF
}

export interface MaterialEventInfoGetDisableAlphaBlending {
    disableAlphaBlending: boolean;
}

export interface MaterialEventInfoDisposed {
    forceDisposeTextures: boolean;
}

export interface MaterialEventInfoHasTexture {
    hasTexture: boolean;
    texture: BaseTexture;
}

export interface MaterialEventInfoHasRenderTargetTextures {
    hasRenderTargetTextures: boolean;
}

export interface MaterialEventInfoIsReadyForSubMesh {
    isReadyForSubMesh: boolean;
    defines: MaterialDefines;
    scene: Scene;
    engine: Engine;
}

export interface MaterialEventInfoCollectDefineNames {
    defineNames: string[] | undefined;
}

export interface MaterialEventInfoFillRenderTargetTextures {
    renderTargets: SmartArray<RenderTargetTexture>;
}

export interface MaterialEventInfoAddFallbacks {
    defines: MaterialDefines;
    fallbacks: EffectFallbacks;
    fallbackRank: number;
}

export interface MaterialEventInfoAddUniforms {
    uniforms: string[];
}

export interface MaterialEventInfoAddSamplers {
    samplers: string[];
}

export interface MaterialEventInfoInjectCustomCode {
    customCode: (shaderType: string, code: string) => string;
}

export interface MaterialEventInfoPrepareDefines {
    defines: MaterialDefines;
    scene: Scene;
    mesh: AbstractMesh;
}

export interface MaterialEventInfoPrepareUniformBuffer {
    ubo: UniformBuffer;
}

export interface MaterialEventInfoUnbind {
    needFlag: boolean;
    effect: Effect;
}

export interface MaterialEventInfoHardBindForSubMesh {
    ubo: UniformBuffer;
    scene: Scene;
    engine: Engine;
    subMesh: SubMesh;
}

export interface MaterialEventInfoBindForSubMesh {
    ubo: UniformBuffer;
    scene: Scene;
    engine: Engine;
    subMesh: SubMesh;
}

export interface MaterialEventInfoGetAnimatables {
    animatables: IAnimatable[];
}

export interface MaterialEventInfoGetActiveTextures {
    activeTextures: BaseTexture[];
}