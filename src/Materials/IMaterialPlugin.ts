import { SmartArray } from "../Misc/smartArray";
import { Nullable } from "../types";

declare type Engine = import("../Engines/engine").Engine;
declare type Scene = import("../scene").Scene;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;
declare type IAnimatable = import("../Animations/animatable.interface").IAnimatable;
declare type UniformBuffer = import("./uniformBuffer").UniformBuffer;
declare type Effect = import("./effect").Effect;
declare type EffectFallbacks = import("./effectFallbacks").EffectFallbacks;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;
declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;
declare type BaseTexture = import("./Textures/baseTexture").BaseTexture;

/**
 * Interface for material plugins.
 * @since 5.0
 */
export interface IMaterialPlugin {
    /**
     * Defines the priority of the plugin. Lower numbers run first.
     */
    priority: number;

    /**
     * True if alpha blending should be disabled.
     */
     disableAlphaBlending?: boolean;

    /**
     * Initialize the plugin.
     *
     * @param scene defines the scene the material belongs to.
     * @param dirtyCallbacks The list of dirty callbacks
     */
    initialize?(scene: Scene, dirtyCallbacks: { [code: number]: () => void }): void;

    /**
    * Get the current class name useful for serialization or dynamic coding.
    * @returns The class name.
    */
    getClassName(): string;

    /**
     * Specifies that the submesh is ready to be used.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene the material belongs to.
     * @returns - boolean indicating that the submesh is ready or not.
     */
    isReadyForSubMesh?(defines: MaterialDefines, scene: Scene, engine: Engine): boolean;

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine the engine this scene belongs to.
     * @param subMesh the submesh to bind data for
     */
    bindForSubMesh?(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void;

    /**
     * Disposes the resources of the material.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    dispose?(forceDisposeTextures?: boolean): void;

    /**
     * Returns list of custom shader code fragments to customize the shader.
     * @param shaderType "vertex" or "fragment"
     * @returns null if no code to be added, or a list of pointName => code.
     */
    getCustomCode?(shaderType: string): Nullable<{ [pointName: string]: string }>;

    /**
     * Collects all define names.
     * @param names The array to append to.
     */
    collectDefineNames?(names: string[]): void;

    /**
     * Checks to see if a texture is used in the material.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene to the material belongs to.
     * @param mesh the mesh being rendered
     */
    prepareDefines?(defines: MaterialDefines, scene: Scene, mesh: AbstractMesh): void;

    /**
     * Binds the material data (this function is called even if mustRebind() returns false)
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param isFrozen defines whether the material is frozen or not.
     * @param lodBasedMicrosurface defines whether the material relies on lod based microsurface or not.
     * @param realTimeFiltering defines whether the textures should be filtered on the fly.
     * @param subMesh the submesh to bind data for
     */
    hardBindForSubMesh?(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void;

    /**
     * Unbinds the material from the mesh.
     * @param activeEffect defines the effect that should be unbound from.
     * @returns true if unbound, otherwise false
     */
    unbind?(activeEffect: Effect): boolean;

    /**
     * Fills the list of render target textures.
     * @param renderTargets the list of render targets to update
     */
    fillRenderTargetTextures?(renderTargets: SmartArray<RenderTargetTexture>): void;

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    hasTexture?(texture: BaseTexture): boolean;

    /**
     * Gets a boolean indicating that current material needs to register RTT
     * @returns true if this uses a render target otherwise false.
     */
    hasRenderTargetTextures?(): boolean;

    /**
     * Returns an array of the actively used textures.
     * @param activeTextures Array of BaseTextures
     */
    getActiveTextures?(activeTextures: BaseTexture[]): void;

    /**
     * Returns the animatable textures.
     * @param animatables Array of animatable textures.
     */
    getAnimatables?(animatables: IAnimatable[]): void;

    /**
     * Add fallbacks to the effect fallbacks list.
     * @param defines defines the Base texture to use.
     * @param fallbacks defines the current fallback list.
     * @param currentRank defines the current fallback rank.
     * @returns the new fallback rank.
     */
    addFallbacks?(defines: MaterialDefines, fallbacks: EffectFallbacks, currentRank: number): number;

    /**
     * Add the required uniforms to the current list.
     * @param uniforms defines the current uniform list.
     */
    addUniforms?(uniforms: string[]): void;

    /**
     * Add the required samplers to the current list.
     * @param samplers defines the current sampler list.
     */
    addSamplers?(samplers: string[]): void;

    /**
     * Add the required uniforms to the current buffer.
     * @param uniformBuffer defines the current uniform buffer.
     */
    prepareUniformBuffer?(uniformBuffer: UniformBuffer): void;

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param plugin define the config where to copy the info
     */
    copyTo(plugin: IMaterialPlugin): void;

    /**
     * Serializes this clear coat configuration.
     * @returns - An object with the serialized config.
     */
    serialize(): any;

    /**
     * Parses a anisotropy Configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    parse(source: any, scene: Scene, rootUrl: string): void;
}
