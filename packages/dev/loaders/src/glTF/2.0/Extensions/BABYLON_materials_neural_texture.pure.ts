import { type Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Texture } from "core/Materials/Textures/texture.pure";
import { Logger } from "core/Misc/logger";
import { type Nullable } from "core/types";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader.pure";
import { type IMaterial, type ITextureInfo } from "../glTFLoaderInterfaces";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { DecodeNeuralTextureAsync, ResolveNeuralTexture, type INeuralTextureGrid } from "./neuralTextureDecoder";
import { NeuralTextureMaterialPlugin } from "./neuralTextureMaterialPlugin";
import { BakeNeuralTextureAsync, type INeuralTextureBaked } from "./neuralTextureBaker";
import { CreateNeuralTextureTiming, TrackNeuralTextureMaterialTiming } from "./neuralTextureTiming";
import {
    DecodeNeuralV4Async,
    ExpandNeuralV4Weights,
    GetNeuralV4Layout,
    PackNeuralV4WeightTexture,
    ParseNeuralV4Weights,
    type INeuralV4Atlas,
    type INeuralV4Layout,
    type NeuralV4Group,
} from "./neuralTextureV4";
import { BakeNeuralV4Async, CreateNeuralV4WeightsTexture, type NeuralTextureBakeMips } from "./neuralTextureV4Baker";
import { NeuralTextureV4MaterialPlugin } from "./neuralTextureV4MaterialPlugin";
import { GetNeuralV4LatentTextureOrder, type NeuralTextureRuntimeFilter, type NeuralTextureRuntimePrecision, type NeuralTextureRuntimeWeights } from "./neuralTextureV4Shaders";

export { EnableNeuralTextureFileTiming } from "./neuralTextureTiming";

const NAME = "BABYLON_materials_neural_texture";
const SpecularGlossinessName = "KHR_materials_pbrSpecularGlossiness";
const DiffuseSlot = "KHR_materials_pbrSpecularGlossiness.diffuseTexture";
const SpecularGlossinessSlot = "KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture";

