import { SerializationHelper } from "../Misc/decorators";
import { EventState } from "../Misc/observable";
import { SmartArray } from "../Misc/smartArray";
import { Nullable } from "../types";
import { IMaterialPlugin } from "./IMaterialPlugin";
import { Material, MaterialEvent } from "./material";

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

type PluginMaterialFactory = (material: Material) => Nullable<IMaterialPlugin>;

/**
 * Manages plugins for materials. Allows to customize material at runtime,
 * listening to events.
 */
export class MaterialPluginManager {
    /**
     * List of registered plugin material factories.
     */
    private static _Plugins: Array<[string, PluginMaterialFactory]> = [];

    private static _Inited = false;

    /**
     * Initialize this class, registering an observable on Material.
     */
    private static _Initialize(): void {
        Material.OnEventObservable.add((material: Material, eventState: EventState) => {
            switch (eventState.mask) {
                case MaterialEvent.Created:
                    MaterialPluginManager.InjectPlugins(material);
                    break;

                case MaterialEvent.GetDisableAlphaBlending:
                    eventState.userInfo.disableAlphaBlending ||= MaterialPluginManager.DisableAlphaBlending(material);
                    break;

                case MaterialEvent.Disposed:
                    MaterialPluginManager.Dispose(material, eventState.userInfo.forceDisposeTextures);
                    break;
            }
        }, MaterialEvent.All);

        MaterialPluginManager._Inited = true;
    }

    /**
     * Registers a new material plugin through a factory, or updates it.
     * @param propertyName The plugin name
     * @param factory The factor function, which returns a IMaterialPlugin or null if it's not applicable.
     */
    public static RegisterPlugin(propertyName: string, factory: PluginMaterialFactory): void {
        if (!MaterialPluginManager._Inited) {
            MaterialPluginManager._Initialize();
        }
        const existing = MaterialPluginManager._Plugins.filter(([name, plugin]) => name === propertyName);
        if (existing.length > 0) {
            existing[0][1] = factory;
        } else {
            MaterialPluginManager._Plugins.push([propertyName, factory]);
        }
    }

