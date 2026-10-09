/** This file must only contain pure code and pure imports */

import { type Nullable } from "../../types";
import { type Scene } from "../../scene.pure";
import { type AbstractEngine } from "../../Engines/abstractEngine.pure";
import { type SubMesh } from "../../Meshes/subMesh.pure";
import { type UniformBuffer } from "../uniformBuffer";
import { serialize } from "../../Misc/decorators";
import { RegisterClass } from "../../Misc/typeStore";
import { MaterialPluginBase } from "../materialPluginBase.pure";
import { ShaderLanguage } from "../shaderLanguage";
import { type GaussianSplattingMaterial } from "./gaussianSplattingMaterial.pure";

/**
 * Visualizes the longest projected Gaussian ellipse diameter in render-target pixels.
 * Smaller splats are whiter: brightness = sizeScale / (sizeScale + diameter).
 * See https://playground.babylonjs.com/#8FOB3C#0
 */
export class GaussianSplattingSizeMaterialPlugin extends MaterialPluginBase {
    private _isEnabled = true;
    private _sizeScale = 16;

    /**
     * Whether this plugin replaces the splat's RGB color. Disabling it restores normal color without removing the plugin.
     */
    @serialize()
    public get isEnabled(): boolean {
        return this._isEnabled;
    }
    public set isEnabled(value: boolean) {
        this._isEnabled = value;
    }

    /**
     * Positive half-brightness diameter, measured in render-target pixels. Defaults to 16.
     */
    @serialize()
    public get sizeScale(): number {
        return this._sizeScale;
    }
    public set sizeScale(value: number) {
        if (!Number.isFinite(value) || value <= 0) {
            throw new RangeError("sizeScale must be a positive finite number of pixels.");
        }
        this._sizeScale = value;
    }

    /**
     * Attaches the projected-size visualization to a Gaussian splat material.
     * @param material The material to visualize
     */
    constructor(material: GaussianSplattingMaterial) {
        super(material, "GaussianSplattingSize", 210);
        this._enable(true);
    }

    /** @returns The registered plugin class name */
    public override getClassName(): string {
        return "GaussianSplattingSizeMaterialPlugin";
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
        const wgsl = shaderLanguage === ShaderLanguage.WGSL;
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: wgsl
                    ? "varying vSplatSizeBrightness: f32;\nuniform splatSizeScale: f32;"
                    : "varying float vSplatSizeBrightness;\nuniform float splatSizeScale;",
                CUSTOM_VERTEX_UPDATE: wgsl ? "vertexOutputs.vSplatSizeBrightness = 0.0;" : "vSplatSizeBrightness = 0.0;",
                CUSTOM_GAUSSIAN_SPLAT_PROJECTED_SIZE: wgsl
                    ? "vertexOutputs.vSplatSizeBrightness = uniforms.splatSizeScale / (uniforms.splatSizeScale + 2.0 * max(length(majorAxis * scale), length(minorAxis * scale)));"
                    : "vSplatSizeBrightness = splatSizeScale / (splatSizeScale + 2.0 * max(length(majorAxis * scale), length(minorAxis * scale)));",
            };
        }
        if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: wgsl
                    ? "varying vSplatSizeBrightness: f32;\nuniform splatSizeEnabled: f32;"
                    : "varying float vSplatSizeBrightness;\nuniform float splatSizeEnabled;",
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: wgsl
                    ? "if (uniforms.splatSizeEnabled > 0.5) { finalColor = vec4f(vec3f(fragmentInputs.vSplatSizeBrightness), finalColor.a); }"
                    : "if (splatSizeEnabled > 0.5) { finalColor = vec4(vec3(vSplatSizeBrightness), finalColor.a); }",
            };
        }
        return null;
    }

    /** @returns Shader uniforms for both languages */
    public override getUniforms(): { externalUniforms: string[] } {
        return { externalUniforms: ["splatSizeScale", "splatSizeEnabled"] };
    }

    /**
     * Binds the projected-size visualization uniforms for the rendered submesh.
     * @param _uniformBuffer Unused
     * @param _scene Current scene
     * @param _engine Current engine
     * @param subMesh Rendered submesh
     */
    public override bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, subMesh: SubMesh): void {
        subMesh.effect?.setFloat("splatSizeScale", this._sizeScale);
        subMesh.effect?.setFloat("splatSizeEnabled", this._isEnabled ? 1 : 0);
    }
}

let _Registered = false;
/** Registers the plugin for material parsing; safe to call repeatedly. */
export function RegisterGaussianSplattingSizeMaterialPlugin(): void {
    if (!_Registered) {
        _Registered = true;
        RegisterClass("BABYLON.GaussianSplattingSizeMaterialPlugin", GaussianSplattingSizeMaterialPlugin);
    }
}
