import { type Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Texture } from "core/Materials/Textures/texture.pure";
import { Logger } from "core/Misc/logger";
import { type Nullable } from "core/types";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader.pure";
import { type IMaterial, type ITextureInfo } from "../glTFLoaderInterfaces";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { DecodeNeuralTextureAsync, ValidateNeuralTexture, type INeuralTextureGrid } from "./neuralTextureDecoder";
import { NeuralTextureMaterialPlugin } from "./neuralTextureMaterialPlugin";
import { BakeNeuralTextureAsync, type INeuralTextureBaked } from "./neuralTextureBaker";
import { CreateNeuralTextureTiming, TrackNeuralTextureMaterialTiming } from "./neuralTextureTiming";

export { EnableNeuralTextureFileTiming } from "./neuralTextureTiming";

const NAME = "BABYLON_materials_neural_texture";

/**
 * Experimental babylon-ntc-v1 material textures: load-time GPU baking by
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

    private _loader: GLTFLoader;
    private _disposed = false;

    /** @internal */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
        this.decodeInShader = loader.parent.extensionOptions[NAME]?.decodeInShader ?? false;
        this.allowCPUFallback = loader.parent.extensionOptions[NAME]?.allowCPUFallback ?? false;
    }

    /** @internal */
    public dispose(): void {
        this._disposed = true;
    }

    /** @internal */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IBabylonMaterialsNeuralTexture>(context, material, NAME, async (extensionContext, extension) => {
            ValidateNeuralTexture(extensionContext, extension);
            const textureInfos = [
                material.pbrMetallicRoughness?.baseColorTexture,
                material.normalTexture,
                material.occlusionTexture,
                material.pbrMetallicRoughness?.metallicRoughnessTexture,
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
            if (shaderDecode && !engine.supportsUniformBuffers) {
                throw new Error(`${extensionContext}: Shader decoding requires WebGL 2 or WebGPU; disable decodeInShader to bake textures`);
            }
            const latentsPromise = Promise.all(
                extension.latentTextures.map(async (info, index) => {
                    const start = timing ? performance.now() : 0;
                    // This bypasses sRGB uploads and overrides any sampler in the file: the codec
                    // requires base-level LINEAR + REPEAT, even when the core slots use mipmaps.
                    const textureInfo: ITextureInfo = { ...info, nonColorData: true };
                    const latent = await this._loader.loadTextureInfoAsync(`${extensionContext}/latentTextures/${index}`, textureInfo);
                    latent.gammaSpace = false;
                    latent.wrapU = latent.wrapV = Texture.WRAP_ADDRESSMODE;
                    latent.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
                    const size = latent.getSize();
                    const expected = index < 2 ? extension.hiResolution : extension.loResolution;
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
                if (bytes.byteLength !== 2153 * 4) {
                    throw new Error(`${extensionContext}/weights: Expected 2153 float32 parameters`);
                }
                const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                const weights = new Float32Array(2153);
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
            // not that alternative. The original JSON and all other extensions stay intact.
            const coreMaterial =
                extension.replacedSlots.includes("metallicRoughnessTexture") && material.extensions?.KHR_materials_pbrSpecularGlossiness
                    ? { ...material, extensions: { ...material.extensions, ["KHR_materials_pbrSpecularGlossiness"]: undefined } }
                    : material;
            const [, latents, weights] = await Promise.all([this._loader.loadMaterialPropertiesAsync(context, coreMaterial, babylonMaterial), latentsPromise, weightsPromise]);
            if (shaderDecode) {
                const start = timing ? performance.now() : 0;
                // Core textures remain assigned to preserve texture defines, factors, alpha
                // handling and tangent-space setup. Only their fragment samples are replaced.
                if (extension.replacedSlots.includes("baseColorTexture") && babylonMaterial.albedoTexture) {
                    // The decoder returns encoded sRGB; ensure the PBR shader linearizes it,
                    // instead of relying on the fallback texture's hardware sRGB format.
                    babylonMaterial.albedoTexture = this._createTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, true, "Neural base color");
                    this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
                }
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
                for (const texture of Object.values(baked)) {
                    this._loader.parent.onTextureLoadedObservable.notifyObservers(texture);
                }
                if (baked.baseColor) {
                    babylonMaterial.albedoTexture = baked.baseColor;
                }
                if (baked.normal) {
                    baked.normal.level = material.normalTexture?.scale ?? 1;
                    babylonMaterial.bumpTexture = baked.normal;
                }
                if (baked.orm) {
                    if (extension.replacedSlots.includes("occlusionTexture")) {
                        babylonMaterial.ambientTexture = baked.orm;
                    }
                    if (extension.replacedSlots.includes("metallicRoughnessTexture")) {
                        babylonMaterial.metallicTexture = baked.orm;
                    }
                }
                this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
                timing?.("materialLoad", materialStart);
                return;
            }
            if (!this.allowCPUFallback) {
                throw new Error(`${extensionContext}: GPU baking is unavailable; opt into allowCPUFallback to use CPU decoding`);
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
            if (decoded.baseColor) {
                babylonMaterial.albedoTexture = this._createTexture(decoded.baseColor, width, height, true, `${babylonMaterial.name} (Neural Base Color)`);
            }
            if (decoded.normal) {
                const normal = this._createTexture(decoded.normal, width, height, false, `${babylonMaterial.name} (Neural Normal)`);
                normal.level = material.normalTexture?.scale ?? 1;
                babylonMaterial.bumpTexture = normal;
            }
            if (decoded.orm) {
                const orm = this._createTexture(decoded.orm, width, height, false, `${babylonMaterial.name} (Neural ORM)`);
                if (extension.replacedSlots.includes("occlusionTexture")) {
                    babylonMaterial.ambientTexture = orm;
                }
                if (extension.replacedSlots.includes("metallicRoughnessTexture")) {
                    babylonMaterial.metallicTexture = orm;
                }
            }
            this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
        });
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

let Registered = false;
/** Registers the experimental neural texture loader extension. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterBABYLON_materials_neural_texture(): void {
    if (Registered) {
        return;
    }
    Registered = true;
    unregisterGLTFExtension(NAME);
    registerGLTFExtension(NAME, true, (loader) => new BABYLON_materials_neural_texture(loader));
}
