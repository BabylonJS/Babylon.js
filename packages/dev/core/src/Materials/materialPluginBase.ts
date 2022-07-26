import { SerializationHelper, serialize } from "../Misc/decorators";
import type { Nullable } from "../types";
import { MaterialPluginManager } from "./materialPluginManager";
import type { SmartArray } from "../Misc/smartArray";
import { Constants } from "../Engines/constants";

declare type Engine = import("../Engines/engine").Engine;
declare type Scene = import("../scene").Scene;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;
declare type IAnimatable = import("../Animations/animatable.interface").IAnimatable;
declare type UniformBuffer = import("./uniformBuffer").UniformBuffer;
declare type EffectFallbacks = import("./effectFallbacks").EffectFallbacks;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;
declare type Material = import("./material").Material;
declare type BaseTexture = import("./Textures/baseTexture").BaseTexture;
declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;

/**
 * Base class for material plugins.
 * @since 5.0
 */
export class MaterialPluginBase {
    /**
     * Defines the name of the plugin
     */
    @serialize()
    public name: string;

    /**
     * Defines the priority of the plugin. Lower numbers run first.
     */
    @serialize()
    public priority: number = 500;

    /**
     * Indicates that this plugin should be notified for the extra events (HasRenderTargetTextures / FillRenderTargetTextures / HardBindForSubMesh)
     */
    @serialize()
    public registerForExtraEvents: boolean = false;

    protected _material: Material;
    protected _pluginManager: MaterialPluginManager;
    protected _pluginDefineNames?: { [name: string]: any };

    protected _enable(enable: boolean) {
        if (enable) {
            this._pluginManager._activatePlugin(this);
        }
    }

    /**
     * Helper function to mark defines as being dirty.
     */
    public readonly markAllDefinesAsDirty: () => void;

    /**
     * Creates a new material plugin
     * @param material parent material of the plugin
     * @param name name of the plugin
     * @param priority priority of the plugin
     * @param defines list of defines used by the plugin. The value of the property is the default value for this property
     * @param addToPluginList true to add the plugin to the list of plugins managed by the material plugin manager of the material (default: true)
     * @param enable true to enable the plugin (it is handy if the plugin does not handle properties to switch its current activation)
     */
    constructor(material: Material, name: string, priority: number, defines?: { [key: string]: any }, addToPluginList = true, enable = false) {
        this._material = material;
        this.name = name;
        this.priority = priority;

        if (!material.pluginManager) {
            material.pluginManager = new MaterialPluginManager(material);
        }

        this._pluginDefineNames = defines;
        this._pluginManager = material.pluginManager;

        if (addToPluginList) {
            this._pluginManager._addPlugin(this);
        }

        if (enable) {
            this._enable(true);
        }

        this.markAllDefinesAsDirty = material._dirtyCallbacks[Constants.MATERIAL_AllDirtyFlag];
    }

    /**
     * Gets the current class name useful for serialization or dynamic coding.
     * @returns The class name.
     */
    public getClassName(): string {
        return "MaterialPluginBase";
    }

    /**
     * Specifies that the submesh is ready to be used.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene the material belongs to.
     * @param engine the engine this scene belongs to.
     * @param subMesh the submesh to check for readiness
     * @returns - boolean indicating that the submesh is ready or not.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public isReadyForSubMesh(defines: MaterialDefines, scene: Scene, engine: Engine, subMesh: SubMesh): boolean {
        return true;
    }

    /**
     * Binds the material data (this function is called even if mustRebind() returns false)
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param subMesh the submesh to bind data for
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public hardBindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {}

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine the engine this scene belongs to.
     * @param subMesh the submesh to bind data for
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {}

    /**
     * Disposes the resources of the material.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public dispose(forceDisposeTextures?: boolean): void {}

    /**
     * Returns a list of custom shader code fragments to customize the shader.
     * @param shaderType "vertex" or "fragment"
     * @returns null if no code to be added, or a list of pointName => code.
     * Note that `pointName` can also be a regular expression if it starts with a `!`.
     * In that case, the string found by the regular expression (if any) will be
     * replaced by the code provided.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        return null;
    }

    /**
     * Collects all defines.
     * @param defines The object to append to.
     */
    public collectDefines(defines: { [name: string]: { type: string; default: any } }): void {
        if (!this._pluginDefineNames) {
            return;
        }
        for (const key of Object.keys(this._pluginDefineNames)) {
            if (key[0] === "_") {
                continue;
            }

            const type = typeof this._pluginDefineNames[key];
            defines[key] = {
                type: type === "number" ? "number" : type === "string" ? "string" : type === "boolean" ? "boolean" : "object",
                default: this._pluginDefineNames[key],
            };
        }
    }

    /**
     * Sets the defines for the next rendering. Called before MaterialHelper.PrepareDefinesForAttributes is called.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene to the material belongs to.
     * @param mesh the mesh being rendered
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public prepareDefinesBeforeAttributes(defines: MaterialDefines, scene: Scene, mesh: AbstractMesh): void {}

    /**
     * Sets the defines for the next rendering
     * @param defines the list of "defines" to update.
     * @param scene defines the scene to the material belongs to.
     * @param mesh the mesh being rendered
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public prepareDefines(defines: MaterialDefines, scene: Scene, mesh: AbstractMesh): void {}

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public hasTexture(texture: BaseTexture): boolean {
        return false;
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     * @returns true if this uses a render target otherwise false.
     */
    public hasRenderTargetTextures(): boolean {
        return false;
    }

    /**
     * Fills the list of render target textures.
     * @param renderTargets the list of render targets to update
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public fillRenderTargetTextures(renderTargets: SmartArray<RenderTargetTexture>): void {}

    /**
     * Returns an array of the actively used textures.
     * @param activeTextures Array of BaseTextures
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getActiveTextures(activeTextures: BaseTexture[]): void {}

    /**
     * Returns the animatable textures.
     * @param animatables Array of animatable textures.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getAnimatables(animatables: IAnimatable[]): void {}

    /**
     * Add fallbacks to the effect fallbacks list.
     * @param defines defines the Base texture to use.
     * @param fallbacks defines the current fallback list.
     * @param currentRank defines the current fallback rank.
     * @returns the new fallback rank.
     */
    public addFallbacks(defines: MaterialDefines, fallbacks: EffectFallbacks, currentRank: number): number {
        return currentRank;
    }

    /**
     * Gets the samplers used by the plugin.
     * @param samplers list that the sampler names should be added to.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getSamplers(samplers: string[]): void {}

    /**
     * Gets the attributes used by the plugin.
     * @param attributes list that the attribute names should be added to.
     * @param scene the scene that the material belongs to.
     * @param mesh the mesh being rendered.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getAttributes(attributes: string[], scene: Scene, mesh: AbstractMesh): void {}

    /**
     * Gets the uniform buffers names added by the plugin.
     * @param ubos list that the ubo names should be added to.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getUniformBuffersNames(ubos: string[]): void {}

    /**
     * Gets the description of the uniforms to add to the ubo (if engine supports ubos) or to inject directly in the vertex/fragment shaders (if engine does not support ubos)
     * @returns the description of the uniforms
     */
    public getUniforms(): { ubo?: Array<{ name: string; size: number; type: string }>; vertex?: string; fragment?: string } {
        return {};
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param plugin define the config where to copy the info
     */
    public copyTo(plugin: MaterialPluginBase): void {
        SerializationHelper.Clone(() => plugin, this);
    }

    /**
     * Serializes this clear coat configuration.
     * @returns - An object with the serialized config.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a anisotropy Configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    public parse(source: any, scene: Scene, rootUrl: string): void {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}
