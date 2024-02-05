import type { ProcessingOptions, ShaderCustomProcessingFunction } from "../Engines/Processors/shaderProcessingOptions";
import type { Nullable } from "../types";
import { Material } from "./material";
import type {
    MaterialPluginPrepareEffect,
    MaterialPluginBindForSubMesh,
    MaterialPluginDisposed,
    MaterialPluginGetActiveTextures,
    MaterialPluginGetAnimatables,
    MaterialPluginGetDefineNames,
    MaterialPluginHasTexture,
    MaterialPluginIsReadyForSubMesh,
    MaterialPluginPrepareDefines,
    MaterialPluginPrepareUniformBuffer,
    MaterialPluginHardBindForSubMesh,
    MaterialPluginHasRenderTargetTextures,
    MaterialPluginFillRenderTargetTextures,
} from "./materialPluginEvent";
import { MaterialPluginEvent } from "./materialPluginEvent";
import type { Observer } from "core/Misc/observable";
import { EngineStore } from "../Engines/engineStore";

import type { Scene } from "../scene";
import type { Engine } from "../Engines/engine";
import type { MaterialPluginBase } from "./materialPluginBase";
import { ShaderProcessor } from "../Engines/Processors/shaderProcessor";
import { ShaderLanguage } from "./shaderLanguage";
import { ShaderStore } from "../Engines/shaderStore";

declare module "./material" {
    export interface Material {
        /**
         * Plugin manager for this material
         */
        pluginManager?: MaterialPluginManager;
    }
}

const rxOption = new RegExp("^([gimus]+)!");

/**
 * Class that manages the plugins of a material
 * @since 5.0
 */
export class MaterialPluginManager {
    /** Map a plugin class name to a #define name (used in the vertex/fragment shaders as a marker of the plugin usage) */
    private static _MaterialPluginClassToMainDefine: { [name: string]: string } = {};
    private static _MaterialPluginCounter: number = 0;

    protected _material: Material;
    protected _scene: Scene;
    protected _engine: Engine;
    /** @internal */
    public _plugins: MaterialPluginBase[] = [];
    protected _activePlugins: MaterialPluginBase[] = [];
    protected _activePluginsForExtraEvents: MaterialPluginBase[] = [];
    protected _codeInjectionPoints: { [shaderType: string]: { [codeName: string]: boolean } };
    protected _defineNamesFromPlugins?: { [name: string]: { type: string; default: any } };
    protected _uboDeclaration: string;
    protected _vertexDeclaration: string;
    protected _fragmentDeclaration: string;
    protected _uniformList: string[];
    protected _samplerList: string[];
    protected _uboList: string[];

    static {
        EngineStore.OnEnginesDisposedObservable.add(() => {
            UnregisterAllMaterialPlugins();
        });
    }

    /**
     * Creates a new instance of the plugin manager
     * @param material material that this manager will manage the plugins for
     */
    constructor(material: Material) {
        this._material = material;
        this._scene = material.getScene();
        this._engine = this._scene.getEngine();
    }

    /**
     * @internal
     */
    public _addPlugin(plugin: MaterialPluginBase): boolean {
        for (let i = 0; i < this._plugins.length; ++i) {
            if (this._plugins[i].name === plugin.name) {
                return false;
            }
        }

        if (this._material._uniformBufferLayoutBuilt) {
            // eslint-disable-next-line no-throw-literal
            throw `The plugin "${plugin.name}" can't be added to the material "${this._material.name}" because this material has already been used for rendering! Please add plugins to materials before any rendering with this material occurs.`;
        }

        const pluginClassName = plugin.getClassName();
        if (!MaterialPluginManager._MaterialPluginClassToMainDefine[pluginClassName]) {
            MaterialPluginManager._MaterialPluginClassToMainDefine[pluginClassName] = "MATERIALPLUGIN_" + ++MaterialPluginManager._MaterialPluginCounter;
        }

        this._material._callbackPluginEventGeneric = (id, info) => this._handlePluginEvent(id, info);

        this._plugins.push(plugin);
        this._plugins.sort((a, b) => a.priority - b.priority);

        this._codeInjectionPoints = {};

        const defineNamesFromPlugins: { [name: string]: { type: string; default: any } } = {};
        defineNamesFromPlugins[MaterialPluginManager._MaterialPluginClassToMainDefine[pluginClassName]] = {
            type: "boolean",
            default: true,
        };

        for (const plugin of this._plugins) {
            plugin.collectDefines(defineNamesFromPlugins);
            this._collectPointNames("vertex", plugin.getCustomCode("vertex"));
            this._collectPointNames("fragment", plugin.getCustomCode("fragment"));
        }

        this._defineNamesFromPlugins = defineNamesFromPlugins;

        return true;
    }

