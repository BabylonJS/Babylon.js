import type { IMaterial, IKHRMaterialsFuzz } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { MergeTexturesAsync, CreateRGBAConfiguration, CreateTextureInput, CreateConstantInput } from "core/Materials/Textures/textureMerger";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";

const NAME = "KHR_materials_fuzz";

/**
 * Generate a unique ID for the merged coat textures based on the internal texture data.
 * This is used for caching merged textures.
 * @param babylonMaterial Source OpenPBR material
 * @returns A unique ID string for the merged coat textures
 * @internal
 */
function GetFuzzColorTextureId(babylonMaterial: OpenPBRMaterial): string {
    const fuzzColorTexture: Nullable<BaseTexture> = babylonMaterial.fuzzColorTexture;
    const fuzzColorId = fuzzColorTexture && fuzzColorTexture.getInternalTexture() ? fuzzColorTexture!.getInternalTexture()!.uniqueId : "NoFuzzColor";
    const fuzzRoughnessTexture: Nullable<BaseTexture> = babylonMaterial.fuzzRoughnessTexture;
    const fuzzRoughnessId = fuzzRoughnessTexture && fuzzRoughnessTexture.getInternalTexture() ? fuzzRoughnessTexture!.getInternalTexture()!.uniqueId : "NoFuzzRoughness";
    return `FuzzColor_${fuzzColorId}_FuzzRoughness_${fuzzRoughnessId}`;
}

/**
 * Using the coat weight and coat roughness textures, create a merged internal texture that can be used
 * for multiple textures (with potentially different transforms) on export.
 * @param babylonMaterial The source OpenPBR material
 * @returns A new, internal texture with the coat weight in the red channel and coat roughness in the green channel
 * @internal
 */
async function CreateMergedFuzzInternalTexture(babylonMaterial: OpenPBRMaterial): Promise<Nullable<InternalTexture>> {
    const scene = babylonMaterial.getScene();
    const fuzzColorTexture: Nullable<BaseTexture> = babylonMaterial.fuzzColorTexture;
    const fuzzRoughnessTexture: Nullable<BaseTexture> = babylonMaterial.fuzzRoughnessTexture;
    // If we don't have any textures, we don't need to generate anything.
    if (!(fuzzColorTexture || fuzzRoughnessTexture)) {
        return null;
    }

    const texture = await MergeTexturesAsync(
        "FuzzTexture",
        CreateRGBAConfiguration(
            fuzzColorTexture ? CreateTextureInput(fuzzColorTexture, 0) : CreateConstantInput(1.0), // fuzz color from red channel
            fuzzColorTexture ? CreateTextureInput(fuzzColorTexture, 1) : CreateConstantInput(1.0), // fuzz color from green channel
            fuzzColorTexture ? CreateTextureInput(fuzzColorTexture, 2) : CreateConstantInput(1.0), // fuzz color from blue channel
            // fuzz roughness goes in the alpha channel but may come from red or alpha channels in the source
            fuzzRoughnessTexture ? CreateTextureInput(fuzzRoughnessTexture, babylonMaterial._useFuzzRoughnessFromTextureAlpha ? 3 : 0) : CreateConstantInput(1.0)
        ),
        scene
    );

    return texture.getInternalTexture();
}

/**
 * Creates a temporary texture based on the source texture.
 * @param internalTexture The source internal texture
 * @param sourceTexture The source of the new texture's name, and sampler info
 * @returns The new texture
 */
