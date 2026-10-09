/** This file must only contain pure code and pure imports */

import { type Nullable } from "../../types";
import { type Scene } from "../../scene.pure";
import { type AbstractEngine } from "../../Engines/abstractEngine.pure";
import { type SubMesh } from "../../Meshes/subMesh.pure";
import { type UniformBuffer } from "../uniformBuffer";
import { serialize } from "../../Misc/decorators";
import { RegisterClass } from "../../Misc/typeStore";
import { Constants } from "../../Engines/constants";
import { MaterialPluginBase } from "../materialPluginBase.pure";
import { ShaderLanguage } from "../shaderLanguage";
import { type GaussianSplattingMaterial } from "./gaussianSplattingMaterial.pure";

/**
 * Displays equal-contribution Gaussian fragment overdraw, independently of color and Gaussian opacity.
 * Uses additive ONE+ONE RGB blending and disables depth writes while active; keeps depth testing.
 * Restores the material's prior blending/depth settings on disable or disposal.
 * See https://playground.babylonjs.com/#D4U720#1
 */
export class GaussianSplattingOverdrawMaterialPlugin extends MaterialPluginBase {
    private _isEnabled = true;
    private _intensity = 1 / 256;
    private _originalAlphaMode: number;
    private _originalDisableDepthWrite: boolean;
    private _originalForceDepthWrite: boolean;

    /**
     * Whether equal-contribution additive rendering is active. Defaults to true.
     */
    @serialize()
    public get isEnabled(): boolean {
        return this._isEnabled;
    }
    public set isEnabled(value: boolean) {
        if (value === this._isEnabled) {
            return;
        }
        this._isEnabled = value;
        if (value) {
            this._originalAlphaMode = this._material.alphaMode;
            this._originalDisableDepthWrite = this._material.disableDepthWrite;
            this._originalForceDepthWrite = this._material.forceDepthWrite;
        }
        this._applyBlendState();
    }

    /**
     * Equal RGB contribution per surviving fragment. Defaults to 1/256 (256 overlaps reach white).
     */
    @serialize()
    public get intensity(): number {
        return this._intensity;
    }
    public set intensity(value: number) {
        if (!Number.isFinite(value) || value <= 0) {
            throw new RangeError("intensity must be a positive finite number.");
        }
        this._intensity = value;
    }

    /**
     * Attaches the additive overdraw visualization to a Gaussian splat material.
     * @param material The material to visualize
     */
    constructor(material: GaussianSplattingMaterial) {
        super(material, "GaussianSplattingOverdraw", 220);
        this._originalAlphaMode = material.alphaMode;
        this._originalDisableDepthWrite = material.disableDepthWrite;
        this._originalForceDepthWrite = material.forceDepthWrite;
        this._applyBlendState();
        this._enable(true);
    }

    private _applyBlendState(): void {
        if (this._isEnabled) {
            this._material.alphaMode = Constants.ALPHA_ONEONE;
            this._material.disableDepthWrite = true;
            this._material.forceDepthWrite = false;
        } else {
            if (this._material.alphaMode === Constants.ALPHA_ONEONE) {
                this._material.alphaMode = this._originalAlphaMode;
            }
            if (this._material.disableDepthWrite) {
                this._material.disableDepthWrite = this._originalDisableDepthWrite;
            }
            if (!this._material.forceDepthWrite) {
                this._material.forceDepthWrite = this._originalForceDepthWrite;
            }
        }
    }

    /** @returns The registered plugin class name */
    public override getClassName(): string {
        return "GaussianSplattingOverdrawMaterialPlugin";
    }

    /**
     * @param shaderLanguage Shader language to test
     * @returns Whether the shader language is supported
     */
    public override isCompatible(shaderLanguage: ShaderLanguage): boolean {
        return shaderLanguage === ShaderLanguage.GLSL || shaderLanguage === ShaderLanguage.WGSL;
    }

