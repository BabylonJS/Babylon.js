import type { Material } from "core/Materials/material";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import { RegisterMaterialPlugin, UnregisterMaterialPlugin } from "core/Materials/materialPluginManager";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { Vector2 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { RegisterClass } from "../../../Misc/typeStore";

class TAAJitterMaterialDefines extends MaterialDefines {
    TAA_JITTER = false;
}

class TAAJitterMaterialPlugin extends MaterialPluginBase {
    public static readonly Name = "TAAJitter";

    private _manager: Nullable<TAAMaterialManager>;
    public get manager(): Nullable<TAAMaterialManager> {
        return this._manager;
    }

    public set manager(manager: Nullable<TAAMaterialManager>) {
        if (this._manager === manager) {
            return;
        }
        this.dispose();
        this._manager = manager;
        manager?._materialPlugins.push(this);
        this._updateMaterial();
    }

    public get isEnabled(): boolean {
        return this._manager?.isEnabled ?? false;
    }

    constructor(material: Material) {
        super(material, TAAJitterMaterialPlugin.Name, 300, new TAAJitterMaterialDefines());
        this.registerForExtraEvents = true;
        this.doNotSerialize = true;
    }

    /** @internal */
    public _updateMaterial(): void {
        this._enable(this.isEnabled);
        this.markAllDefinesAsDirty();
    }

    public override isCompatible(): boolean {
        return true;
    }

    public override getClassName(): string {
        return "TAAJitterMaterialPlugin";
    }

    public override prepareDefines(defines: TAAJitterMaterialDefines): void {
        defines.TAA_JITTER = this.isEnabled;
    }

    public override getUniforms(shaderLanguage = ShaderLanguage.GLSL) {
        const ubo = [{ name: "taa_jitter", size: 2, type: "vec2" }];
        if (shaderLanguage === ShaderLanguage.GLSL) {
            return {
                ubo,
                vertex: `
                    #ifdef TAA_JITTER
                    uniform vec2 taa_jitter;
                    #endif
                `,
            };
        } else {
            return { ubo };
        }
    }

    public override hardBindForSubMesh(uniformBuffer: UniformBuffer): void {
        if (this.isEnabled) {
            const jitter = this._manager!.jitter;
            uniformBuffer.updateFloat2("taa_jitter", jitter.x, jitter.y);
        }
    }

    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL) {
        // We jitter instead of modifying the camera so the velocity buffer stays unaffected
        // More info: https://sugulee.wordpress.com/2021/06/21/temporal-anti-aliasingtaa-tutorial/
        if (shaderType !== "vertex") {
            return null;
        } else if (shaderLanguage === ShaderLanguage.WGSL) {
            return {
                CUSTOM_VERTEX_MAIN_END: `
                    #ifdef TAA_JITTER
                    vertexOutputs.position += vec4f(uniforms.taa_jitter * vertexOutputs.position.w, 0.0, 0.0);
                    #endif
                `,
            };
        } else {
            return {
                CUSTOM_VERTEX_MAIN_END: `
                    #ifdef TAA_JITTER
                    gl_Position.xy += taa_jitter * gl_Position.w;
                    #endif
                `,
            };
        }
    }

    public override dispose(): void {
        if (this._manager) {
            const index = this._manager._materialPlugins.indexOf(this);
            if (index !== -1) {
                this._manager._materialPlugins.splice(index, 1);
            }
        }
    }
}

RegisterClass(`BABYLON.TAAJitterMaterialPlugin`, TAAJitterMaterialPlugin);

/**
 * Applies and manages the TAA jitter plugin on all materials.
 */
export class TAAMaterialManager {
    private _isEnabled = true;
    /**
     * Set to enable or disable the jitter offset on all materials.
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public set isEnabled(enabled: boolean) {
        if (this._isEnabled === enabled) {
            return;
        }
        this._isEnabled = enabled;
        for (const plugin of this._materialPlugins) {
            plugin._updateMaterial();
        }
    }

    /**
     * The current jitter offset to apply to all materials.
     */
    public readonly jitter = new Vector2();

    /** @internal */
    public readonly _materialPlugins: TAAJitterMaterialPlugin[] = [];

    /**
     * @param scene All materials in this scene will have a jitter offset applied to them.
     */
    constructor(scene: Scene) {
        for (const material of scene.materials) {
            this._getPlugin(material);
        }
        RegisterMaterialPlugin(TAAJitterMaterialPlugin.Name, (material) => this._getPlugin(material));
    }

    /**
     * Disposes of the material manager.
     */
    public dispose(): void {
        UnregisterMaterialPlugin(TAAJitterMaterialPlugin.Name);
        const plugins = this._materialPlugins.splice(0, this._materialPlugins.length);
        for (const plugin of plugins) {
            plugin.manager = null;
        }
    }

    private _getPlugin(material: Material): TAAJitterMaterialPlugin {
        let plugin = material.pluginManager?.getPlugin<TAAJitterMaterialPlugin>(TAAJitterMaterialPlugin.Name);
        if (!plugin) {
            plugin = new TAAJitterMaterialPlugin(material);
        }
        plugin.manager = this;
        return plugin;
    }
}
