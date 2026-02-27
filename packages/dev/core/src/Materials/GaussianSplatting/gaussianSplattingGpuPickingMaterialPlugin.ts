import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { SubMesh } from "../../Meshes/subMesh";
import type { UniformBuffer } from "../uniformBuffer";
import type { MaterialDefines } from "../materialDefines";
import { MaterialPluginBase } from "../materialPluginBase";
import { ShaderLanguage } from "../shaderLanguage";
import { RegisterClass } from "../../Misc/typeStore";
import { GaussianSplattingMaxPartCount } from "./gaussianSplattingMaterial";
import type { GaussianSplattingMaterial } from "./gaussianSplattingMaterial";

/**
 * Plugin for GaussianSplattingMaterial that replaces per-splat color output with
 * a pre-computed picking color for GPU-based hit testing.
 *
 * The picking color is computed on the CPU by encoding a 24-bit picking ID as RGB
 * (matching the readback decoding in GPUPicker).
 * @experimental
 */
export class GaussianSplattingGpuPickingMaterialPlugin extends MaterialPluginBase {
    private _pickingColor: [number, number, number] = [0, 0, 0];
    private _isCompound: boolean = false;
    private _partPickingColors: number[] = [];
    private _maxPartCount: number;

    /**
     * Creates a new GaussianSplattingGpuPickingMaterialPlugin.
     * @param material The GaussianSplattingMaterial to attach the plugin to.
     * @param maxPartCount The maximum number of parts supported for compound meshes.
     */
    constructor(material: GaussianSplattingMaterial, maxPartCount = GaussianSplattingMaxPartCount) {
        super(material, "GaussianSplatGpuPicking", 200);

        this._maxPartCount = maxPartCount;
        this._enable(true);
    }

    /**
     * Encodes a 24-bit picking ID into normalized RGB components.
     * @param id The picking ID to encode
     * @returns A tuple [r, g, b] with values in [0, 1]
     */
    public static EncodeIdToColor(id: number): [number, number, number] {
        return [((id >> 16) & 0xff) / 255, ((id >> 8) & 0xff) / 255, (id & 0xff) / 255];
    }

    /**
     * Sets the picking color for a non-compound mesh from a picking ID.
     * The ID is encoded into an RGB color on the CPU.
     * @param id The 24-bit picking ID.
     */
    public set meshId(id: number) {
        this._pickingColor = GaussianSplattingGpuPickingMaterialPlugin.EncodeIdToColor(id);
    }

    /**
     * Sets whether this material is for a compound mesh with per-part picking.
     */
    public set isCompound(value: boolean) {
        this._isCompound = value;
        this.markAllDefinesAsDirty();
    }

    /**
     * Gets whether this material is for a compound mesh with per-part picking.
     */
    public get isCompound(): boolean {
        return this._isCompound;
    }

    /**
     * Sets the per-part picking colors from an array of picking IDs.
     * Each ID is encoded into an RGB color on the CPU.
     * @param ids Array mapping part index to picking ID.
     */
    public set partMeshIds(ids: number[]) {
        const colors: number[] = [];
        for (let i = 0; i < this._maxPartCount; i++) {
            const c = i < ids.length ? GaussianSplattingGpuPickingMaterialPlugin.EncodeIdToColor(ids[i]) : ([0, 0, 0] as [number, number, number]);
            colors.push(c[0], c[1], c[2]);
        }
        this._partPickingColors = colors;
    }

    /**
     * @returns the class name
     */
    public override getClassName(): string {
        return "GaussianSplattingGpuPickingMaterialPlugin";
    }

    /**
     * Indicates this plugin supports both GLSL and WGSL.
     * @param shaderLanguage the shader language to check
     * @returns true for GLSL and WGSL
     */
    public override isCompatible(shaderLanguage: ShaderLanguage): boolean {
        switch (shaderLanguage) {
            case ShaderLanguage.GLSL:
            case ShaderLanguage.WGSL:
                return true;
            default:
                return false;
        }
    }

    /**
     * Always ready — no textures or async resources to wait on.
     * @param _defines the defines
     * @param _scene the scene
     * @param _engine the engine
     * @param _subMesh the submesh
     * @returns true
     */
    public override isReadyForSubMesh(_defines: MaterialDefines, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): boolean {
        return true;
    }

    /**
     * Returns custom shader code to inject GPU picking color output.
     *
     * @param shaderType "vertex" or "fragment"
     * @param shaderLanguage the shader language to use (default: GLSL)
     * @returns null or a map of injection point names to code strings
     */
    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL): Nullable<{ [pointName: string]: string }> {
        if (shaderLanguage === ShaderLanguage.WGSL) {
            return this._getCustomCodeWGSL(shaderType);
        }
        return this._getCustomCodeGLSL(shaderType);
    }

    private _getCustomCodeGLSL(shaderType: string): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `varying float vPartIndex;`,
                CUSTOM_VERTEX_UPDATE: `
#if IS_COMPOUND
    vPartIndex = float(splat.partIndex);
#else
    vPartIndex = 0.0;
#endif
                `,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
varying float vPartIndex;
#if IS_COMPOUND
uniform vec3 partPickingColors[${this._maxPartCount}];
#else
uniform vec3 pickingColor;
#endif
                `,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
#if IS_COMPOUND
    finalColor = vec4(partPickingColors[int(vPartIndex + 0.5)], 1.0);
#else
    finalColor = vec4(pickingColor, 1.0);
#endif
                `,
            };
        }
        return null;
    }

    private _getCustomCodeWGSL(shaderType: string): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `varying vPartIndex: f32;`,
                CUSTOM_VERTEX_UPDATE: `
#if IS_COMPOUND
    vertexOutputs.vPartIndex = f32(splat.partIndex);
#else
    vertexOutputs.vPartIndex = 0.0;
#endif
                `,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
varying vPartIndex: f32;
#if IS_COMPOUND
uniform partPickingColors: array<vec3f, ${this._maxPartCount}>;
#else
uniform pickingColor: vec3f;
#endif
                `,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
#if IS_COMPOUND
    finalColor = vec4f(uniforms.partPickingColors[i32(fragmentInputs.vPartIndex + 0.5)], 1.0);
#else
    finalColor = vec4f(uniforms.pickingColor, 1.0);
#endif
                `,
            };
        }
        return null;
    }

    /**
     * Registers the picking uniforms with the engine.
     * @returns uniform descriptions
     */
    public override getUniforms(): {
        ubo?: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        vertex?: string;
        fragment?: string;
        externalUniforms?: string[];
    } {
        return {
            externalUniforms: ["pickingColor", "partPickingColors"],
        };
    }

    /**
     * Binds the picking color uniform(s) each frame.
     * @param _uniformBuffer the uniform buffer (unused — we bind directly on the effect)
     * @param _scene the current scene
     * @param _engine the current engine
     * @param subMesh the submesh being rendered
     */
    public override bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, subMesh: SubMesh): void {
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }

        if (this._isCompound) {
            effect.setArray3("partPickingColors", this._partPickingColors);
        } else {
            effect.setFloat3("pickingColor", this._pickingColor[0], this._pickingColor[1], this._pickingColor[2]);
        }
    }
}

RegisterClass("BABYLON.GaussianSplattingGpuPickingMaterialPlugin", GaussianSplattingGpuPickingMaterialPlugin);
