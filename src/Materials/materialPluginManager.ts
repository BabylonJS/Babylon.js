import { ShaderCustomProcessingFunction } from "../Engines/Processors/shaderProcessingOptions";
import { EventState } from "../Misc/observable";
import { Nullable } from "../types";
import { Material } from "./material";
import { EventInfoBindForSubMesh, EventInfoDisposed, EventInfoGetActiveTextures, EventInfoGetAnimatables, EventInfoGetDefineNames, EventInfoHasRenderTargetTextures, EventInfoHasTexture, EventInfoIsReadyForSubMesh, EventInfoPrepareDefines, MaterialEvent } from "./materialEvent";

declare type Scene = import("../scene").Scene;
declare type EffectFallbacks = import("./effectFallbacks").EffectFallbacks;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;
declare type UniformBuffer = import("./uniformBuffer").UniformBuffer;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
declare type MaterialPluginBase = import("./materialPluginBase").MaterialPluginBase;

declare module "./material" {
    export interface Material {
        pluginManager?: MaterialPluginManager;
    }
}

export class MaterialPluginManager {

    protected _material: Material;
    protected _plugins: MaterialPluginBase[] = [];
    protected _codeInjectionPoints: { [shaderType: string]: { [codeName: string]: boolean } };
    protected _defineNamesFromPlugins?: { [name: string]: { type: string, default: any } };

    constructor(material: Material) {
        this._material = material;

        material.registerForEvent(MaterialEvent.IsReadyForSubMesh, (eventData: EventInfoIsReadyForSubMesh) => {
            const scene = material.getScene();
            const engine = scene.getEngine();

            let isReady = true;
            for (const plugin of this._plugins) {
                isReady = isReady && plugin.isReadyForSubMesh(eventData.defines, scene, engine, eventData.subMesh);
            }
            eventData.isReadyForSubMesh = isReady;
        });

        material.registerForEvent(MaterialEvent.PrepareDefines, (eventData: EventInfoPrepareDefines) => {
            const scene = material.getScene();
            for (const plugin of this._plugins) {
                plugin.prepareDefines(eventData.defines, scene, eventData.mesh);
            }
        });

        material.registerForEvent(MaterialEvent.BindForSubMesh, (eventData: EventInfoBindForSubMesh) => {
            const scene = material.getScene();
            const engine = scene.getEngine();
            for (const plugin of this._plugins) {
                plugin.bindForSubMesh(this._material._uniformBuffer, scene, engine, eventData.subMesh);
            }
        });

        material.registerForEvent(MaterialEvent.HasRenderTargetTextures, (eventData: EventInfoHasRenderTargetTextures) => {
            let hasRenderTargetTextures = false;
            for (const plugin of this._plugins) {
                hasRenderTargetTextures = plugin.hasRenderTargetTextures();
                if (hasRenderTargetTextures) {
                    break;
                }
            }
            eventData.hasRenderTargetTextures = hasRenderTargetTextures;
        });

        material.registerForEvent(MaterialEvent.GetActiveTextures, (eventData: EventInfoGetActiveTextures) => {
            for (const plugin of this._plugins) {
                plugin.getActiveTextures(eventData.activeTextures);
            }
        });

        material.registerForEvent(MaterialEvent.GetAnimatables, (eventData: EventInfoGetAnimatables) => {
            for (const plugin of this._plugins) {
                plugin.getAnimatables(eventData.animatables);
            }
        });

        material.registerForEvent(MaterialEvent.HasTexture, (eventData: EventInfoHasTexture) => {
            let hasTexture = false;
            for (const plugin of this._plugins) {
                hasTexture = plugin.hasTexture(eventData.texture);
                if (hasTexture) {
                    break;
                }
            }
            eventData.hasTexture = hasTexture;
        });

        material.registerForEvent(MaterialEvent.Disposed, (eventData: EventInfoDisposed) => {
            for (const plugin of this._plugins) {
                plugin.dispose(eventData.forceDisposeTextures);
            }
        });

        material.registerForEvent(MaterialEvent.GetDefineNames, (eventData: EventInfoGetDefineNames) => {
            eventData.defineNames = this._defineNamesFromPlugins;
        });
    }

