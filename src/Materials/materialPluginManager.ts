import { EventState } from "../Misc/observable";
import { SmartArray } from "../Misc/smartArray";
import { Nullable } from "../types";
import { IMaterialPlugin } from "./IMaterialPlugin";
import { Material } from "./material";
import { MaterialEvent,
    MaterialEventInfoGetDisableAlphaBlending,
    MaterialEventInfoHasRenderTargetTextures,
    MaterialEventInfoDisposed,
    MaterialEventInfoIsReadyForSubMesh,
    MaterialEventInfoCollectDefineNames,
    MaterialEventInfoHasTexture,
    MaterialEventInfoFillRenderTargetTextures,
    MaterialEventInfoAddFallbacks,
    MaterialEventInfoAddUniforms,
    MaterialEventInfoAddSamplers,
    MaterialEventInfoInjectCustomCode,
    MaterialEventInfoPrepareDefines,
    MaterialEventInfoPrepareUniformBuffer,
    MaterialEventInfoUnbind,
    MaterialEventInfoHardBindForSubMesh,
    MaterialEventInfoBindForSubMesh,
    MaterialEventInfoGetAnimatables,
    MaterialEventInfoGetActiveTextures
} from "./materialEvent";

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
 * Type for plugin material factories.
 */
type PluginMaterialFactory = (material: Material) => Nullable<IMaterialPlugin>;

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

        if (eventState.mask & MaterialEvent.GetDisableAlphaBlending) {
            (eventState.userInfo as MaterialEventInfoGetDisableAlphaBlending).disableAlphaBlending ||= DisableAlphaBlending(material);
        }

        if (eventState.mask & MaterialEvent.Disposed) {
            Dispose(material, (eventState.userInfo as MaterialEventInfoDisposed).forceDisposeTextures);
        }

        if (eventState.mask & MaterialEvent.HasRenderTargetTextures) {
            (eventState.userInfo as MaterialEventInfoHasRenderTargetTextures).hasRenderTargetTextures ||= HasRenderTargetTextures(material);
        }

        if (eventState.mask & MaterialEvent.IsReadyForSubMesh)
        {
            const materialInfo = eventState.userInfo as MaterialEventInfoIsReadyForSubMesh;
            materialInfo.isReadyForSubMesh ||= IsReadyForSubMesh(material, materialInfo.defines, materialInfo.scene, materialInfo.engine);
        }

        if (eventState.mask & MaterialEvent.HasTexture) {
            const info = (eventState.userInfo as MaterialEventInfoHasTexture);
            info.hasTexture ||= HasTexture(material, info.texture);
        }

        if (eventState.mask & MaterialEvent.CollectDefineNames) {
            (eventState.userInfo as MaterialEventInfoCollectDefineNames).defineNames = CollectDefineNames(material);
        }

        if (eventState.mask & MaterialEvent.HasRenderTargetTextures) {
            (eventState.userInfo as MaterialEventInfoHasRenderTargetTextures).hasRenderTargetTextures = HasRenderTargetTextures(material);
        }
        if (eventState.mask & MaterialEvent.HasTexture) {
            const info = (eventState.userInfo as MaterialEventInfoHasTexture);
            info.hasTexture = HasTexture(material, info.texture);
        }
        if (eventState.mask & MaterialEvent.IsReadyForSubMesh) {
            const info = (eventState.userInfo as MaterialEventInfoIsReadyForSubMesh);
            info.isReadyForSubMesh = IsReadyForSubMesh(material, info.defines, info.scene, info.engine);
        }
        if (eventState.mask & MaterialEvent.CollectDefineNames) {
            const info = (eventState.userInfo as MaterialEventInfoCollectDefineNames);
            info.defineNames = CollectDefineNames(material);
        }
        if (eventState.mask & MaterialEvent.FillRenderTargetTextures) {
            const info = (eventState.userInfo as MaterialEventInfoFillRenderTargetTextures);
            FillRenderTargetTextures(material, info.renderTargets);
        }
        if (eventState.mask & MaterialEvent.AddFallbacks) {
            const info = (eventState.userInfo as MaterialEventInfoAddFallbacks);
            info.fallbackRank = AddFallbacks(material, info.defines, info.fallbacks, info.fallbackRank);
        }
        if (eventState.mask & MaterialEvent.AddUniforms) {
            const info = (eventState.userInfo as MaterialEventInfoAddUniforms);
            AddUniforms(material, info.uniforms);
        }
        if (eventState.mask & MaterialEvent.AddSamplers) {
            const info = (eventState.userInfo as MaterialEventInfoAddSamplers);
            AddSamplers(material, info.samplers);
        }
        if (eventState.mask & MaterialEvent.InjectCustomCode) {
            const info = (eventState.userInfo as MaterialEventInfoInjectCustomCode);
            info.customCode = InjectCustomCode(material);
        }
        if (eventState.mask & MaterialEvent.PrepareDefines) {
            const info = (eventState.userInfo as MaterialEventInfoPrepareDefines);
            PrepareDefines(material, info.defines, info.scene, info.mesh);
        }
        if (eventState.mask & MaterialEvent.PrepareUniformBuffer) {
            const info = (eventState.userInfo as MaterialEventInfoPrepareUniformBuffer);
            PrepareUniformBuffer(material, info.ubo);
        }
        if (eventState.mask & MaterialEvent.Unbind) {
            const info = (eventState.userInfo as MaterialEventInfoUnbind);
            info.needFlag = Unbind(material, info.effect);
        }
        if (eventState.mask & MaterialEvent.HardBindForSubMesh) {
            const info = (eventState.userInfo as MaterialEventInfoHardBindForSubMesh);
            HardBindForSubMesh(material, info.ubo, info.scene, info.engine, info.subMesh);
        }
        if (eventState.mask & MaterialEvent.BindForSubMesh) {
            const info = (eventState.userInfo as MaterialEventInfoBindForSubMesh);
            BindForSubMesh(material, info.ubo, info.scene, info.engine, info.subMesh);
        }
        if (eventState.mask & MaterialEvent.GetAnimatables) {
            const info = (eventState.userInfo as MaterialEventInfoGetAnimatables);
            GetAnimatables(material, info.animatables);
        }
        if (eventState.mask & MaterialEvent.GetActiveTextures) {
            const info = (eventState.userInfo as MaterialEventInfoGetActiveTextures);
            GetActiveTextures(material, info.activeTextures);
        }

    }, MaterialEvent.All);

    _Inited = true;
}

