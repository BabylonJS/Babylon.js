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

export type MaterialCustomCodeFunction = (shaderType: string, code: string) => string;

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
    /**
     * Disable alpha blending? Return value
     */
    disableAlphaBlending: boolean;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoDisposed {
    /**
     * Force disposal of the associated textures.
     */
    forceDisposeTextures: boolean;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoHasTexture {
    /**
     * Whether the texture exists (return value)
     */
    hasTexture: boolean;
    /**
     * The texture being checked.
     */
    texture: BaseTexture;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoHasRenderTargetTextures {
    /**
     * Whether it has render target textures (return value)
     */
    hasRenderTargetTextures: boolean;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoIsReadyForSubMesh {
    /**
     * Whether it's ready for SubMesh (return value)
     */
    isReadyForSubMesh: boolean;
    /**
     * Defines of the material we want to customize
     */
    defines: MaterialDefines;
    /**
     * Defines the scene we are rendering
     */
    scene: Scene;
    /**
     * Defines the engine we are using
     */
    engine: Engine;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoCollectDefineNames {
    /**
     * List of define names
     */
    defineNames: string[] | undefined;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoFillRenderTargetTextures {
    /**
     * Array of render target textures
     */
    renderTargets: SmartArray<RenderTargetTexture>;
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
    customCode: MaterialCustomCodeFunction;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoPrepareDefines {
    /**
     * Defines of the material we want to customize
     */
    defines: MaterialDefines;
    /**
     * Defines the scene we are rendering
     */
    scene: Scene;
    /**
     * Defines the mesh we're rendering
     */
    mesh: AbstractMesh;
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

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoUnbind {
    /**
     * Need flag?
     */
    needFlag: boolean;
    /**
     * The effect being unbound
     */
    effect: Effect;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoHardBindForSubMesh {
    /**
     * The uniform buffer being prepared
     */
    ubo: UniformBuffer;
    /**
     * Defines the scene we are rendering
     */
    scene: Scene;
    /**
     * Defines the engine we are using
     */
    engine: Engine;
    /**
     * Defines the submesh we're rendering
     */
    subMesh: SubMesh;
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoBindForSubMesh {
    /**
     * The uniform buffer being prepared
     */
    ubo: UniformBuffer;
    /**
     * Defines the scene we are rendering
     */
    scene: Scene;
    /**
     * Defines the engine we are using
     */
    engine: Engine;
    /**
     * Defines the submesh we're rendering
     */
    subMesh: SubMesh;
}

/**
 * Material event info interface.
 */
export interface MaterialEventInfoGetAnimatables {
    /**
     * List of animatables
     */
    animatables: IAnimatable[];
}

/**
 * Material event info interface.
 */
 export interface MaterialEventInfoGetActiveTextures {
    /**
     * List of active textures
     */
    activeTextures: BaseTexture[];
}