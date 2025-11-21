import type { IMaterial, IKHRMaterialsClearcoat } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

import { Tools } from "core/Misc/tools";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";
import { MergeTexturesAsync, CreateRGBAConfiguration, CreateTextureInput, CreateConstantInput } from "core/Materials/Textures/textureMerger";
import type { Nullable } from "core/types";

const NAME = "KHR_materials_clearcoat";

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
export class KHR_materials_clearcoat implements IGLTFExporterExtensionV2 {
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

                const clearCoatTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.texture);
                let clearCoatTextureRoughnessInfo;
                if (babylonMaterial.clearCoat.useRoughnessFromMainTexture) {
                    clearCoatTextureRoughnessInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.texture);
                } else {
                    clearCoatTextureRoughnessInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.textureRoughness);
                }

                if (babylonMaterial.clearCoat.isTintEnabled) {
                    Tools.Warn(`Clear Color tint is not supported for glTF export. Ignoring for: ${babylonMaterial.name}`);
                }

                if (babylonMaterial.clearCoat.remapF0OnInterfaceChange) {
                    Tools.Warn(`Clear Color F0 remapping is not supported for glTF export. Ignoring for: ${babylonMaterial.name}`);
                }

                const clearCoatNormalTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.bumpTexture);

                const clearCoatInfo: IKHRMaterialsClearcoat = {
                    clearcoatFactor: babylonMaterial.clearCoat.intensity,
                    clearcoatTexture: clearCoatTextureInfo ?? undefined,
                    clearcoatRoughnessFactor: babylonMaterial.clearCoat.roughness,
                    clearcoatRoughnessTexture: clearCoatTextureRoughnessInfo ?? undefined,
                    clearcoatNormalTexture: clearCoatNormalTextureInfo ?? undefined,
                };

                if (clearCoatInfo.clearcoatTexture !== null || clearCoatInfo.clearcoatRoughnessTexture !== null || clearCoatInfo.clearcoatRoughnessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = clearCoatInfo;
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
                    coatWeightTexture = this._mergedTexturesMap[babylonMaterial.coatWeightTexture.uniqueId];
                    coatTextureInfo = this._exporter._materialExporter.getTextureInfo(coatWeightTexture);
                }

                let coatRoughnessTexture: Nullable<BaseTexture> = null;
                let coatRoughnessTextureInfo;
                if (babylonMaterial.coatRoughnessTexture) {
                    coatRoughnessTexture = this._mergedTexturesMap[babylonMaterial.coatRoughnessTexture.uniqueId];
                    coatRoughnessTextureInfo = this._exporter._materialExporter.getTextureInfo(coatRoughnessTexture);
                }

                if (babylonMaterial.coatColorTexture) {
                    Tools.Warn(`Clear Color tint is not supported for glTF export. Ignoring for: ${babylonMaterial.name}`);
                }

                const clearCoatNormalTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.geometryCoatNormalTexture);

                const clearCoatInfo: IKHRMaterialsClearcoat = {
                    clearcoatFactor: babylonMaterial.coatWeight,
                    clearcoatTexture: coatTextureInfo ?? undefined,
                    clearcoatRoughnessFactor: babylonMaterial.coatRoughness,
                    clearcoatRoughnessTexture: coatRoughnessTextureInfo ?? undefined,
                    clearcoatNormalTexture: clearCoatNormalTextureInfo ?? undefined,
                };

                if (clearCoatInfo.clearcoatTexture !== null || clearCoatInfo.clearcoatRoughnessTexture !== null || clearCoatInfo.clearcoatRoughnessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = clearCoatInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_clearcoat(exporter));
