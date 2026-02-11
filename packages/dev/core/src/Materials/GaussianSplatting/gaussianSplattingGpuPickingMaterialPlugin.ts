import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { SubMesh } from "../../Meshes/subMesh";
import type { UniformBuffer } from "../uniformBuffer";
import type { MaterialDefines } from "../materialDefines";
import { MaterialPluginBase } from "../materialPluginBase";
import { ShaderLanguage } from "../shaderLanguage";
import { RegisterClass } from "../../Misc/typeStore";
import type { GaussianSplattingMaterial } from "./gaussianSplattingMaterial";

/**
 * Plugin for GaussianSplattingMaterial that replaces per-splat color output with
 * an encoded picking ID for GPU-based hit testing. Each splat outputs a 24-bit
 * picking ID encoded as RGB, enabling efficient GPU picking of Gaussian Splatting
 * meshes and compound mesh parts.
 *
 * For non-compound meshes, a single `meshID` uniform is used for the entire mesh.
 * For compound meshes, per-part picking IDs are looked up from the `partMeshID` array
 * using the splat's partIndex.
 * @experimental
 */
export class GaussianSplattingGpuPickingMaterialPlugin extends MaterialPluginBase {
    private _meshId: number = 0;
    private _isCompound: boolean = false;
    private _partMeshIds: number[] = [];
    private _maxPartCount: number;

    /**
     * Creates a new GaussianSplattingGpuPickingMaterialPlugin.
     * @param material The GaussianSplattingMaterial to attach the plugin to.
     * @param maxPartCount The maximum number of parts supported for compound meshes (default 256).
     */
    constructor(material: GaussianSplattingMaterial, maxPartCount = 256) {
        super(material, "GaussianSplatGpuPicking", 200);

        this._maxPartCount = maxPartCount;
        this._enable(true);
    }

    /**
     * Sets the picking ID for a non-compound mesh.
     * @param id The 24-bit picking ID to encode in the output color.
     */
    public set meshId(id: number) {
        this._meshId = id;
    }

    /**
     * Gets the picking ID for a non-compound mesh.
     */
    public get meshId(): number {
        return this._meshId;
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
     * Sets the per-part picking IDs for a compound mesh.
     * @param ids Array mapping part index to picking ID.
     */
    public set partMeshIds(ids: number[]) {
        this._partMeshIds = ids;
    }

    /**
     * Gets the per-part picking IDs.
     */
    public get partMeshIds(): number[] {
        return this._partMeshIds;
    }

    // --- Plugin overrides ---

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
     * Returns custom shader code fragments to inject GPU picking rendering.
     *
     * The vertex shader passes the picking mesh ID as a flat varying.
     * The fragment shader replaces the final color output with the encoded picking ID.
     *
     * @param shaderType "vertex" or "fragment"
     * @param shaderLanguage the shader language to use (default: GLSL)
     * @returns null or a map of injection point names to code strings
     */
    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL): Nullable<{ [pointName: string]: string }> {
        const maxPartCount = this._maxPartCount ?? 16;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            return this._getCustomCodeWGSL(shaderType, maxPartCount);
        }
        return this._getCustomCodeGLSL(shaderType, maxPartCount);
    }

    private _getCustomCodeGLSL(shaderType: string, maxPartCount: number): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `
flat varying float vPickingMeshID;
#if IS_COMPOUND
uniform float partMeshID[${maxPartCount}];
#else
uniform float meshID;
#endif
                `,
                CUSTOM_VERTEX_UPDATE: `
#if IS_COMPOUND
    vPickingMeshID = partMeshID[splat.partIndex];
#else
    vPickingMeshID = meshID;
#endif
                `,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
flat varying float vPickingMeshID;
                `,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
{
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
    int pickId = int(vPickingMeshID);
    vec3 pickColor = vec3(
        float((pickId >> 16) & 0xFF),
        float((pickId >> 8) & 0xFF),
        float(pickId & 0xFF)
    ) / 255.0;
#else
    float pickId = floor(vPickingMeshID + 0.5);
    vec3 pickColor = vec3(
        floor(mod(pickId, 16777216.0) / 65536.0),
        floor(mod(pickId, 65536.0) / 256.0),
        mod(pickId, 256.0)
    ) / 255.0;
#endif
    finalColor = vec4(pickColor, 1.0);
}
                `,
            };
        }
        return null;
    }

    private _getCustomCodeWGSL(shaderType: string, maxPartCount: number): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `
    flat varying vPickingMeshID: f32;
#if IS_COMPOUND
uniform partMeshID: array<f32, ${maxPartCount}>;
#else
uniform meshID: f32;
#endif
                `,
                CUSTOM_VERTEX_UPDATE: `
#if IS_COMPOUND
    vertexOutputs.vPickingMeshID = uniforms.partMeshID[splat.partIndex];
#else
    vertexOutputs.vPickingMeshID = uniforms.meshID;
#endif
                `,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
flat varying vPickingMeshID: f32;
                `,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
{
    var pickId: i32 = i32(fragmentInputs.vPickingMeshID);
    var pickColor = vec3f(
        f32((pickId >> 16) & 0xFF),
        f32((pickId >> 8) & 0xFF),
        f32(pickId & 0xFF),
    ) / 255.0;
    finalColor = vec4f(pickColor, 1.0);
}
                `,
            };
        }
        return null;
    }

    /**
     * Registers the picking uniforms with the engine so that
     * the Effect can resolve their locations.
     * @returns uniform descriptions
     */
    public override getUniforms(): {
        ubo?: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        vertex?: string;
        fragment?: string;
        externalUniforms?: string[];
    } {
        return {
            externalUniforms: ["meshID", "partMeshID"],
        };
    }

    /**
     * Binds the picking uniforms each frame.
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
            const partMeshIdData: number[] = new Array(this._maxPartCount).fill(0);
            for (let i = 0; i < this._partMeshIds.length && i < this._maxPartCount; i++) {
                partMeshIdData[i] = this._partMeshIds[i];
            }
            effect.setArray("partMeshID", partMeshIdData);
        } else {
            effect.setFloat("meshID", this._meshId);
        }
    }
}

RegisterClass("BABYLON.GaussianSplattingGpuPickingMaterialPlugin", GaussianSplattingGpuPickingMaterialPlugin);
