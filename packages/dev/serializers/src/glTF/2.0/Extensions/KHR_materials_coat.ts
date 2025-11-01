import type { IMaterial, IKHRMaterialsCoat } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { MergeTexturesAsync, CreateRGBAConfiguration, CreateTextureInput, CreateConstantInput } from "core/Materials/Textures/textureMerger";
import { Texture } from "core/Materials/Textures/texture";
import type { Nullable } from "core/types";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";

const NAME = "KHR_materials_coat";

// Convert OpenPBR anisotropy values to glTF-compatible values
function OpenpbrAnisotropyStrengthToGltf(baseRoughness: number, anisotropy: number) {
    const baseAlpha = baseRoughness * baseRoughness;
    const roughnessT = baseAlpha * Math.sqrt(2.0 / (1.0 + (1 - anisotropy) * (1 - anisotropy)));
    const roughnessB = (1 - anisotropy) * roughnessT;
    const newBaseRoughness = Math.sqrt(roughnessB);
    const newAnisotropyStrength = Math.min(Math.sqrt((roughnessT - baseAlpha) / Math.max(1.0 - baseAlpha, 0.0001)), 1.0);

    return { newBaseRoughness, newAnisotropyStrength };
}

/**
 * Generate a unique ID for the merged anisotropy textures based on the internal texture data.
 * This is used for caching merged textures.
 * @param babylonMaterial Source OpenPBR material
 * @returns A unique ID string for the merged anisotropy textures
 * @internal
 */
function GetAnisoTextureId(babylonMaterial: OpenPBRMaterial): string {
    const anisoStrengthTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessAnisotropyTexture;
    const tangentTexture = babylonMaterial.geometryCoatTangentTexture;
    const strengthId = anisoStrengthTexture && anisoStrengthTexture.getInternalTexture() ? anisoStrengthTexture!.getInternalTexture()!.uniqueId : "NoStrength";
    const tangentId = tangentTexture && tangentTexture.getInternalTexture() ? tangentTexture!.getInternalTexture()!.uniqueId : "NoTangent";
    return `${strengthId}_${tangentId}`;
}

/**
 * Generate a unique ID for the merged coat textures based on the internal texture data.
 * This is used for caching merged textures.
 * @param babylonMaterial Source OpenPBR material
 * @returns A unique ID string for the merged coat textures
 * @internal
 */
function GetCoatTextureId(babylonMaterial: OpenPBRMaterial): string {
    const coatTexture: Nullable<BaseTexture> = babylonMaterial.coatWeightTexture;
    const coatId = coatTexture && coatTexture.getInternalTexture() ? coatTexture!.getInternalTexture()!.uniqueId : "NoCoat";
    const coatRoughnessTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessTexture;
    const roughnessId = coatRoughnessTexture && coatRoughnessTexture.getInternalTexture() ? coatRoughnessTexture!.getInternalTexture()!.uniqueId : "NoRoughness";
    return `${coatId}_${roughnessId}`;
}

/**
 * Creates a new texture with the anisotropy data merged together for export.
 * @param babylonMaterial The source OpenPBR material
 * @returns A new texture with the merged anisotropy data
 * @internal
 */
async function CreateMergedAnisotropyTexture(babylonMaterial: OpenPBRMaterial): Promise<Nullable<BaseTexture>> {
    const scene = babylonMaterial.getScene();

    const anisoStrengthTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessAnisotropyTexture;
    const tangentTexture = babylonMaterial.geometryCoatTangentTexture;

    // If we don't have any textures, we don't need to generate anything.
    if (!(anisoStrengthTexture || tangentTexture)) {
        return null;
    }

    return await MergeTexturesAsync(
        "AnisotropyTexture",
        CreateRGBAConfiguration(
            tangentTexture ? CreateTextureInput(tangentTexture, 0) : CreateConstantInput(1.0), // tangent x from red channel
            tangentTexture ? CreateTextureInput(tangentTexture, 1) : CreateConstantInput(0.0), // tangent y from green channel
            anisoStrengthTexture ? CreateTextureInput(anisoStrengthTexture, 0) : CreateConstantInput(1.0) // Anisotropy from red channel
        ),
        scene
    );
}

