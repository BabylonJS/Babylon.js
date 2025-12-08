import type { IMaterial, IKHRMaterialsAnisotropy } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import type { Nullable } from "core/types";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import type { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { MergeTexturesAsync, CreateRGBAConfiguration, CreateTextureInput, CreateConstantInput } from "core/Materials/Textures/textureMerger";

const NAME = "KHR_materials_anisotropy";

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
    const anisoStrengthTexture: Nullable<BaseTexture> = babylonMaterial.specularRoughnessAnisotropyTexture;
    const tangentTexture = babylonMaterial.geometryTangentTexture;
    const strengthId = anisoStrengthTexture && anisoStrengthTexture.getInternalTexture() ? anisoStrengthTexture!.getInternalTexture()!.uniqueId : "NoStrength";
    const tangentId = tangentTexture && tangentTexture.getInternalTexture() ? tangentTexture!.getInternalTexture()!.uniqueId : "NoTangent";
    return `${strengthId}_${tangentId}`;
}

// In your postExportMaterialAsync method:
async function CreateMergedAnisotropyTexture(babylonMaterial: OpenPBRMaterial): Promise<Nullable<ProceduralTexture>> {
    const scene = babylonMaterial.getScene();

    const anisoStrengthTexture: Nullable<BaseTexture> = babylonMaterial.specularRoughnessAnisotropyTexture;
    const tangentTexture = babylonMaterial.geometryTangentTexture;

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
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_anisotropy implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: GLTFExporter;

    private _wasUsed = false;

    private _anisoTexturesMap: Record<string, ProceduralTexture> = {};

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    /**
     * After exporting a material, deal with the additional textures
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns array of additional textures to export
     */
    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];
        if (babylonMaterial instanceof PBRBaseMaterial) {
            if (babylonMaterial.anisotropy.isEnabled && !babylonMaterial.anisotropy.legacy) {
                if (babylonMaterial.anisotropy.texture) {
                    additionalTextures.push(babylonMaterial.anisotropy.texture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.specularRoughnessAnisotropy > 0) {
                const texId = GetAnisoTextureId(babylonMaterial);
                if (this._anisoTexturesMap[texId]) {
                    additionalTextures.push(this._anisoTexturesMap[texId]);
                } else {
                    const anisoTexture = await CreateMergedAnisotropyTexture(babylonMaterial);
                    if (anisoTexture) {
                        additionalTextures.push(anisoTexture);
                        this._anisoTexturesMap[texId] = anisoTexture;
                    }
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
                if (!babylonMaterial.anisotropy.isEnabled || babylonMaterial.anisotropy.legacy) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                node.extensions = node.extensions || {};

                const anisotropyTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.anisotropy.texture);

                const anisotropyInfo: IKHRMaterialsAnisotropy = {
                    anisotropyStrength: babylonMaterial.anisotropy.intensity,
                    anisotropyRotation: babylonMaterial.anisotropy.angle,
                    anisotropyTexture: anisotropyTextureInfo ?? undefined,
                };

                if (anisotropyInfo.anisotropyTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = anisotropyInfo;
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                if (babylonMaterial.specularRoughnessAnisotropy > 0) {
                    this._wasUsed = true;

                    node.extensions = node.extensions || {};

                    // Check if we can convert from OpenPBR anisotropy to glTF anisotropy
                    // Conversion involves both specular roughness and anisotropic roughness changes so,
                    // if there are textures for either, we can't reliably convert due to there potentially
                    // being different mappings between the textures.
                    let roughnessTexture: Nullable<BaseTexture> = babylonMaterial.specularRoughnessTexture;
                    if (babylonMaterial._useRoughnessFromMetallicTextureGreen) {
                        roughnessTexture = babylonMaterial.baseMetalnessTexture;
                    }
                    const mergedAnisoTexture = this._anisoTexturesMap[babylonMaterial.id];

                    // If no textures are being used, we'll always output glTF-style anisotropy.
                    // If using OpenPBR anisotropy, convert the constants. Otherwise, just export what we have.
                    if (!roughnessTexture && !mergedAnisoTexture) {
                        // Convert constants
                        let newBaseRoughness = babylonMaterial.specularRoughness;
                        let newAnisotropyStrength = babylonMaterial.specularRoughnessAnisotropy;
                        if (!babylonMaterial._useGltfStyleAnisotropy) {
                            const newParams = OpenpbrAnisotropyStrengthToGltf(babylonMaterial.specularRoughness, babylonMaterial.specularRoughnessAnisotropy);
                            newBaseRoughness = newParams.newBaseRoughness;
                            newAnisotropyStrength = newParams.newAnisotropyStrength;
                        }
                        if (node.pbrMetallicRoughness) {
                            node.pbrMetallicRoughness.roughnessFactor = newBaseRoughness;
                        }
                        const anisotropyInfo: IKHRMaterialsAnisotropy = {
                            anisotropyStrength: newAnisotropyStrength,
                            anisotropyRotation: babylonMaterial.geometryTangentAngle + Math.PI * 0.5,
                            anisotropyTexture: undefined,
                        };
                        node.extensions[NAME] = anisotropyInfo;
                        return resolve(node);
                    }

                    const mergedAnisoTextureInfo = mergedAnisoTexture ? this._exporter._materialExporter.getTextureInfo(mergedAnisoTexture) : null;

                    const anisotropyInfo: IKHRMaterialsAnisotropy = {
                        anisotropyStrength: babylonMaterial.specularRoughnessAnisotropy,
                        anisotropyRotation: babylonMaterial.geometryTangentAngle,
                        anisotropyTexture: mergedAnisoTextureInfo ? mergedAnisoTextureInfo : undefined,
                        extensions: {},
                    };

                    if (!babylonMaterial._useGltfStyleAnisotropy) {
                        // Enable OpenPBR extension on this material.
                        node.extensions!["KHR_materials_openpbr"] = {};
                        this._exporter._glTF.extensionsUsed ||= [];
                        if (this._exporter._glTF.extensionsUsed.indexOf("KHR_materials_openpbr") === -1) {
                            this._exporter._glTF.extensionsUsed.push("KHR_materials_openpbr");
                        }
                    }

                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);

                    node.extensions[NAME] = anisotropyInfo;
                }
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_anisotropy(exporter));
