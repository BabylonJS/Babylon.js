import { MaterialPluginBase } from "core/Materials/materialPluginBase.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { type MaterialDefines } from "core/Materials/materialDefines";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type UniformBuffer } from "core/Materials/uniformBuffer";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { GetNeuralCustomCode } from "./neuralTextureMaterialPlugin";
import { type INeuralV4Layout } from "./neuralTextureV4";
import { GetNeuralV4RuntimeShader, type NeuralTextureRuntimeFilter } from "./neuralTextureV4Shaders";
import { type NeuralTextureTiming } from "./neuralTextureTiming";

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
    private _timing?: NeuralTextureTiming;
    private _runtimeFilter: NeuralTextureRuntimeFilter;
    private _debugChannels: number[] | undefined;

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
        runtimeFilter: NeuralTextureRuntimeFilter = "bilinear",
        lodBias = 0,
        timing?: NeuralTextureTiming
    ) {
        super(material, "BABYLON_materials_neural_texture", 190, { NEURAL_LAYOUT: 0 }, false);
        this.doNotSerialize = true;
        this._extension = extension;
        this._layout = layout;
        this._latents = latents;
        this._weights = weights;
        this._timing = timing;
        this._runtimeFilter = runtimeFilter;
        this.lodBias = lodBias;
        this._pluginManager._addPlugin(this);
        this._enable(true);
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

    /** Logical channel indices written to the base color instead of the payload outputs. Debug and test aid: the material must replace its base color. */
    public get debugChannels(): number[] | undefined {
        return this._debugChannels;
    }

    public set debugChannels(value: number[] | undefined) {
        this._debugChannels = value;
        this.markAllDefinesAsDirty();
    }

    public override isCompatible(): boolean {
        return true;
    }

    public override prepareDefines(defines: MaterialDefines): void {
        defines["NEURAL_LAYOUT"] = HashString(
            JSON.stringify([this._layout.channels, this._layout.grids, this._extension.outputs, this._extension.replacedSlots, this._runtimeFilter, this._debugChannels])
        );
    }

    public override getSamplers(samplers: string[]): void {
        this._latents.forEach((_, i) => samplers.push(`neuralLatent${i}`));
        samplers.push("neuralWeightTex");
    }

    public override getUniforms() {
        return { ubo: [{ name: "neuralParams", size: 4, type: "vec4" }] };
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer): void {
        const start = this._timing ? performance.now() : 0;
        uniformBuffer.updateFloat4("neuralParams", this._material.getScene().getFrameId() & 0xffff, this.lodBias, this.forceMip, 0);
        this._latents.forEach((latent, i) => uniformBuffer.setTexture(`neuralLatent${i}`, latent));
        uniformBuffer.setTexture("neuralWeightTex", this._weights);
        this._timing?.("shaderWeightsUploadAndBind", start);
        this._timing = undefined;
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
        return GetNeuralCustomCode(extension, shaderLanguage, GetNeuralV4RuntimeShader(this._layout, extension.outputs, shaderLanguage, this._runtimeFilter));
    }
}