    public addPlugin(plugin: MaterialPluginBase): void {
        for (let i = 0; i < this._plugins.length; ++i) {
            if (this._plugins[i].name === plugin.name) {
                throw `Plugin "${plugin.name}" already added in the material "${this._material.name}"!`;
            }
        }

        this._plugins.push(plugin);
        this._plugins.sort((a, b) => a.priority - b.priority);

        const defineNamesFromPlugins = {};
        for (const plugin of this._plugins) {
            plugin.collectDefines(defineNamesFromPlugins);
        }

        if (Object.keys(defineNamesFromPlugins).length > 0) {
            this._defineNamesFromPlugins = defineNamesFromPlugins;
        } else {
            delete this._defineNamesFromPlugins;
        }

        this._material.resetDrawCache();
        //collectPointNames("vertex", plugin.getCustomCode?.("vertex"));
        //collectPointNames("fragment", plugin.getCustomCode?.("fragment"));
    }

    public removePlugin(pluginName: string, dispose = true): boolean {
        for (let i = 0; i < this._plugins.length; ++i) {
            if (this._plugins[i].name === pluginName) {
                if (dispose) {
                    this._plugins[i].dispose();
                }
                this._plugins.splice(i, 1);
                this._material.resetDrawCache();
                return true;
            }
        }
        return false;
    }

    public getPlugin(name: string): Nullable<MaterialPluginBase> {
        for (let i = 0; i < this._plugins.length; ++i) {
            if (this._plugins[i].name === name) {
                return this._plugins[i];
            }
        }
        return null;
    }

    protected _collectPointNames(shaderType: string, customCode: Nullable<{ [pointName: string]: string }> | undefined): void {
        if (!customCode) {
            return;
        }
        for (const pointName in customCode) {
            this._codeInjectionPoints = this._codeInjectionPoints || {};
            if (!this._codeInjectionPoints[shaderType]) {
                this._codeInjectionPoints[shaderType] = {};
            }
            this._codeInjectionPoints[shaderType][pointName] = true;
        }
    };

    protected _injectCustomCode(): ShaderCustomProcessingFunction {
        return (shaderType: string, code: string) => {
            const points = this._codeInjectionPoints?.[shaderType];
            if (!points) {
                return code;
            }
            for (const pointName in points) {
                let injectedCode = "";
                for (const plugin of this._plugins) {
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
}

/**
 * Type for plugin material factories.
 */
type PluginMaterialFactory = (material: Material) => Nullable<MaterialPluginBase>;

/**
 * List of registered plugin material factories.
 */
let _Plugins: Array<[string, PluginMaterialFactory]> = [];

/**
 * Flag for the plugin manager initialization code.
 */
let _Inited = false;

/**
 * Initialize this class, registering an observable on Material.
 */
function _Initialize(): void {
    Material.OnEventObservable.add((material: Material, eventState: EventState) => {
        if (eventState.mask & MaterialEvent.Created) {
            InjectPlugins(material);
        }
    }, MaterialEvent.Created);

    _Inited = true;
}

/**
 * Registers a new material plugin through a factory, or updates it. This makes the
 * plugin available to all Materials instantiated after its registration.
 * @param pluginName The plugin name
 * @param factory The factor function, which returns a MaterialPluginBase or null if it's not applicable.
 */
export function RegisterMaterialPlugin(pluginName: string, factory: PluginMaterialFactory): void {
    if (!_Inited) {
        _Initialize();
    }
    const existing = _Plugins.filter(([name, _factory]) => name === pluginName);
    if (existing.length > 0) {
        existing[0][1] = factory;
    } else {
        _Plugins.push([pluginName, factory]);
    }
}

/**
 * Injects plugins on a material.
 * @param material The material to inject plugins into.
 */
function InjectPlugins(material: Material): void {
    for (const [_name, factory] of _Plugins) {
        factory(material);
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
function AddFallbacks(material: Material, defines: MaterialDefines, fallbacks: EffectFallbacks, fallbackRank: number): number {
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
function AddUniforms(material: Material, uniforms: string[]): void {
    for (const plugin of material._plugins) {
        plugin.addUniforms?.(uniforms);
    }
}

/**
 * Calls addSamplers on all plugins for a given material.
 * @param material The material
 * @param uniforms The samplers
 */
function AddSamplers(material: Material, samplers: string[]): void {
    for (const plugin of material._plugins) {
        plugin.addSamplers?.(samplers);
    }
}

/**
 * Calls prepareUniformBuffer on all plugins for a given material.
 * @param material The material
 * @param ubo The uniform buffer
 */
function PrepareUniformBuffer(material: Material, ubo: UniformBuffer): void {
    for (const plugin of material._plugins) {
        plugin.prepareUniformBuffer?.(ubo);
    }
}