    /**
     * @internal
     */
    public _activatePlugin(plugin: MaterialPluginBase): void {
        if (this._activePlugins.indexOf(plugin) === -1) {
            this._activePlugins.push(plugin);
            this._activePlugins.sort((a, b) => a.priority - b.priority);

            this._material._callbackPluginEventIsReadyForSubMesh = this._handlePluginEventIsReadyForSubMesh.bind(this);
            this._material._callbackPluginEventPrepareDefinesBeforeAttributes = this._handlePluginEventPrepareDefinesBeforeAttributes.bind(this);
            this._material._callbackPluginEventPrepareDefines = this._handlePluginEventPrepareDefines.bind(this);
            this._material._callbackPluginEventBindForSubMesh = this._handlePluginEventBindForSubMesh.bind(this);

            if (plugin.registerForExtraEvents) {
                this._activePluginsForExtraEvents.push(plugin);
                this._activePluginsForExtraEvents.sort((a, b) => a.priority - b.priority);
                this._material._callbackPluginEventHasRenderTargetTextures = this._handlePluginEventHasRenderTargetTextures.bind(this);
                this._material._callbackPluginEventFillRenderTargetTextures = this._handlePluginEventFillRenderTargetTextures.bind(this);
                this._material._callbackPluginEventHardBindForSubMesh = this._handlePluginEventHardBindForSubMesh.bind(this);
            }
        }
    }

    /**
     * Gets a plugin from the list of plugins managed by this manager
     * @param name name of the plugin
     * @returns the plugin if found, else null
     */
    public getPlugin<T = MaterialPluginBase>(name: string): Nullable<T> {
        for (let i = 0; i < this._plugins.length; ++i) {
            if (this._plugins[i].name === name) {
                return this._plugins[i] as T;
            }
        }
        return null;
    }

    protected _handlePluginEventIsReadyForSubMesh(eventData: MaterialPluginIsReadyForSubMesh): void {
        let isReady = true;
        for (const plugin of this._activePlugins) {
            isReady = isReady && plugin.isReadyForSubMesh(eventData.defines, this._scene, this._engine, eventData.subMesh);
        }
        eventData.isReadyForSubMesh = isReady;
    }

    protected _handlePluginEventPrepareDefinesBeforeAttributes(eventData: MaterialPluginPrepareDefines): void {
        for (const plugin of this._activePlugins) {
            plugin.prepareDefinesBeforeAttributes(eventData.defines, this._scene, eventData.mesh);
        }
    }

    protected _handlePluginEventPrepareDefines(eventData: MaterialPluginPrepareDefines): void {
        for (const plugin of this._activePlugins) {
            plugin.prepareDefines(eventData.defines, this._scene, eventData.mesh);
        }
    }

    protected _handlePluginEventHardBindForSubMesh(eventData: MaterialPluginHardBindForSubMesh): void {
        for (const plugin of this._activePluginsForExtraEvents) {
            plugin.hardBindForSubMesh(this._material._uniformBuffer, this._scene, this._engine, eventData.subMesh);
        }
    }

    protected _handlePluginEventBindForSubMesh(eventData: MaterialPluginBindForSubMesh): void {
        for (const plugin of this._activePlugins) {
            plugin.bindForSubMesh(this._material._uniformBuffer, this._scene, this._engine, eventData.subMesh);
        }
    }

    protected _handlePluginEventHasRenderTargetTextures(eventData: MaterialPluginHasRenderTargetTextures): void {
        let hasRenderTargetTextures = false;
        for (const plugin of this._activePluginsForExtraEvents) {
            hasRenderTargetTextures = plugin.hasRenderTargetTextures();
            if (hasRenderTargetTextures) {
                break;
            }
        }
        eventData.hasRenderTargetTextures = hasRenderTargetTextures;
    }

    protected _handlePluginEventFillRenderTargetTextures(eventData: MaterialPluginFillRenderTargetTextures): void {
        for (const plugin of this._activePluginsForExtraEvents) {
            plugin.fillRenderTargetTextures(eventData.renderTargets);
        }
    }