function CreateTempTexture(internalTexture: InternalTexture, sourceTexture: BaseTexture): Texture {
    const tempTexture = new Texture(sourceTexture.name, sourceTexture.getScene());
    tempTexture._texture = internalTexture;
    tempTexture.coordinatesIndex = sourceTexture.coordinatesIndex;
    if (sourceTexture instanceof Texture) {
        tempTexture.uOffset = sourceTexture.uOffset;
        tempTexture.vOffset = sourceTexture.vOffset;
        tempTexture.uScale = sourceTexture.uScale;
        tempTexture.vScale = sourceTexture.vScale;
        tempTexture.wAng = sourceTexture.wAng;
    }
    tempTexture.wrapU = sourceTexture.wrapU;
    tempTexture.wrapV = sourceTexture.wrapV;
    return tempTexture;
}

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_fuzz implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    private _exporter: GLTFExporter;

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    /**
     * Cache that holds temporary merged textures created during export
     */
    private _mergedTexturesMap: Record<string, BaseTexture> = {};

    /**
     * Cache that holds internal textures of merged textures created during export
     */
    private _cachedInternalTexturesMap: Record<string, InternalTexture> = {};

    public dispose() {
        for (const key of Object.keys(this._mergedTexturesMap)) {
            const texture = this._mergedTexturesMap[key];
            texture.dispose();
        }
        this._mergedTexturesMap = {};
        for (const key of Object.keys(this._cachedInternalTexturesMap)) {
            const internalTexture = this._cachedInternalTexturesMap[key];
            internalTexture.dispose();
        }
        this._cachedInternalTexturesMap = {};
    }

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    public async postExportMaterialAdditionalTexturesAsync(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        if (babylonMaterial instanceof OpenPBRMaterial) {
            const additionalTextures: BaseTexture[] = [];
            if (babylonMaterial.fuzzWeight > 0.0) {
                if (babylonMaterial.fuzzWeightTexture) {
                    additionalTextures.push(babylonMaterial.fuzzWeightTexture);
                }
                let fuzzTexturesNeedMerge = false;
                if (babylonMaterial.fuzzRoughnessTexture) {
                    if (babylonMaterial._useFuzzRoughnessFromTextureAlpha) {
                        additionalTextures.push(babylonMaterial.fuzzRoughnessTexture);
                    } else {
                        fuzzTexturesNeedMerge = true;
                    }
                }
                if (babylonMaterial.fuzzColorTexture && !fuzzTexturesNeedMerge) {
                    additionalTextures.push(babylonMaterial.fuzzColorTexture);
                }
                if (fuzzTexturesNeedMerge) {
                    const texId = GetFuzzColorTextureId(babylonMaterial);
                    if (!this._cachedInternalTexturesMap[texId]) {
                        const mergedInternalTexture = await CreateMergedFuzzInternalTexture(babylonMaterial);
                        if (mergedInternalTexture) {
                            this._cachedInternalTexturesMap[texId] = mergedInternalTexture;
                        }
                    }
                    if (this._cachedInternalTexturesMap[texId]) {
                        if (babylonMaterial.fuzzColorTexture) {
                            this._mergedTexturesMap[babylonMaterial.fuzzColorTexture.uniqueId] = CreateTempTexture(
                                this._cachedInternalTexturesMap[texId],
                                babylonMaterial.fuzzColorTexture
                            );
                            additionalTextures.push(this._mergedTexturesMap[babylonMaterial.fuzzColorTexture.uniqueId]);
                        }
                        if (babylonMaterial.fuzzRoughnessTexture) {
                            this._mergedTexturesMap[babylonMaterial.fuzzRoughnessTexture.uniqueId] = CreateTempTexture(
                                this._cachedInternalTexturesMap[texId],
                                babylonMaterial.fuzzRoughnessTexture
                            );
                            additionalTextures.push(this._mergedTexturesMap[babylonMaterial.fuzzRoughnessTexture.uniqueId]);
                        }
                    }
                }
            }
            return additionalTextures;
        }

        return [];
    }

    public async postExportMaterialAsync(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return await new Promise((resolve) => {
            if (babylonMaterial instanceof OpenPBRMaterial) {
                if (babylonMaterial.fuzzWeight == 0.0) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                if (node.extensions == null) {
                    node.extensions = {};
                }
                const fuzzInfo: IKHRMaterialsFuzz = {
                    fuzzFactor: babylonMaterial.fuzzWeight,
                    fuzzColorFactor: babylonMaterial.fuzzColor.asArray(),
                    fuzzRoughnessFactor: babylonMaterial.fuzzRoughness,
                };

                if (babylonMaterial.fuzzWeightTexture) {
                    fuzzInfo.fuzzTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.fuzzWeightTexture) ?? undefined;
                }

                let fuzzColorTexture: Nullable<BaseTexture> = null;
                if (babylonMaterial.fuzzColorTexture) {
                    if (this._mergedTexturesMap[babylonMaterial.fuzzColorTexture.uniqueId]) {
                        fuzzColorTexture = this._mergedTexturesMap[babylonMaterial.fuzzColorTexture.uniqueId];
                    } else {
                        fuzzColorTexture = babylonMaterial.fuzzColorTexture;
                    }
                    fuzzInfo.fuzzColorTexture = this._exporter._materialExporter.getTextureInfo(fuzzColorTexture) ?? undefined;
                }

                let fuzzRoughnessTexture: Nullable<BaseTexture> = null;
                if (babylonMaterial.fuzzRoughnessTexture) {
                    if (this._mergedTexturesMap[babylonMaterial.fuzzRoughnessTexture.uniqueId]) {
                        fuzzRoughnessTexture = this._mergedTexturesMap[babylonMaterial.fuzzRoughnessTexture.uniqueId];
                    } else {
                        fuzzRoughnessTexture = babylonMaterial.fuzzRoughnessTexture;
                    }
                    fuzzInfo.fuzzRoughnessTexture = this._exporter._materialExporter.getTextureInfo(fuzzRoughnessTexture) ?? undefined;
                }

                if (fuzzInfo.fuzzColorTexture !== null || fuzzInfo.fuzzRoughnessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = fuzzInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_fuzz(exporter));