/**
 * Registers a new material plugin through a factory, or updates it. This makes the
 * plugin available to all Materials instantiated after its registration.
 * @param propertyName The plugin name
 * @param factory The factor function, which returns a IMaterialPlugin or null if it's not applicable.
 */
export function RegisterMaterialPlugin(propertyName: string, factory: PluginMaterialFactory): void {
    if (!_Inited) {
        _Initialize();
    }
    const existing = _Plugins.filter(([name, plugin]) => name === propertyName);
    if (existing.length > 0) {
        existing[0][1] = factory;
    } else {
        _Plugins.push([propertyName, factory]);
    }
}

/**
 * Injects plugins on a material.
 * @param material The material to inject plugins into.
 */
function InjectPlugins(material: Material): void {
    for (const [propertyName, factory] of _Plugins) {
        _AddPluginToMaterial(material, propertyName, factory);
    }

    material._plugins = material._plugins.sort((a, b) => a.priority - b.priority);
}

/**
 * Adds a plugin to a specific material. Use instead of RegisterMaterialPlugin if you don't
 * want to make the plugin available to all materials.
 * @param material The material to inject plugins into.
 * @param propertyName The plugin name
 * @param factory The factor function, which returns a IMaterialPlugin or null if it's not applicable.
 */
export function AddPluginToMaterial(material: Material, propertyName: string, factory: PluginMaterialFactory): void {
    _AddPluginToMaterial(material, propertyName, factory);
    material._plugins = material._plugins.sort((a, b) => a.priority - b.priority);
}

/**
 * Internal method to add a plugin to a material.
 * @param material The material to inject plugins into.
 * @param propertyName The plugin name
 * @param factory The factor function, which returns a IMaterialPlugin or null if it's not applicable.
 */
function _AddPluginToMaterial(material: Material, propertyName: string, factory: PluginMaterialFactory): void {
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

    const plugin = factory(material);
    if (plugin) {
        material._plugins.push(plugin);
        (material as any)[propertyName] = plugin;
        plugin.initialize?.(material.getScene(), material._dirtyCallbacks);
        collectPointNames("vertex", plugin.getCustomCode?.("vertex"));
        collectPointNames("fragment", plugin.getCustomCode?.("fragment"));
    }
}

/**
 * Injects custom code into the material shader.
 * @param material The material to inject code into.
 * @returns The code injector function.
 */
function InjectCustomCode(material: Material): (shaderType: string, code: string) => string {
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
function FillRenderTargetTextures(material: Material, renderTargets: SmartArray<RenderTargetTexture>): void {
    for (const plugin of material._plugins) {
        plugin.fillRenderTargetTextures?.(renderTargets);
    }
}

/**
 * Calls hasRenderTargetTextures on all plugins for a given material.
 * @param material The material
 */
function HasRenderTargetTextures(material: Material): boolean {
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
function GetAnimatables(material: Material, animatables: IAnimatable[]): void {
    for (const plugin of material._plugins) {
        plugin.getAnimatables?.(animatables);
    }
}

/**
 * Calls getActiveTextures on all plugins for a given material.
 * @param material The material
 * @param activeTextures The active textures list.
 */
function GetActiveTextures(material: Material, activeTextures: BaseTexture[]): void {
    for (const plugin of material._plugins) {
        plugin.getActiveTextures?.(activeTextures);
    }
}

/**
 * Calls hasTexture on all plugins for a given material.
 * @param material The material
 * @param texture The texture to check.
 */
function HasTexture(material: Material, texture: BaseTexture): boolean {
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
function DisableAlphaBlending(material: Material): boolean {
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
function Dispose(material: Material, forceDisposeTextures?: boolean): void {
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
function IsReadyForSubMesh(material: Material, defines: MaterialDefines, scene: Scene, engine: Engine): boolean {
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
function CollectDefineNames(material: Material): string[] | undefined {
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
function PrepareDefines(material: Material, defines: MaterialDefines, scene: Scene, mesh: AbstractMesh): void {
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
function Unbind(material: Material, effect: Effect): boolean {
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
function BindForSubMesh(material: Material, ubo: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
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
function HardBindForSubMesh(material: Material, ubo: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
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