/**
 * Experimental babylon-ntc-v1/v2/v4 material textures: load-time GPU baking by
 * default, or opt-in GLSL/WGSL fragment decoding on WebGL 2 and WebGPU.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class BABYLON_materials_neural_texture implements IGLTFLoaderExtension {
    /** The name of this extension. */
    public readonly name = NAME;
    /** Whether the extension is enabled. */
    public enabled: boolean;
    /** Apply after other material extensions have configured the core properties. */
    public order = 190;
    /** Evaluate per fragment rather than creating ordinary textures. */
    public decodeInShader: boolean;
    /** Allow the slower CPU fallback when GPU baking is unavailable. */
    public allowCPUFallback: boolean;
    /** babylon-ntc-v4 only: how the mip chain of baked textures is produced, "generate" (box filter of the baked mip 0, default) or "neural" (decoded per mip). */
    public bakeMips: NeuralTextureBakeMips;
    /** babylon-ntc-v4 only: filtering of the in-shader decode, "bilinear" (default), "nearest", "trilinear" or "stochastic". */
    public runtimeFilter: NeuralTextureRuntimeFilter;
    /** babylon-ntc-v4 only: bias added to the mip selected by the in-shader decode. */
    public lodBias: number;
    /** babylon-ntc-v4 only: network parameters of the in-shader decode in the "texture" (default) or a "uniform" buffer. */
    public runtimeWeights: NeuralTextureRuntimeWeights;
    /** babylon-ntc-v4 only: arithmetic precision of the in-shader network, "f32" (default) or "f16". */
    public runtimePrecision: NeuralTextureRuntimePrecision;

    private _loader: GLTFLoader;
    private _disposed = false;

    /** @internal */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
        const options = loader.parent.extensionOptions[NAME];
        this.decodeInShader = options?.decodeInShader ?? false;
        this.allowCPUFallback = options?.allowCPUFallback ?? false;
        this.bakeMips = options?.bakeMips ?? "generate";
        this.runtimeFilter = options?.runtimeFilter ?? "bilinear";
        this.lodBias = options?.lodBias ?? 0;
        this.runtimeWeights = options?.runtimeWeights ?? "texture";
        this.runtimePrecision = options?.runtimePrecision ?? "f32";
    }

    /** @internal */
    public dispose(): void {
        this._disposed = true;
    }

    /** @internal */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IBabylonMaterialsNeuralTexture>(context, material, NAME, async (extensionContext, payload) => {
            if (payload?.codec !== "babylon-ntc-v1" && payload?.codec !== "babylon-ntc-v2" && payload?.codec !== "babylon-ntc-v4") {
                Logger.Warn(`${extensionContext}: Unsupported neural texture codec "${String(payload?.codec)}"; using fallback textures`);
                return await this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
            }
            const v4 = payload.codec === "babylon-ntc-v4";
            let resolved: IBabylonMaterialsNeuralTexture;
            let layout: INeuralV4Layout | undefined;
            try {
                resolved = ResolveNeuralTexture(extensionContext, payload);
                layout = v4 ? GetNeuralV4Layout(payload).layout : undefined;
            } catch (error) {
                // An invalid babylon-ntc-v4 payload degrades to the fallback textures; the older codecs keep throwing.
                if (!v4) {
                    throw error;
                }
                Logger.Warn(`${String((error as Error)?.message ?? error)}; using fallback textures`);
                return await this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
            }
            const specularGlossiness = material.extensions?.[SpecularGlossinessName];
            let replacedSlots = resolved.replacedSlots;
            if (!specularGlossiness && replacedSlots.some((slot) => slot === DiffuseSlot || slot === SpecularGlossinessSlot)) {
                Logger.Warn(`${extensionContext}: The material has no ${SpecularGlossinessName} extension; ignoring its neural specular/glossiness slots`);
                replacedSlots = replacedSlots.filter((slot) => slot !== DiffuseSlot && slot !== SpecularGlossinessSlot);
            }
            // With a neural specular/glossiness workflow the metallic/roughness slots are not used: the ORM
            // output only feeds the occlusion slot.
            const specularGlossinessNeural = !!specularGlossiness && replacedSlots.some((slot) => slot === DiffuseSlot || slot === SpecularGlossinessSlot);
            if (specularGlossinessNeural) {
                replacedSlots = replacedSlots.filter((slot) => slot !== "baseColorTexture" && slot !== "metallicRoughnessTexture");
            }
            const extension: IBabylonMaterialsNeuralTexture = { ...resolved, replacedSlots };
            const replaces = (slot: string) => (replacedSlots as string[]).includes(slot);
            // Only the replaced slots and the latents take part in the neural lookup; untouched core textures keep their UVs.
            const textureInfos = [
                replaces("baseColorTexture") ? material.pbrMetallicRoughness?.baseColorTexture : undefined,
                replaces("normalTexture") ? material.normalTexture : undefined,
                replaces("occlusionTexture") ? material.occlusionTexture : undefined,
                replaces("metallicRoughnessTexture") ? material.pbrMetallicRoughness?.metallicRoughnessTexture : undefined,
                replaces("emissiveTexture") ? material.emissiveTexture : undefined,
                replaces(DiffuseSlot) ? specularGlossiness?.diffuseTexture : undefined,
                replaces(SpecularGlossinessSlot) ? specularGlossiness?.specularGlossinessTexture : undefined,
                ...extension.latentTextures,
            ];
            if (textureInfos.some((info) => info && ((info.texCoord ?? 0) !== 0 || info.extensions?.KHR_texture_transform))) {
                Logger.Warn(`${extensionContext}: Neural textures require untransformed TEXCOORD_0; using fallback textures`);
                return await this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
            }
            if (!(babylonMaterial instanceof PBRMaterial)) {
                Logger.Warn(`${extensionContext}: Neural textures currently require PBRMaterial; using fallback textures`);
                return await this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
            }
            const scene = this._loader.babylonScene;
            const engine = scene.getEngine();
            const timing = this._loader.parent.extensionOptions[NAME]?.timing ? CreateNeuralTextureTiming(babylonMaterial.name) : undefined;
            const materialStart = timing ? performance.now() : 0;
            if (timing) {
                TrackNeuralTextureMaterialTiming(babylonMaterial, timing);
            }
            const shaderDecode = this.decodeInShader;
            // Without extensionsRequired, an unsupported backend degrades to the core textures.
            const required = !!this._loader.gltf.extensionsRequired?.includes(NAME);
            // v4 needs no uniform buffer (macOS Chrome disables them); the v1/v2 decoder keeps its weights in one.
            // Babylon Native reports a version without supporting these shaders.
            const shaderSupported = engine.name !== "Native" && (v4 ? engine.isWebGPU || engine.version >= 2 : engine.supportsUniformBuffers);
            if (shaderDecode && !shaderSupported) {
                const message = `${extensionContext}: Shader decoding requires WebGL 2 or WebGPU; disable decodeInShader to bake textures`;
                if (required) {
                    throw new Error(message);
                }
                Logger.Warn(`${message}; using fallback textures`);
                return await this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
            }
            const textureOrder = v4 ? GetNeuralV4LatentTextureOrder(layout!) : extension.latentTextures.map((_, index) => index);
            const latentsPromise = Promise.all(
                textureOrder.map(async (index) => {
                    const info = extension.latentTextures[index];
                    const start = timing ? performance.now() : 0;
                    // This bypasses sRGB uploads and overrides any sampler in the file: the codec
                    // requires base-level LINEAR + REPEAT (v1/v2) or exact NEAREST texel fetches (v4), even when the core slots use mipmaps.
                    const textureInfo: ITextureInfo = { ...info, nonColorData: true };
                    const latent = await this._loader.loadTextureInfoAsync(`${extensionContext}/latentTextures/${index}`, textureInfo);
                    latent.gammaSpace = false;
                    latent.wrapU = latent.wrapV = Texture.WRAP_ADDRESSMODE;
                    latent.updateSamplingMode(v4 ? Texture.NEAREST_SAMPLINGMODE : Texture.BILINEAR_SAMPLINGMODE);
                    const size = latent.getSize();
                    let expected: number[];
                    if (v4) {
                        const grid = layout!.grids.find((candidate) => candidate.textures.includes(index))!;
                        expected = [grid.atlasWidth, grid.atlasHeight];
                    } else {
                        expected = index < 2 ? extension.hiResolution! : extension.loResolution!;
                    }
                    if (size.width !== expected[0] || size.height !== expected[1]) {
                        throw new Error(`${extensionContext}/latentTextures/${index}: Incorrect grid dimensions`);
                    }
                    timing?.(`latentImageDecodeAndUpload${index}`, start);
                    return latent;
                })
            );
            const bufferView = ArrayItem.Get(`${extensionContext}/weights/bufferView`, this._loader.gltf.bufferViews, extension.weights.bufferView);
            // eslint-disable-next-line github/no-then
            const weightsPromise = this._loader.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView).then((bytes) => {
                const start = timing ? performance.now() : 0;
                if (v4) {
                    const half = ParseNeuralV4Weights(layout!, new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
                    timing?.("weightsParse", start);
                    return half;
                }
                const count = extension.weights.count!;
                if (bytes.byteLength !== count * 4) {
                    throw new Error(`${extensionContext}/weights: Expected ${count} float32 parameters`);
                }
                const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                const weights = new Float32Array(count);
                for (let i = 0; i < weights.length; i++) {
                    weights[i] = view.getFloat32(i * 4, true);
                    if (!Number.isFinite(weights[i])) {
                        throw new Error(`${extensionContext}/weights: Non-finite network parameter`);
                    }
                }
                timing?.("weightsParse", start);
                return weights;
            });
            // Some encoders retain a legacy specular/glossiness alternative alongside
            // the neural metallic/roughness payload. Load the superseded core workflow,
            // not that alternative, so textures and factors come from the same workflow.
            // The original JSON and all other extensions stay intact.
            const coreMaterial =
                specularGlossiness && !specularGlossinessNeural && (replaces("baseColorTexture") || replaces("metallicRoughnessTexture"))
                    ? { ...material, extensions: { ...material.extensions, [SpecularGlossinessName]: undefined } }
                    : material;
            const [, latents, parsedWeights] = await Promise.all([
                this._loader.loadMaterialPropertiesAsync(context, coreMaterial, babylonMaterial),
                latentsPromise,
                weightsPromise,
            ]);
            if (v4) {
                return await this._applyV4Async(
                    context,
                    extensionContext,
                    material,
                    babylonMaterial,
                    extension,
                    layout!,
                    latents,
                    textureOrder,
                    parsedWeights as Uint16Array,
                    replaces,
                    required,
                    timing,
                    materialStart
                );
            }
            const weights = parsedWeights as Float32Array;
            if (shaderDecode) {
                const start = timing ? performance.now() : 0;
                this._assignPlaceholders(context, material, babylonMaterial, replaces);
                new NeuralTextureMaterialPlugin(babylonMaterial, extension, latents, weights, timing);
                timing?.("shaderPluginAndPlaceholderCreation", start);
                timing?.("materialLoad", materialStart);
                return;
            }
            let baked: Nullable<INeuralTextureBaked> = null;
            try {
                baked = await BakeNeuralTextureAsync(scene, extension, latents, weights, this._loader._assetContainer, () => this._disposed, timing);
            } catch (error) {
                if (!this.allowCPUFallback || this._disposed || scene.isDisposed) {
                    throw error;
                }
                Logger.Warn(`${extensionContext}: GPU bake failed; using the optional CPU fallback (${String(error)})`);
            }
            if (baked) {
                this._assignNeuralTextures(context, material, babylonMaterial, baked, replaces);
                timing?.("materialLoad", materialStart);
                return;
            }
            if (!this.allowCPUFallback) {
                const message = `${extensionContext}: GPU baking is unavailable (requires WebGL 2 or WebGPU compute); opt into allowCPUFallback to use CPU decoding`;
                if (required) {
                    throw new Error(message);
                }
                // The core textures are already loaded.
                Logger.Warn(`${message}; using fallback textures`);
                return;
            }
            const grids = await Promise.all(
                latents.map(async (latent): Promise<INeuralTextureGrid> => {
                    const pixels = await latent.readPixels();
                    if (!(pixels instanceof Uint8Array)) {
                        throw new Error(`${extensionContext}: Cannot read RGBA8 latent data`);
                    }
                    return { data: pixels, ...latent.getSize() };
                })
            );
            const decoded = await DecodeNeuralTextureAsync(extension, grids, weights, () => this._disposed);
            const [width, height] = extension.resolution;
            const cpuBaked: INeuralTextureBaked = {};
            for (const [group, gammaSpace] of [
                ["baseColor", true],
                ["diffuse", true],
                ["specGloss", true],
                ["emissive", true],
                ["normal", false],
                ["orm", false],
            ] as const) {
                const data = decoded[group];
                if (data) {
                    cpuBaked[group] = this._createTexture(data, width, height, gammaSpace, `${babylonMaterial.name} (Neural ${group})`);
                }
            }
            this._assignNeuralTextures(context, material, babylonMaterial, cpuBaked, replaces, false);
        });
    }

    /**
     * Shader decoding redirects the samples of the PBR slots: every replaced slot needs a bound texture.
     * Core textures remain assigned where possible to preserve texture defines, factors, alpha handling and
     * tangent-space setup; 1x1 placeholders stand in for the color slots and for slots without a core texture.
     * @param context the glTF context
     * @param material the glTF material
     * @param babylonMaterial the Babylon material
     * @param replaces whether the extension replaces a slot
     */
    private _assignPlaceholders(context: string, material: IMaterial, babylonMaterial: PBRMaterial, replaces: (slot: string) => boolean): void {
        const placeholder = (name: string, gammaSpace = true) => this._createTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, gammaSpace, name);
        // Depth and shadow passes test the alpha of the albedo texture without the neural plugin: keep a real one.
        const keepAlbedo = (material.alphaMode === "MASK" || material.alphaMode === "BLEND") && !!babylonMaterial.albedoTexture;
        const textures: INeuralTextureBaked = {};
        // The decoder returns encoded sRGB: the placeholders let the PBR shader linearize it.
        if (replaces("baseColorTexture") && !keepAlbedo) {
            textures.baseColor = placeholder("Neural base color");
        }
        if (replaces(DiffuseSlot) && !keepAlbedo) {
            textures.diffuse = placeholder("Neural diffuse");
        }
        if (replaces(SpecularGlossinessSlot)) {
            textures.specGloss = placeholder("Neural specular glossiness");
        }
        if (replaces("emissiveTexture")) {
            textures.emissive = placeholder("Neural emissive");
        }
        if (replaces("normalTexture") && !babylonMaterial.bumpTexture) {
            textures.normal = placeholder("Neural normal", false);
        }
        if ((replaces("occlusionTexture") && !babylonMaterial.ambientTexture) || (replaces("metallicRoughnessTexture") && !babylonMaterial.metallicTexture)) {
            textures.orm = placeholder("Neural ORM", false);
        }
        this._assignNeuralTextures(context, material, babylonMaterial, textures, replaces, false);
    }

    private _assignNeuralTextures(
        context: string,
        material: IMaterial,
        babylonMaterial: PBRMaterial,
        textures: INeuralTextureBaked,
        replaces: (slot: string) => boolean,
        notify = true
    ): void {
        for (const texture of notify ? Object.values(textures) : []) {
            this._loader.parent.onTextureLoadedObservable.notifyObservers(texture);
        }
        if (textures.baseColor) {
            babylonMaterial.albedoTexture = textures.baseColor;
        }
        if (textures.diffuse) {
            babylonMaterial.albedoTexture = textures.diffuse;
        }
        if (textures.specGloss) {
            textures.specGloss.hasAlpha = true;
            babylonMaterial.reflectivityTexture = textures.specGloss;
            babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
        }
        if (textures.emissive) {
            babylonMaterial.emissiveTexture = textures.emissive;
        }
        // Without a core texture, the slot configuration of the core loader is applied here.
        if (textures.normal) {
            textures.normal.level = material.normalTexture?.scale ?? 1;
            babylonMaterial.bumpTexture = textures.normal;
            const rightHanded = this._loader.babylonScene.useRightHandedSystem;
            babylonMaterial.invertNormalMapX = !rightHanded;
            babylonMaterial.invertNormalMapY = rightHanded;
        }
        if (textures.orm) {
            if (replaces("occlusionTexture")) {
                babylonMaterial.ambientTexture = textures.orm;
                babylonMaterial.useAmbientInGrayScale = true;
                babylonMaterial.ambientTextureStrength = material.occlusionTexture?.strength ?? 1;
            }
            if (replaces("metallicRoughnessTexture")) {
                babylonMaterial.metallicTexture = textures.orm;
                babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
            }
        }
        this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
    }

    private async _applyV4Async(
        context: string,
        extensionContext: string,
        material: IMaterial,
        babylonMaterial: PBRMaterial,
        extension: IBabylonMaterialsNeuralTexture,
        layout: INeuralV4Layout,
        latents: BaseTexture[],
        textureOrder: number[],
        half: Uint16Array,
        replaces: (slot: string) => boolean,
        required: boolean,
        timing: ReturnType<typeof CreateNeuralTextureTiming> | undefined,
        materialStart: number
    ): Promise<void> {
        const scene = this._loader.babylonScene;
        const container = this._loader._assetContainer;
        const packedWeights = PackNeuralV4WeightTexture(layout, half);
        const weightsTexture = CreateNeuralV4WeightsTexture(scene, packedWeights, container);
        if (this.decodeInShader) {
            const start = timing ? performance.now() : 0;
            this._assignPlaceholders(context, material, babylonMaterial, replaces);
            // The weights texture is sampled at runtime, so it is a loaded texture of the asset.
            this._loader.parent.onTextureLoadedObservable.notifyObservers(weightsTexture);
            new NeuralTextureV4MaterialPlugin(babylonMaterial, extension, layout, latents, weightsTexture, packedWeights, this.runtimeFilter, this.lodBias, timing, {
                weights: this.runtimeWeights,
                precision: this.runtimePrecision,
            });
            timing?.("shaderPluginAndPlaceholderCreation", start);
            timing?.("materialLoad", materialStart);
            return;
        }
        let baked: Nullable<INeuralTextureBaked> = null;
        try {
            baked = await BakeNeuralV4Async(scene, extension, layout, latents, weightsTexture, this.bakeMips, container, () => this._disposed, timing);
        } catch (error) {
            if (!this.allowCPUFallback || this._disposed || scene.isDisposed) {
                weightsTexture.dispose();
                throw error;
            }
            Logger.Warn(`${extensionContext}: GPU bake failed; using the optional CPU fallback (${String(error)})`);
        }
        weightsTexture.dispose();
        if (baked) {
            this._assignNeuralTextures(context, material, babylonMaterial, baked, replaces);
            timing?.("materialLoad", materialStart);
            return;
        }
        if (!this.allowCPUFallback) {
            const message = `${extensionContext}: GPU baking is unavailable (requires WebGL 2 or WebGPU compute); opt into allowCPUFallback to use CPU decoding`;
            if (required) {
                throw new Error(message);
            }
            // The core textures are already loaded.
            Logger.Warn(`${message}; using fallback textures`);
            return;
        }
        const read = await Promise.all(
            latents.map(async (latent) => {
                const pixels = await latent.readPixels();
                if (!(pixels instanceof Uint8Array)) {
                    throw new Error(`${extensionContext}: Cannot read RGBA8 latent data`);
                }
                return { data: pixels, ...latent.getSize() };
            })
        );
        // The latents follow the shader texture order; the CPU decoder indexes atlases by glTF latent index.
        const atlases: INeuralV4Atlas[] = [];
        textureOrder.forEach((index, i) => (atlases[index] = read[i]));
        if (this.bakeMips === "neural") {
            Logger.Warn(`${extensionContext}: The CPU fallback decodes only the base level; its mips are generated instead of decoded per mip`);
        }
        const groups: Array<[NeuralV4Group, string[], boolean]> = [
            ["baseColor", ["baseColorTexture"], true],
            ["normal", ["normalTexture"], false],
            ["orm", ["occlusionTexture", "metallicRoughnessTexture"], false],
            ["emissive", ["emissiveTexture"], true],
            ["diffuse", [DiffuseSlot], true],
            ["specGloss", [SpecularGlossinessSlot], true],
        ];
        const needed = groups.filter(([, slots]) => slots.some(replaces));
        const decoded = await DecodeNeuralV4Async(
            layout,
            extension.outputs,
            needed.map(([group]) => group),
            atlases,
            ExpandNeuralV4Weights(layout, half),
            () => this._disposed
        );
        const cpuBaked: INeuralTextureBaked = {};
        for (const [group, , gammaSpace] of needed) {
            cpuBaked[group] = this._createTexture(decoded[group]!, layout.width, layout.height, gammaSpace, `${babylonMaterial.name} (Neural ${group})`);
        }
        this._assignNeuralTextures(context, material, babylonMaterial, cpuBaked, replaces, false);
    }

    private _createTexture(data: Uint8Array, width: number, height: number, gammaSpace: boolean, name: string): RawTexture {
        const scene = this._loader.babylonScene;
        const container = this._loader._assetContainer;
        const texture = scene._executeWithBlockedEntityCollection(!!container, () => RawTexture.CreateRGBATexture(data, width, height, scene, true, false));
        texture._parentContainer = container;
        texture.gammaSpace = gammaSpace;
        texture.wrapU = texture.wrapV = Texture.WRAP_ADDRESSMODE;
        texture.name = name;
        this._loader.parent.onTextureLoadedObservable.notifyObservers(texture);
        return texture;
    }
}

/** Registers the experimental neural texture loader extension. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterBABYLON_materials_neural_texture(): void {
    unregisterGLTFExtension(NAME);
    registerGLTFExtension(NAME, true, (loader) => new BABYLON_materials_neural_texture(loader));
}