    /**
     * Injects plugins on a material.
     * @param material The material to inject plugins into.
     */
    public static InjectPlugins(material: Material): void {
        const collectPointNames = (shaderType: string, customCode: Nullable<{ [pointName: string]: string }> | undefined) => {
            if (!customCode) {
                return;
            }
            for (const pointName in customCode) {
                material._codeInjectionPoints = material._codeInjectionPoints || {};
                if (!material._codeInjectionPoints[shaderType]) {
                    material._codeInjectionPoints[shaderType] = {};
                }
                material._codeInjectionPoints[shaderType][pointName] = true;
            }
        };

        for (const [propertyName, factory] of MaterialPluginManager._Plugins) {
            const plugin = factory(material);
            if (plugin) {
                material._plugins.push(plugin);
                (material as any)[propertyName] = plugin;
                plugin.initialize?.(material.getScene(), material._dirtyCallbacks);
                collectPointNames("vertex", plugin.getCustomCode?.("vertex"));
                collectPointNames("fragment", plugin.getCustomCode?.("fragment"));
            }
        }

        console.log("xxx", material._plugins);
        material._plugins = material._plugins.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Injects custom code into the material shader.
     * @param material The material to inject code into.
     * @returns The code injector function.
     */
    public static InjectCustomCode(material: Material): (shaderType: string, code: string) => string {
        return (shaderType: string, code: string) => {
            const points = material._codeInjectionPoints?.[shaderType];
            if (!points) {
                return code;
            }
            for (const pointName in points) {
                let injectedCode = "";
                for (const plugin of material._plugins) {
                    const customCode = plugin.getCustomCode?.(shaderType);
                    if (customCode?.[pointName]) {
                        injectedCode += customCode[pointName] + "\r\n";
                    }
                }
                if (injectedCode.length > 0) {
                    code = code.replace("#define " + pointName, "\r\n" + injectedCode);
                }
            }
            return code;
        };
    }

    /**
     * Calls fillRenderTargetTextures on all plugins for a given material.
     * @param material The material
     * @param renderTargets The render target textures.
     */
    public static FillRenderTargetTextures(material: Material, renderTargets: SmartArray<RenderTargetTexture>): void {
        for (const plugin of material._plugins) {
            plugin.fillRenderTargetTextures?.(renderTargets);
        }
    }

    /**
     * Calls hasRenderTargetTextures on all plugins for a given material.
     * @param material The material
     */
    public static HasRenderTargetTextures(material: Material): boolean {
        for (const plugin of material._plugins) {
            if (plugin.hasRenderTargetTextures?.()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calls getAnimatables on all plugins for a given material.
     * @param material The material
     * @param animatables The animatable list.
     */
    public static GetAnimatables(material: Material, animatables: IAnimatable[]): void {
        for (const plugin of material._plugins) {
            plugin.getAnimatables?.(animatables);
        }
    }

    /**
     * Calls getActiveTextures on all plugins for a given material.
     * @param material The material
     * @param activeTextures The active textures list.
     */
     public static GetActiveTextures(material: Material, activeTextures: BaseTexture[]): void {
        for (const plugin of material._plugins) {
            plugin.getActiveTextures?.(activeTextures);
        }
    }

    /**
     * Calls hasTexture on all plugins for a given material.
     * @param material The material
     * @param texture The texture to check.
     */
    public static HasTexture(material: Material, texture: BaseTexture): boolean {
        for (const plugin of material._plugins) {
            if (plugin.hasTexture?.(texture)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calls disableAlphaBlending on all plugins for a given material.
     * @param material The material
     */
    public static DisableAlphaBlending(material: Material): boolean {
        for (const plugin of material._plugins) {
            if (plugin.disableAlphaBlending) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calls dispose on all plugins for a given material.
     * @param material The material
     * @param forceDisposeTextures Force dispose textures?
     */
    public static Dispose(material: Material, forceDisposeTextures?: boolean): void {
        for (const plugin of material._plugins) {
            plugin.dispose?.(forceDisposeTextures);
        }
    }

    /**
     * Calls isReadyForSubMesh on all plugins for a given material.
     * @param material The material
     * @param defines The material defines.
     * @param scene The scene the material belongs to.
     * @param engine The engine the material belongs to
     * @returns True if ready.
     */
    public static IsReadyForSubMesh(material: Material, defines: MaterialDefines, scene: Scene, engine: Engine): boolean {
        let isReady = true;
        for (const plugin of material._plugins) {
            isReady = isReady && (plugin.isReadyForSubMesh?.(defines, scene, engine) ?? true);
        }
        return isReady;
    }

    /**
     * Calls collectDefineNames on all plugins for a given material.
     * @param material The material
     * @return A list of defined names.
     */
     public static CollectDefineNames(material: Material): string[] | undefined {
        const names: string[] = [];
        for (const plugin of material._plugins) {
            plugin.collectDefineNames?.(names);
        }
        return names.length > 0 ? names : undefined;
    }

    /**
     * Calls prepareDefines on all plugins for a given material.
     * @param material The material
     * @param defines The material defines.
     * @param scene The scene the material belongs to.
     * @param mesh The mesh being rendered.
     */
    public static PrepareDefines(material: Material, defines: MaterialDefines, scene: Scene, mesh: AbstractMesh): void {
        for (const plugin of material._plugins) {
            plugin.prepareDefines?.(defines, scene, mesh);
        }
    }

    /**
     * Calls unbind on all plugins for a given material.
     * @param material The material
     * @param effect The effect on that material.
     * @returns True if at least one plugin returned true.
     */
    public static Unbind(material: Material, effect: Effect): boolean {
        let result = false;
        for (const plugin of material._plugins) {
            result = result || (plugin.unbind?.(effect) ?? false);
        }
        return result;
    }

    /**
     * Calls bindForSubMesh on all plugins for a given material.
     * @param material The material
     * @param ubo The Uniform Buffer
     * @param scene The scene this material belongs to.
     * @param engine The engine this material belongs to.
     * @param subMesh The subMesh this material belongs to.
     */
    public static BindForSubMesh(material: Material, ubo: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        for (const plugin of material._plugins) {
            plugin.bindForSubMesh?.(ubo, scene, engine, subMesh);
        }
    }

    /**
     * Calls hardBindForSubMesh on all plugins for a given material.
     * @param material The material
     * @param ubo The Uniform Buffer
     * @param scene The scene this material belongs to.
     * @param engine The engine this material belongs to.
     * @param subMesh The subMesh this material belongs to.
     */
    public static HardBindForSubMesh(material: Material, ubo: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        for (const plugin of material._plugins) {
            plugin.hardBindForSubMesh?.(ubo, scene, engine, subMesh);
        }
    }

    /**
     * Calls addFallbacks on all plugins for a given material.
     * @param material The material
     * @param defines The material defines
     * @param fallbacks The effect fallbacks
     * @param fallbackRank The fallback rank
     * @returns The updated fallbackRank
     */
    public static AddFallbacks(material: Material, defines: MaterialDefines, fallbacks: EffectFallbacks, fallbackRank: number): number {
        for (const plugin of material._plugins) {
            if (plugin.addFallbacks) {
                fallbackRank = plugin.addFallbacks(defines, fallbacks, fallbackRank);
            }
        }
        return fallbackRank;
    }

    /**
     * Calls addUniforms on all plugins for a given material.
     * @param material The material
     * @param uniforms The material uniforms
     */
    public static AddUniforms(material: Material, uniforms: string[]): void {
        for (const plugin of material._plugins) {
            plugin.addUniforms?.(uniforms);
        }
    }

    /**
     * Calls addSamplers on all plugins for a given material.
     * @param material The material
     * @param uniforms The samplers
     */
    public static AddSamplers(material: Material, samplers: string[]): void {
        for (const plugin of material._plugins) {
            plugin.addSamplers?.(samplers);
        }
    }

    /**
     * Calls prepareUniformBuffer on all plugins for a given material.
     * @param material The material
     * @param ubo The uniform buffer
     */
    public static PrepareUniformBuffer(material: Material, ubo: UniformBuffer): void {
        for (const plugin of material._plugins) {
            plugin.prepareUniformBuffer?.(ubo);
        }
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param materialPluginManager define the manager where to copy the info
     */
    public copyTo(materialPluginManager: MaterialPluginManager): void {
        // TODO: this class includes the factories, check if this will serialize properly
        SerializationHelper.Clone(() => materialPluginManager, this);
    }

    /**
     * Serializes this Sub Surface configuration.
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