    /**
     * @param shaderType Vertex or fragment
     * @param shaderLanguage GLSL or WGSL
     * @returns Code inserted into the Gaussian shader, or null
     */
    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL): Nullable<{ [pointName: string]: string }> {
        if (shaderType !== "fragment") {
            return null;
        }
        const wgsl = shaderLanguage === ShaderLanguage.WGSL;
        return {
            CUSTOM_FRAGMENT_DEFINITIONS: wgsl
                ? "uniform splatOverdrawEnabled: f32;\nuniform splatOverdrawIntensity: f32;"
                : "uniform float splatOverdrawEnabled;\nuniform float splatOverdrawIntensity;",
            CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: wgsl
                ? "if (uniforms.splatOverdrawEnabled > 0.5) { if (finalColor.a <= 0.0) { discard; } finalColor = vec4f(vec3f(uniforms.splatOverdrawIntensity), 1.0); }"
                : "if (splatOverdrawEnabled > 0.5) { if (finalColor.a <= 0.0) discard; finalColor = vec4(vec3(splatOverdrawIntensity), 1.0); }",
        };
    }

    /** @returns Shader uniforms for both languages */
    public override getUniforms(): { externalUniforms: string[] } {
        return { externalUniforms: ["splatOverdrawEnabled", "splatOverdrawIntensity"] };
    }

    /**
     * @param _uniformBuffer Unused
     * @param _scene Current scene
     * @param _engine Current engine
     * @param subMesh Rendered submesh
     */
    public override bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, subMesh: SubMesh): void {
        subMesh.effect?.setFloat("splatOverdrawEnabled", this._isEnabled ? 1 : 0);
        subMesh.effect?.setFloat("splatOverdrawIntensity", this._intensity);
    }

    /** Restores blend/depth settings owned by this plugin. */
    public override dispose(): void {
        this.isEnabled = false;
    }

    /** @returns Serialized settings, including the pre-plugin blend/depth state */
    public override serialize(): any {
        return {
            ...super.serialize(),
            originalAlphaMode: this._originalAlphaMode,
            originalDisableDepthWrite: this._originalDisableDepthWrite,
            originalForceDepthWrite: this._originalForceDepthWrite,
        };
    }

    /**
     * Restores original blend settings after material parsing.
     * @param source Serialized plugin
     * @param scene Scene containing the material
     * @param rootUrl Asset root URL
     */
    public override parse(source: any, scene: Scene, rootUrl: string): void {
        super.parse(source, scene, rootUrl);
        if (!this._isEnabled) {
            return;
        }
        this._originalAlphaMode = source.originalAlphaMode ?? this._originalAlphaMode;
        this._originalDisableDepthWrite = source.originalDisableDepthWrite ?? this._originalDisableDepthWrite;
        this._originalForceDepthWrite = source.originalForceDepthWrite ?? this._originalForceDepthWrite;
        this._applyBlendState();
    }

    /**
     * Copies the original blend state as well as the public settings.
     * @param plugin Destination plugin
     */
    public override copyTo(plugin: MaterialPluginBase): void {
        const target = plugin as GaussianSplattingOverdrawMaterialPlugin;
        super.copyTo(plugin);
        if (!target._isEnabled) {
            return;
        }
        target._originalAlphaMode = this._originalAlphaMode;
        target._originalDisableDepthWrite = this._originalDisableDepthWrite;
        target._originalForceDepthWrite = this._originalForceDepthWrite;
        target._applyBlendState();
    }
}

let _Registered = false;
/** Registers the plugin for material parsing; safe to call repeatedly. */
export function RegisterGaussianSplattingOverdrawMaterialPlugin(): void {
    if (!_Registered) {
        _Registered = true;
        RegisterClass("BABYLON.GaussianSplattingOverdrawMaterialPlugin", GaussianSplattingOverdrawMaterialPlugin);
    }
}
