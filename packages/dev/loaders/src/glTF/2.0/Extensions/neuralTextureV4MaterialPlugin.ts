import { MaterialPluginBase } from "core/Materials/materialPluginBase.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { type MaterialDefines } from "core/Materials/materialDefines";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type UniformBuffer } from "core/Materials/uniformBuffer";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { GetNeuralCustomCode, PreserveNeuralPluginOnClone, ShareNeuralTexture } from "./neuralTextureMaterialPlugin";
import { type INeuralV4Layout, type INeuralV4WeightTexture, HalfToFloat } from "./neuralTextureV4";
import {
    GetNeuralV4RuntimeShader,
    NeuralV4WeightsUboName,
    type INeuralV4ShaderOptions,
    type NeuralTextureRuntimeFilter,
    type NeuralTextureRuntimePrecision,
    type NeuralTextureRuntimeWeights,
} from "./neuralTextureV4Shaders";
import { type NeuralTextureTiming } from "./neuralTextureTiming";
import { type Scene } from "core/scene.pure";
import { type AbstractEngine } from "core/Engines/abstractEngine.pure";
import { type SubMesh } from "core/Meshes/subMesh.pure";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";

function HashString(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    }
    return hash >>> 1;
}

/**
 * Decodes a babylon-ntc-v4 payload per fragment inside the PBR shader: the latent atlases and the network data texture are sampled by texel
 * fetch, the mip is chosen from the UV derivatives and the result is filtered in software.
 * @internal
 */
export class NeuralTextureV4MaterialPlugin extends MaterialPluginBase {
    private _extension: IBabylonMaterialsNeuralTexture;
    private _layout: INeuralV4Layout;
    private _latents: BaseTexture[];
    private _weights: BaseTexture;
    private _packedWeights: INeuralV4WeightTexture;
    private _timing?: NeuralTextureTiming;
    private _runtimeFilter: NeuralTextureRuntimeFilter;
    private _runtimeWeights: NeuralTextureRuntimeWeights;
    private _runtimePrecision: NeuralTextureRuntimePrecision;
    private _weightsUbo: Nullable<DataBuffer> = null;
    private _warned = new Set<string>();
    private _debugChannels: number[] | undefined;
    private _ownsTextures: boolean;
    // The options of prepareDefines, which the effect is compiled and bound with; reset when a requested option changes.
    private _effectiveOptions: Nullable<Required<INeuralV4ShaderOptions>> = null;

    /** Bias added to the mip level selected from the UV derivatives. */
    public lodBias: number;
    /** Forces this mip level when it is not negative. Debug and test aid. */
    public forceMip = -1;

    constructor(
        material: PBRMaterial,
        extension: IBabylonMaterialsNeuralTexture,
        layout: INeuralV4Layout,
        latents: BaseTexture[],
        weights: BaseTexture,
        packedWeights: INeuralV4WeightTexture,
        runtimeFilter: NeuralTextureRuntimeFilter = "bilinear",
        lodBias = 0,
        timing?: NeuralTextureTiming,
        shaderOptions: INeuralV4ShaderOptions = {},
        ownsTextures = false
    ) {
        super(material, "BABYLON_materials_neural_texture", 190, { NEURAL_LAYOUT: 0 }, false);
        this.doNotSerialize = true;
        this._extension = extension;
        this._layout = layout;
        this._latents = latents;
        this._weights = weights;
        this._packedWeights = packedWeights;
        this._timing = timing;
        this._runtimeFilter = runtimeFilter;
        this._runtimeWeights = shaderOptions.weights ?? "texture";
        this._runtimePrecision = shaderOptions.precision ?? "f32";
        this.lodBias = lodBias;
        this._ownsTextures = ownsTextures;
        this._pluginManager._addPlugin(this);
        this._enable(true);
        // A clone owns references to the latents and weights, so it outlives the disposal of the source asset container.
        PreserveNeuralPluginOnClone(
            material,
            (clone) =>
                new NeuralTextureV4MaterialPlugin(
                    clone,
                    extension,
                    layout,
                    this._latents.map(ShareNeuralTexture),
                    ShareNeuralTexture(this._weights),
                    packedWeights,
                    this._runtimeFilter,
                    this.lodBias,
                    undefined,
                    { weights: this._runtimeWeights, precision: this._runtimePrecision },
                    true
                )
        );
    }

    /** Filtering of the decoded texels: bilinear (the default, 4 decodes), nearest, trilinear (8 decodes) or stochastic (1 decode with a random mip and texel). */
    public get runtimeFilter(): NeuralTextureRuntimeFilter {
        return this._runtimeFilter;
    }

    public set runtimeFilter(value: NeuralTextureRuntimeFilter) {
        if (value !== this._runtimeFilter) {
            this._runtimeFilter = value;
            this.markAllDefinesAsDirty();
        }
    }

    /** Source of the network parameters: "texture" (the default, RGBA16F texel fetches) or "uniform" (a fp32 uniform buffer, when it fits the device limit). */
    public get runtimeWeights(): NeuralTextureRuntimeWeights {
        return this._runtimeWeights;
    }

    public set runtimeWeights(value: NeuralTextureRuntimeWeights) {
        if (value !== this._runtimeWeights) {
            this._runtimeWeights = value;
            this._effectiveOptions = null;
            this.markAllDefinesAsDirty();
        }
    }

    /** Network arithmetic: "f32" (the default) or "f16" (WGSL f16 when the shader-f16 feature is enabled, GLSL mediump). */
    public get runtimePrecision(): NeuralTextureRuntimePrecision {
        return this._runtimePrecision;
    }