/**
 * Using the coat weight and coat roughness textures, create a merged internal texture that can be used
 * for multiple textures (with potentially different transforms) on export.
 * @param babylonMaterial The source OpenPBR material
 * @returns A new, internal texture with the coat weight in the red channel and coat roughness in the green channel
 * @internal
 */
async function CreateMergedCoatInternalTextureAsync(babylonMaterial: OpenPBRMaterial): Promise<Nullable<InternalTexture>> {
    const scene = babylonMaterial.getScene();
    const coatTexture: Nullable<BaseTexture> = babylonMaterial.coatWeightTexture;
    const coatRoughnessTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessTexture;
    // If we don't have any textures, we don't need to generate anything.
    if (!(coatTexture || coatRoughnessTexture)) {
        return null;
    }

    const texture = await MergeTexturesAsync(
        "CoatTexture",
        CreateRGBAConfiguration(
            coatTexture ? CreateTextureInput(coatTexture, 0) : CreateConstantInput(1.0), // coat weight from red channel
            // coat roughness goes in the green channel but may come from red or green channels in the source
            coatRoughnessTexture ? CreateTextureInput(coatRoughnessTexture, babylonMaterial._useCoatRoughnessFromGreenChannel ? 1 : 0) : CreateConstantInput(1.0)
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
export class KHR_materials_coat implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: GLTFExporter;

    private _wasUsed = false;

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

    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];
        if (babylonMaterial instanceof PBRBaseMaterial) {
            if (babylonMaterial.clearCoat.isEnabled) {
                if (babylonMaterial.clearCoat.texture) {
                    additionalTextures.push(babylonMaterial.clearCoat.texture);
                }
                if (!babylonMaterial.clearCoat.useRoughnessFromMainTexture && babylonMaterial.clearCoat.textureRoughness) {
                    additionalTextures.push(babylonMaterial.clearCoat.textureRoughness);
                }
                if (babylonMaterial.clearCoat.bumpTexture) {
                    additionalTextures.push(babylonMaterial.clearCoat.bumpTexture);
                }
                if (babylonMaterial.clearCoat.tintTexture) {
                    additionalTextures.push(babylonMaterial.clearCoat.tintTexture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.coatWeight > 0) {
                // We will merge the coat_weight and coat_roughness textures, if needed.
                // However, we want to retain the original texture's transforms and sampling info.
                let coatNeedsMerge = false;
                if (babylonMaterial.coatWeightTexture) {
                    // If we don't have a coat_roughness texture or if the coat_weight and coat_roughness
                    // textures are already merged, export them as-is.
                    if (!babylonMaterial.coatRoughnessTexture) {
                        additionalTextures.push(babylonMaterial.coatWeightTexture);
                    } else if (
                        babylonMaterial._useCoatRoughnessFromGreenChannel &&
                        babylonMaterial.coatWeightTexture.getInternalTexture() === babylonMaterial.coatRoughnessTexture.getInternalTexture()
                    ) {
                        additionalTextures.push(babylonMaterial.coatWeightTexture);
                        additionalTextures.push(babylonMaterial.coatRoughnessTexture);
                    } else {
                        coatNeedsMerge = true;
                    }
                } else if (babylonMaterial.coatRoughnessTexture) {
                    if (babylonMaterial._useCoatRoughnessFromGreenChannel) {
                        additionalTextures.push(babylonMaterial.coatRoughnessTexture);
                    } else {
                        coatNeedsMerge = true;
                    }
                }
                if (coatNeedsMerge) {
                    // Merge the two textures together but retain the transforms for each.
                    // We do this by caching the internal texture that is created during the merge,
                    // and then creating temporary textures that use that internal texture but
                    // have the original texture's transforms/sampling info.
                    const texId = GetCoatTextureId(babylonMaterial);
                    if (!this._cachedInternalTexturesMap[texId]) {
                        const internalTexture = await CreateMergedCoatInternalTextureAsync(babylonMaterial);
                        if (internalTexture) {
                            this._cachedInternalTexturesMap[texId] = internalTexture;
                        }
                    }
                    if (this._cachedInternalTexturesMap[texId]) {
                        if (babylonMaterial.coatWeightTexture) {
                            this._mergedTexturesMap[babylonMaterial.coatWeightTexture.uniqueId] = CreateTempTexture(
                                this._cachedInternalTexturesMap[texId],
                                babylonMaterial.coatWeightTexture
                            );
                            additionalTextures.push(this._mergedTexturesMap[babylonMaterial.coatWeightTexture.uniqueId]);
                        }
                        if (babylonMaterial.coatRoughnessTexture) {
                            this._mergedTexturesMap[babylonMaterial.coatRoughnessTexture.uniqueId] = CreateTempTexture(
                                this._cachedInternalTexturesMap[texId],
                                babylonMaterial.coatRoughnessTexture
                            );
                            additionalTextures.push(this._mergedTexturesMap[babylonMaterial.coatRoughnessTexture.uniqueId]);
                        }
                    }
                }

                if (babylonMaterial.geometryCoatNormalTexture) {
                    additionalTextures.push(babylonMaterial.geometryCoatNormalTexture);
                }

                if (babylonMaterial.coatColorTexture) {
                    additionalTextures.push(babylonMaterial.coatColorTexture);
                }
                if (babylonMaterial.coatRoughnessAnisotropy > 0) {
                    const texId = GetAnisoTextureId(babylonMaterial);
                    if (this._mergedTexturesMap[texId]) {
                        additionalTextures.push(this._mergedTexturesMap[texId]);
                    } else {
                        const anisoTexture = await CreateMergedAnisotropyTexture(babylonMaterial);
                        if (anisoTexture) {
                            additionalTextures.push(anisoTexture);
                            this._mergedTexturesMap[texId] = anisoTexture;
                        }
                    }
                    return additionalTextures;
                }
                return additionalTextures;
            }
        }

        return [];
    }

    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRBaseMaterial) {
                if (!babylonMaterial.clearCoat.isEnabled) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                node.extensions = node.extensions || {};

                const coatTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.texture);
                let coatTextureRoughnessInfo;
                if (babylonMaterial.clearCoat.useRoughnessFromMainTexture) {
                    coatTextureRoughnessInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.texture);
                } else {
                    coatTextureRoughnessInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.textureRoughness);
                }

                let coatColorTextureInfo;
                if (babylonMaterial.clearCoat.isTintEnabled) {
                    coatColorTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.tintTexture);
                }

                const coatNormalTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.bumpTexture);
                const coatIor: number = babylonMaterial.clearCoat.indexOfRefraction;

                const coatInfo: IKHRMaterialsCoat = {
                    coatFactor: babylonMaterial.clearCoat.intensity,
                    coatTexture: coatTextureInfo ?? undefined,
                    coatRoughnessFactor: babylonMaterial.clearCoat.roughness,
                    coatRoughnessTexture: coatTextureRoughnessInfo ?? undefined,
                    coatNormalTexture: coatNormalTextureInfo ?? undefined,
                    coatColorFactor: babylonMaterial.clearCoat.tintColor.asArray(),
                    coatColorTexture: coatColorTextureInfo ?? undefined,
                    coatIor: coatIor !== 1.5 ? coatIor : undefined,
                };

                if (coatInfo.coatTexture !== null || coatInfo.coatRoughnessTexture !== null || coatInfo.coatRoughnessTexture !== null || coatInfo.coatColorTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = coatInfo;
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                if (babylonMaterial.coatWeight == 0.0) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                node.extensions = node.extensions || {};

                let coatWeightTexture: Nullable<BaseTexture> = null;
                let coatTextureInfo;
                if (babylonMaterial.coatWeightTexture) {
                    if (this._mergedTexturesMap[babylonMaterial.coatWeightTexture.uniqueId]) {
                        coatWeightTexture = this._mergedTexturesMap[babylonMaterial.coatWeightTexture.uniqueId];
                    } else {
                        coatWeightTexture = babylonMaterial.coatWeightTexture;
                    }
                    coatTextureInfo = this._exporter._materialExporter.getTextureInfo(coatWeightTexture);
                }

                let coatRoughnessTexture: Nullable<BaseTexture> = null;
                let coatRoughnessTextureInfo;
                if (babylonMaterial.coatRoughnessTexture) {
                    if (this._mergedTexturesMap[babylonMaterial.coatRoughnessTexture.uniqueId]) {
                        coatRoughnessTexture = this._mergedTexturesMap[babylonMaterial.coatRoughnessTexture.uniqueId];
                    } else {
                        coatRoughnessTexture = babylonMaterial.coatRoughnessTexture;
                    }
                    coatRoughnessTextureInfo = this._exporter._materialExporter.getTextureInfo(coatRoughnessTexture);
                }

                const coatNormalTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.geometryCoatNormalTexture);
                const coatColorTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.coatColorTexture);
                const coatIor: number = babylonMaterial.coatIor;
                const coatDarkeningFactor = babylonMaterial.coatDarkening;

                // Check if we can convert from OpenPBR anisotropy to glTF anisotropy
                // Conversion involves both specular roughness and anisotropic roughness changes so,
                // if there are textures for either, we can't reliably convert due to there potentially
                // being different mappings between the textures.
                const roughnessTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessTexture;
                const texId = GetAnisoTextureId(babylonMaterial);
                const mergedAnisoTexture = this._mergedTexturesMap[texId];
                let coatAnisotropyStrength = 0;
                let coatAnisotropyRotation = 0;
                let coatAnisotropyTexture = undefined;
                if (babylonMaterial.coatRoughnessAnisotropy > 0.0) {
                    // If no textures are being used, we'll always output glTF-style anisotropy.
                    // If using OpenPBR anisotropy, convert the constants. Otherwise, just export what we have.
                    if (!roughnessTexture && !mergedAnisoTexture) {
                        // Convert constants
                        let newBaseRoughness = babylonMaterial.coatRoughness;
                        let newAnisotropyStrength = babylonMaterial.coatRoughnessAnisotropy;
                        if (!babylonMaterial._useGltfStyleAnisotropy) {
                            const newParams = OpenpbrAnisotropyStrengthToGltf(babylonMaterial.coatRoughness, babylonMaterial.coatRoughnessAnisotropy);
                            newBaseRoughness = newParams.newBaseRoughness;
                            newAnisotropyStrength = newParams.newAnisotropyStrength;
                        }
                        if (node.pbrMetallicRoughness) {
                            node.pbrMetallicRoughness.roughnessFactor = newBaseRoughness;
                        }
                        coatAnisotropyStrength = newAnisotropyStrength;
                        coatAnisotropyRotation = babylonMaterial.geometryCoatTangentAngle + Math.PI * 0.5;
                        coatAnisotropyTexture = undefined;
                    } else {
                        const mergedAnisoTextureInfo = mergedAnisoTexture ? this._exporter._materialExporter.getTextureInfo(mergedAnisoTexture) : null;

                        coatAnisotropyStrength = babylonMaterial.coatRoughnessAnisotropy;
                        coatAnisotropyRotation = babylonMaterial.geometryCoatTangentAngle;
                        coatAnisotropyTexture = mergedAnisoTextureInfo ? mergedAnisoTextureInfo : undefined;
                    }

                    if (!babylonMaterial._useGltfStyleAnisotropy) {
                        // Enable OpenPBR extension on this material.
                        node.extensions!["KHR_materials_openpbr"] = {};
                        this._exporter._glTF.extensionsUsed ||= [];
                        if (this._exporter._glTF.extensionsUsed.indexOf("KHR_materials_openpbr") === -1) {
                            this._exporter._glTF.extensionsUsed.push("KHR_materials_openpbr");
                        }
                    }
                }

                const coatInfo: IKHRMaterialsCoat = {
                    coatFactor: babylonMaterial.coatWeight,
                    coatTexture: coatTextureInfo ?? undefined,
                    coatRoughnessFactor: babylonMaterial.coatRoughness,
                    coatRoughnessTexture: coatRoughnessTextureInfo ?? undefined,
                    coatNormalTexture: coatNormalTextureInfo ?? undefined,
                    coatColorFactor: babylonMaterial.coatColor.asArray(),
                    coatColorTexture: coatColorTextureInfo ?? undefined,
                    coatIor: coatIor !== 1.5 ? coatIor : undefined,
                    coatDarkeningFactor: coatDarkeningFactor !== 1.0 ? coatDarkeningFactor : undefined,
                    coatAnisotropyRotation: coatAnisotropyRotation,
                    coatAnisotropyStrength: coatAnisotropyStrength,
                    coatAnisotropyTexture: coatAnisotropyTexture,
                };

                if (
                    coatInfo.coatTexture !== null ||
                    coatInfo.coatRoughnessTexture !== null ||
                    coatInfo.coatRoughnessTexture !== null ||
                    coatInfo.coatAnisotropyTexture !== null ||
                    coatInfo.coatColorTexture !== null
                ) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = coatInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_coat(exporter));
