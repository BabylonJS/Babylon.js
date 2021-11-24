import { ShaderCustomProcessingFunction } from "../Engines/Processors/shaderProcessingOptions";
import { EventState } from "../Misc/observable";
import { Nullable } from "../types";
import { Material } from "./material";
import {
    EventInfoAddFallbacks,
    EventInfoAddUniformsSamplers,
    EventInfoBindForSubMesh,
    EventInfoDisposed,
    EventInfoGetActiveTextures,
    EventInfoGetAnimatables,
    EventInfoGetDefineNames,
    EventInfoHasRenderTargetTextures,
    EventInfoHasTexture,
    EventInfoInjectCustomCode,
    EventInfoIsReadyForSubMesh,
    EventInfoPrepareDefines,
    EventInfoPrepareUniformBuffer,
    MaterialEvent,
} from "./materialEvent";

declare type MaterialPluginBase = import("./materialPluginBase").MaterialPluginBase;

declare module "./material" {
    export interface Material {
        /**
         * Plugin manager for this material
         */
        pluginManager?: MaterialPluginManager;
    }
}

/**
 * Class that manages the plugins of a material
 */
export class MaterialPluginManager {
    protected _material: Material;
    protected _plugins: MaterialPluginBase[] = [];
    protected _codeInjectionPoints: { [shaderType: string]: { [codeName: string]: boolean } };
    protected _defineNamesFromPlugins?: { [name: string]: { type: string; default: any } };

    /**
     * Creates a new instance of the plugin manager
     * @param material material that this manager will manage the plugins for
     */
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

        material.registerForEvent(MaterialEvent.AddFallbacks, (eventData: EventInfoAddFallbacks) => {
            for (const plugin of this._plugins) {
                eventData.fallbackRank = plugin.addFallbacks(eventData.defines, eventData.fallbacks, eventData.fallbackRank);
            }
        });

        material.registerForEvent(MaterialEvent.AddUniformsSamplers, (eventData: EventInfoAddUniformsSamplers) => {
            for (const plugin of this._plugins) {
                plugin.addUniformsAndSamplers(eventData.uniforms, eventData.samplers);
            }
        });

        material.registerForEvent(MaterialEvent.PrepareUniformBuffer, (eventData: EventInfoPrepareUniformBuffer) => {
            for (const plugin of this._plugins) {
                plugin.prepareUniformBuffer(eventData.ubo);
            }
        });

        material.registerForEvent(MaterialEvent.InjectCustomCode, (eventData: EventInfoInjectCustomCode) => {
            eventData.customCode = this._injectCustomCode(eventData.customCode);
        });
    }

    /** @hidden */
    public _addPlugin(plugin: MaterialPluginBase): void {
        for (let i = 0; i < this._plugins.length; ++i) {
            if (this._plugins[i].name === plugin.name) {
                throw `Plugin "${plugin.name}" already added in the material "${this._material.name}"!`;
            }
        }

        this._plugins.push(plugin);
        this._plugins.sort((a, b) => a.priority - b.priority);

        this._codeInjectionPoints = {};

        const defineNamesFromPlugins = {};
        for (const plugin of this._plugins) {
            plugin.collectDefines(defineNamesFromPlugins);
            this._collectPointNames("vertex", plugin.getCustomCode("vertex"));
            this._collectPointNames("fragment", plugin.getCustomCode("fragment"));
        }

        if (Object.keys(defineNamesFromPlugins).length > 0) {
            this._defineNamesFromPlugins = defineNamesFromPlugins;
        } else {
            delete this._defineNamesFromPlugins;
        }
    }

    /**
     * Gets a plugin from the list of plugins managed by this manager
     * @param name name of the plugin
     * @returns the plugin if found, else null
     */
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
            if (!this._codeInjectionPoints[shaderType]) {
                this._codeInjectionPoints[shaderType] = {};
            }
            this._codeInjectionPoints[shaderType][pointName] = true;
        }
    }

    protected _injectCustomCode(existingCallback?: (shaderType: string, code: string) => string): ShaderCustomProcessingFunction {
        return (shaderType: string, code: string) => {
            if (existingCallback) {
                code = existingCallback(shaderType, code);
            }
            const points = this._codeInjectionPoints?.[shaderType];
            if (!points) {
                return code;
            }
            for (const pointName in points) {
                let injectedCode = "";
                for (const plugin of this._plugins) {
                    const customCode = plugin.getCustomCode(shaderType);
                    if (customCode?.[pointName]) {
                        injectedCode += customCode[pointName] + "\r\n";
                    }
                }
                if (injectedCode.length > 0) {
                    if (pointName.charAt(0) === "!") {
                        // pointName is a regular expression
                        const rx = new RegExp(pointName.substring(1), "g");
                        let match = rx.exec(code);
                        while (match !== null) {
                            code = code.replace(match[0], injectedCode);
                            match = rx.exec(code);
                        }
                    } else {
                        code = code.replace("#define " + pointName, "\r\n" + injectedCode);
                    }
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
 * Registers a new material plugin through a factory, or updates it. This makes the plugin available to all materials instantiated after its registration.
 * @param pluginName The plugin name
 * @param factory The factory function which allows to create the plugin
 */
export function RegisterMaterialPlugin(pluginName: string, factory: PluginMaterialFactory): void {
    if (!_Inited) {
        Material.OnEventObservable.add((material: Material, eventState: EventState) => {
            for (const [_name, factory] of _Plugins) {
                factory(material);
            }
        }, MaterialEvent.Created);
        _Inited = true;
    }
    const existing = _Plugins.filter(([name, _factory]) => name === pluginName);
    if (existing.length > 0) {
        existing[0][1] = factory;
    } else {
        _Plugins.push([pluginName, factory]);
    }
}