    public set runtimePrecision(value: NeuralTextureRuntimePrecision) {
        if (value !== this._runtimePrecision) {
            this._runtimePrecision = value;
            this._effectiveOptions = null;
            this.markAllDefinesAsDirty();
        }
    }

    /** Logical channel indices written to the base color instead of the payload outputs. Debug and test aid: the material must replace its base color. */
    public get debugChannels(): number[] | undefined {
        return this._debugChannels;
    }

    public set debugChannels(value: number[] | undefined) {
        this._debugChannels = value;
        this.markAllDefinesAsDirty();
    }

    private _warnOnce(message: string): void {
        if (!this._warned.has(message)) {
            this._warned.add(message);
            Logger.Warn(message);
        }
    }

    /**
     * The options that the device supports: unsupported requests fall back to the texture and f32.
     * @returns the effective options
     */
    private _getEffectiveOptions(): Required<INeuralV4ShaderOptions> {
        const engine = this._material.getScene().getEngine();
        let weights = this._runtimeWeights;
        if (weights === "uniform") {
            const bytes = this._packedWeights.width * this._packedWeights.height * 16;
            let maxBytes = 0;
            if (engine.supportsUniformBuffers) {
                if (engine.isWebGPU) {
                    maxBytes = engine.getCaps().maxFragmentUniformVectors * 4;
                } else {
                    const gl = (engine as unknown as { _gl?: WebGL2RenderingContext })._gl;
                    maxBytes = gl ? (gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE) as number) : 0;
                }
            }
            if (bytes > maxBytes) {
                this._warnOnce(`BABYLON_materials_neural_texture: ${bytes} bytes of uniform weights exceed the ${maxBytes} bytes limit; using the weights texture`);
                weights = "texture";
            }
        }
        let precision = this._runtimePrecision;
        if (precision === "f16" && engine.isWebGPU && !(engine as unknown as { enabledExtensions?: string[] }).enabledExtensions?.includes("shader-f16")) {
            this._warnOnce("BABYLON_materials_neural_texture: the shader-f16 WebGPU feature is not enabled; using f32");
            precision = "f32";
        }
        return { weights, precision };
    }

    public override isCompatible(): boolean {
        return true;
    }

    public override prepareDefines(defines: MaterialDefines): void {
        const options = (this._effectiveOptions ??= this._getEffectiveOptions());
        // The generated code embeds the layout and its dimensions as literals, and the compiled effect is cached by defines.
        defines["NEURAL_LAYOUT"] = HashString(
            JSON.stringify([
                this._layout.width,
                this._layout.height,
                this._layout.mipCount,
                this._layout.channels,
                this._layout.grids,
                this._extension.outputs,
                this._extension.replacedSlots,
                this._runtimeFilter,
                options.weights,
                options.precision,
                this._debugChannels,
            ])
        );
    }

    public override getSamplers(samplers: string[]): void {
        this._latents.forEach((_, i) => samplers.push(`neuralLatent${i}`));
        samplers.push("neuralWeightTex");
    }

    public override getUniformBuffersNames(ubos: string[]): void {
        ubos.push(NeuralV4WeightsUboName);
    }

    public override getUniforms() {
        return { ubo: [{ name: "neuralParams", size: 4, type: "vec4" }] };
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer, _scene: Scene, engine: AbstractEngine, subMesh: SubMesh): void {
        const start = this._timing ? performance.now() : 0;
        uniformBuffer.updateFloat4("neuralParams", this._material.getScene().getFrameId() & 0xffff, this.lodBias, this.forceMip, 0);
        this._latents.forEach((latent, i) => uniformBuffer.setTexture(`neuralLatent${i}`, latent));
        uniformBuffer.setTexture("neuralWeightTex", this._weights);
        if (this._effectiveOptions?.weights === "uniform" && subMesh.effect) {
            if (!this._weightsUbo) {
                const half = this._packedWeights.data;
                const data = new Float32Array(half.length);
                for (let i = 0; i < half.length; i++) {
                    data[i] = HalfToFloat(half[i]);
                }
                this._weightsUbo = engine.createUniformBuffer(data, "NeuralWeights");
            }
            // Ignored when the effect does not declare the block (texture fallback).
            subMesh.effect.bindUniformBuffer(this._weightsUbo, NeuralV4WeightsUboName);
        }
        this._timing?.("shaderWeightsUploadAndBind", start);
        this._timing = undefined;
    }

    public override dispose(): void {
        if (this._weightsUbo) {
            this._material.getScene().getEngine()._releaseBuffer(this._weightsUbo);
            this._weightsUbo = null;
        }
        if (this._ownsTextures) {
            this._latents.forEach((latent) => latent.dispose());
            this._weights.dispose();
        }
    }

    public override getActiveTextures(activeTextures: BaseTexture[]): void {
        activeTextures.push(...this._latents, this._weights);
    }

    public override hasTexture(texture: BaseTexture): boolean {
        return texture === this._weights || this._latents.includes(texture);
    }

    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL) {
        if (shaderType !== "fragment") {
            return null;
        }
        let extension = this._extension;
        if (this._debugChannels) {
            extension = {
                ...extension,
                outputs: { ...extension.outputs, baseColor: this._debugChannels },
                replacedSlots: [...new Set([...extension.replacedSlots, "baseColorTexture" as const])],
            };
        }
        return GetNeuralCustomCode(
            extension,
            shaderLanguage,
            GetNeuralV4RuntimeShader(this._layout, extension.outputs, shaderLanguage, this._runtimeFilter, this._effectiveOptions ?? this._getEffectiveOptions())
        );
    }
}
