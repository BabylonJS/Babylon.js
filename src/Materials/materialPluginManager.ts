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

type pluginMaterialFactory = (material: Material) => Nullable<IMaterialPlugin>;

export class MaterialPluginManager {

    private static _Plugins: Array<[string, pluginMaterialFactory]> = [];

    private static _Inited = false;

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

    public static RegisterPlugin(propertyName: string, factory: pluginMaterialFactory): void {
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
    }

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

    public static FillRenderTargetTextures(material: Material, renderTargets: SmartArray<RenderTargetTexture>): void {
        for (const plugin of material._plugins) {
            plugin.fillRenderTargetTextures?.(renderTargets);
        }
    }

    public static HasRenderTargetTextures(material: Material): boolean {
        for (const plugin of material._plugins) {
            if (plugin.hasRenderTargetTextures?.()) {
                return true;
            }
        }
        return false;
    }

    public static GetAnimatables(material: Material, result: BaseTexture[]): void {
        for (const plugin of material._plugins) {
            plugin.getAnimatables?.(result);
        }
    }

    public static GetActiveTextures(material: Material, result: BaseTexture[]): void {
        for (const plugin of material._plugins) {
            plugin.getActiveTextures?.(result);
        }
    }

    public static HasTexture(material: Material, texture: BaseTexture): boolean {
        for (const plugin of material._plugins) {
            if (plugin.hasTexture?.(texture)) {
                return true;
            }
        }
        return false;
    }

    public static DisableAlphaBlending(material: Material): boolean {
        for (const plugin of material._plugins) {
            if (plugin.disableAlphaBlending) {
                return true;
            }
        }
        return false;
    }

    public static Dispose(material: Material, forceDisposeTextures?: boolean): void {
        for (const plugin of material._plugins) {
            plugin.dispose?.(forceDisposeTextures);
        }
    }

    public static IsReadyForSubMesh(material: Material, defines: MaterialDefines, scene: Scene, engine: Engine): boolean {
        let isReady = true;
        for (const plugin of material._plugins) {
            isReady = isReady && (plugin.isReadyForSubMesh?.(defines, scene, engine) ?? true);
        }
        return isReady;
    }

    public static CollectDefineNames(material: Material): string[] | undefined {
        const names: string[] = [];
        for (const plugin of material._plugins) {
            plugin.collectDefineNames?.(names);
        }
        return names.length > 0 ? names : undefined;
    }

    public static PrepareDefines(material: Material, defines: MaterialDefines, scene: Scene): void {
        for (const plugin of material._plugins) {
            plugin.prepareDefines?.(defines, scene);
        }
    }

    public static Unbind(material: Material, effect: Effect): boolean {
        let result = false;
        for (const plugin of material._plugins) {
            result = result || (plugin.unbind?.(effect) ?? false);
        }
        return result;
    }

    public static BindForSubMesh(material: Material, ubo: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        for (const plugin of material._plugins) {
            plugin.bindForSubMesh?.(ubo, scene, engine, subMesh);
        }
    }

    public static HardBindForSubMesh(material: Material, ubo: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        for (const plugin of material._plugins) {
            plugin.hardBindForSubMesh?.(ubo, scene, engine, subMesh);
        }
    }

    public static AddFallbacks(material: Material, defines: MaterialDefines, fallbacks: EffectFallbacks, fallbackRank: number): number {
        for (const plugin of material._plugins) {
            if (plugin.addFallbacks) {
                fallbackRank = plugin.addFallbacks(defines, fallbacks, fallbackRank);
            }
        }
        return fallbackRank;
    }

    public static AddUniforms(material: Material, uniforms: string[]): void {
        for (const plugin of material._plugins) {
            plugin.addUniforms?.(uniforms);
        }
    }

    public static AddSamplers(material: Material, samplers: string[]): void {
        for (const plugin of material._plugins) {
            plugin.addSamplers?.(samplers);
        }
    }

    public static PrepareUniformBuffer(material: Material, ubo: UniformBuffer): void {
        for (const plugin of material._plugins) {
            plugin.prepareUniformBuffer?.(ubo);
        }
    }

    // todo: add CopyTo, Serialize, Parse

}