    protected _handlePluginEvent(
        id: number,
        info:
            | MaterialPluginGetActiveTextures
            | MaterialPluginGetAnimatables
            | MaterialPluginHasTexture
            | MaterialPluginDisposed
            | MaterialPluginGetDefineNames
            | MaterialPluginPrepareEffect
            | MaterialPluginPrepareUniformBuffer
    ): void {
        switch (id) {
            case MaterialPluginEvent.GetActiveTextures: {
                const eventData = info as MaterialPluginGetActiveTextures;
                for (const plugin of this._activePlugins) {
                    plugin.getActiveTextures(eventData.activeTextures);
                }
                break;
            }

            case MaterialPluginEvent.GetAnimatables: {
                const eventData = info as MaterialPluginGetAnimatables;
                for (const plugin of this._activePlugins) {
                    plugin.getAnimatables(eventData.animatables);
                }
                break;
            }

            case MaterialPluginEvent.HasTexture: {
                const eventData = info as MaterialPluginHasTexture;
                let hasTexture = false;
                for (const plugin of this._activePlugins) {
                    hasTexture = plugin.hasTexture(eventData.texture);
                    if (hasTexture) {
                        break;
                    }
                }
                eventData.hasTexture = hasTexture;
                break;
            }

            case MaterialPluginEvent.Disposed: {
                const eventData = info as MaterialPluginDisposed;
                for (const plugin of this._plugins) {
                    plugin.dispose(eventData.forceDisposeTextures);
                }
                break;
            }

            case MaterialPluginEvent.GetDefineNames: {
                const eventData = info as MaterialPluginGetDefineNames;
                eventData.defineNames = this._defineNamesFromPlugins;
                break;
            }

            case MaterialPluginEvent.PrepareEffect: {
                const eventData = info as MaterialPluginPrepareEffect;
                for (const plugin of this._activePlugins) {
                    eventData.fallbackRank = plugin.addFallbacks(eventData.defines, eventData.fallbacks, eventData.fallbackRank);
                    plugin.getAttributes(eventData.attributes, this._scene, eventData.mesh);
                }
                if (this._uniformList.length > 0) {
                    eventData.uniforms.push(...this._uniformList);
                }
                if (this._samplerList.length > 0) {
                    eventData.samplers.push(...this._samplerList);
                }
                if (this._uboList.length > 0) {
                    eventData.uniformBuffersNames.push(...this._uboList);
                }
                eventData.customCode = this._injectCustomCode(eventData, eventData.customCode);
                break;
            }

            case MaterialPluginEvent.PrepareUniformBuffer: {
                const eventData = info as MaterialPluginPrepareUniformBuffer;
                this._uboDeclaration = "";
                this._vertexDeclaration = "";
                this._fragmentDeclaration = "";
                this._uniformList = [];
                this._samplerList = [];
                this._uboList = [];
                for (const plugin of this._plugins) {
                    const uniforms = plugin.getUniforms();
                    if (uniforms) {
                        if (uniforms.ubo) {
                            for (const uniform of uniforms.ubo) {
                                if (uniform.size && uniform.type) {
                                    const arraySize = uniform.arraySize ?? 0;
                                    eventData.ubo.addUniform(uniform.name, uniform.size, arraySize);
                                    this._uboDeclaration += `${uniform.type} ${uniform.name}${arraySize > 0 ? `[${arraySize}]` : ""};\n`;
                                }
                                this._uniformList.push(uniform.name);
                            }
                        }
                        if (uniforms.vertex) {
                            this._vertexDeclaration += uniforms.vertex + "\n";
                        }
                        if (uniforms.fragment) {
                            this._fragmentDeclaration += uniforms.fragment + "\n";
                        }
                    }
                    plugin.getSamplers(this._samplerList);
                    plugin.getUniformBuffersNames(this._uboList);
                }
                break;
            }
        }
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

    protected _injectCustomCode(eventData: MaterialPluginPrepareEffect, existingCallback?: (shaderType: string, code: string) => string): ShaderCustomProcessingFunction {
        return (shaderType: string, code: string) => {
            if (existingCallback) {
                code = existingCallback(shaderType, code);
            }
            if (this._uboDeclaration) {
                code = code.replace("#define ADDITIONAL_UBO_DECLARATION", this._uboDeclaration);
            }
            if (this._vertexDeclaration) {
                code = code.replace("#define ADDITIONAL_VERTEX_DECLARATION", this._vertexDeclaration);
            }
            if (this._fragmentDeclaration) {
                code = code.replace("#define ADDITIONAL_FRAGMENT_DECLARATION", this._fragmentDeclaration);
            }
            const points = this._codeInjectionPoints?.[shaderType];
            if (!points) {
                return code;
            }
            let processorOptions: Nullable<ProcessingOptions> = null;
            for (let pointName in points) {
                let injectedCode = "";
                for (const plugin of this._activePlugins) {
                    let customCode = plugin.getCustomCode(shaderType)?.[pointName];
                    if (!customCode) {
                        continue;
                    }
                    if (plugin.resolveIncludes) {
                        if (processorOptions === null) {
                            const shaderLanguage = ShaderLanguage.GLSL;
                            processorOptions = {
                                defines: [], // not used by _ProcessIncludes
                                indexParameters: eventData.indexParameters,
                                isFragment: false,
                                shouldUseHighPrecisionShader: this._engine._shouldUseHighPrecisionShader,
                                processor: undefined as any, // not used by _ProcessIncludes
                                supportsUniformBuffers: this._engine.supportsUniformBuffers,
                                shadersRepository: ShaderStore.GetShadersRepository(shaderLanguage),
                                includesShadersStore: ShaderStore.GetIncludesShadersStore(shaderLanguage),
                                version: undefined as any, // not used by _ProcessIncludes
                                platformName: this._engine.shaderPlatformName,
                                processingContext: undefined as any, // not used by _ProcessIncludes
                                isNDCHalfZRange: this._engine.isNDCHalfZRange,
                                useReverseDepthBuffer: this._engine.useReverseDepthBuffer,
                                processCodeAfterIncludes: undefined as any, // not used by _ProcessIncludes
                            };
                        }
                        processorOptions.isFragment = shaderType === "fragment";
                        ShaderProcessor._ProcessIncludes(customCode, processorOptions, (code) => (customCode = code));
                    }
                    injectedCode += customCode + "\n";
                }
                if (injectedCode.length > 0) {
                    if (pointName.charAt(0) === "!") {
                        // pointName is a regular expression
                        pointName = pointName.substring(1);

                        let regexFlags = "g";
                        if (pointName.charAt(0) === "!") {
                            // no flags
                            regexFlags = "";
                            pointName = pointName.substring(1);
                        } else {
                            // get the flag(s)
                            const matchOption = rxOption.exec(pointName);
                            if (matchOption && matchOption.length >= 2) {
                                regexFlags = matchOption[1];
                                pointName = pointName.substring(regexFlags.length + 1);
                            }
                        }

                        if (regexFlags.indexOf("g") < 0) {
                            // we force the "g" flag so that the regexp object is stateful!
                            regexFlags += "g";
                        }

                        const sourceCode = code;
                        const rx = new RegExp(pointName, regexFlags);
                        let match = rx.exec(sourceCode);
                        while (match !== null) {
                            let newCode = injectedCode;
                            for (let i = 0; i < match.length; ++i) {
                                newCode = newCode.replace("$" + i, match[i]);
                            }
                            code = code.replace(match[0], newCode);
                            match = rx.exec(sourceCode);
                        }
                    } else {
                        const fullPointName = "#define " + pointName;
                        code = code.replace(fullPointName, "\n" + injectedCode + "\n" + fullPointName);
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
export type PluginMaterialFactory = (material: Material) => Nullable<MaterialPluginBase>;

const plugins: Array<[string, PluginMaterialFactory]> = [];
let inited = false;
let observer: Nullable<Observer<Material>> = null;

/**
 * Registers a new material plugin through a factory, or updates it. This makes the plugin available to all materials instantiated after its registration.
 * @param pluginName The plugin name
 * @param factory The factory function which allows to create the plugin
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterMaterialPlugin(pluginName: string, factory: PluginMaterialFactory): void {
    if (!inited) {
        observer = Material.OnEventObservable.add((material: Material) => {
            for (const [, factory] of plugins) {
                factory(material);
            }
        }, MaterialPluginEvent.Created);
        inited = true;
    }
    const existing = plugins.filter(([name, _factory]) => name === pluginName);
    if (existing.length > 0) {
        existing[0][1] = factory;
    } else {
        plugins.push([pluginName, factory]);
    }
}

/**
 * Removes a material plugin from the list of global plugins.
 * @param pluginName The plugin name
 * @returns true if the plugin has been removed, else false
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function UnregisterMaterialPlugin(pluginName: string): boolean {
    for (let i = 0; i < plugins.length; ++i) {
        if (plugins[i][0] === pluginName) {
            plugins.splice(i, 1);
            if (plugins.length === 0) {
                UnregisterAllMaterialPlugins();
            }
            return true;
        }
    }
    return false;
}

/**
 * Clear the list of global material plugins
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function UnregisterAllMaterialPlugins(): void {
    plugins.length = 0;
    inited = false;
    Material.OnEventObservable.remove(observer);
    observer = null;
}
