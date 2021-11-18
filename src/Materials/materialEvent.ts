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
 * @since 5.0.0
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
    /**
     * HasRenderTargetTextures event.
     */
    HasRenderTargetTextures = 0x0008,
    /**
     * HasTexture event.
     */
    HasTexture = 0x0010,
    /**
     * IsReadyForSubMesh event.
     */
    IsReadyForSubMesh = 0x0020,
    /**
     * CollectDefineNames event.
     */
    CollectDefineNames = 0x0040,
    /**
     * FillRenderTargetTextures event.
     */
    FillRenderTargetTextures = 0x0080,
    /**
     * AddFallbacks event.
     */
    AddFallbacks = 0x0100,
    /**
     * AddUniforms event.
     */
    AddUniforms = 0x0200,
    /**
     * AddSamplers event.
     */
    AddSamplers = 0x0400,
    /**
     * InjectCustomCode event.
     */
    InjectCustomCode = 0x0800,
    /**
     * PrepareDefines event.
     */
    PrepareDefines = 0x1000,
    /**
     * PrepareUniformBuffer event.
     */
    PrepareUniformBuffer = 0x2000,
    /**
     * Unbind event.
     */
    Unbind = 0x4000,
    /**
     * HardBindForSubMesh event.
     */
    HardBindForSubMesh = 0x8000,
    /**
     * BindForSubMesh event.
     */
    BindForSubMesh = 0x010000,
    /**
     * GetAnimatables event.
     */
    GetAnimatables = 0x020000,
    /**
     * GetActiveTextures event.
     */
    GetActiveTextures = 0x040000,

    /**
     * All material events.
     */
    All = 0xFFFFFF
}

/**
 * Material event info interface.
 */
export interface MaterialEventInfoGetDisableAlphaBlending {
    disableAlphaBlending: boolean;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoDisposed {
    forceDisposeTextures: boolean;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoHasTexture {
    hasTexture: boolean;
    texture: BaseTexture;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoHasRenderTargetTextures {
    hasRenderTargetTextures: boolean;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoIsReadyForSubMesh {
    isReadyForSubMesh: boolean;
    defines: MaterialDefines;
    scene: Scene;
    engine: Engine;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoCollectDefineNames {
    defineNames: string[] | undefined;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoFillRenderTargetTextures {
    renderTargets: SmartArray<RenderTargetTexture>;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoAddFallbacks {
    defines: MaterialDefines;
    fallbacks: EffectFallbacks;
    fallbackRank: number;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoAddUniforms {
    uniforms: string[];
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoAddSamplers {
    samplers: string[];
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoInjectCustomCode {
    customCode: (shaderType: string, code: string) => string;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoPrepareDefines {
    defines: MaterialDefines;
    scene: Scene;
    mesh: AbstractMesh;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoPrepareUniformBuffer {
    ubo: UniformBuffer;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoUnbind {
    needFlag: boolean;
    effect: Effect;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoHardBindForSubMesh {
    ubo: UniformBuffer;
    scene: Scene;
    engine: Engine;
    subMesh: SubMesh;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoBindForSubMesh {
    ubo: UniformBuffer;
    scene: Scene;
    engine: Engine;
    subMesh: SubMesh;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoGetAnimatables {
    animatables: IAnimatable[];
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoGetActiveTextures {
    activeTextures: BaseTexture[];
}