import type { IMaterial, IKHRMaterialsClearcoatAnisotropy } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import type { Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import type { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { MergeTexturesAsync, CreateRGBAConfiguration, CreateTextureInput, CreateConstantInput } from "core/Materials/Textures/textureMerger";

const NAME = "KHR_materials_clearcoat_anisotropy";

// Convert OpenPBR anisotropy values to glTF-compatible values
function OpenpbrAnisotropyStrengthToGltf(baseRoughness: number, anisotropy: number) {
    const baseAlpha = baseRoughness * baseRoughness;
    const roughnessT = baseAlpha * Math.sqrt(2.0 / (1.0 + (1 - anisotropy) * (1 - anisotropy)));
    const roughnessB = (1 - anisotropy) * roughnessT;
    const newBaseRoughness = Math.sqrt(roughnessB);
    const newAnisotropyStrength = Math.min(Math.sqrt((roughnessT - baseAlpha) / Math.max(1.0 - baseAlpha, 0.0001)), 1.0);

    return { newBaseRoughness, newAnisotropyStrength };
}

function GetAnisoTextureId(babylonMaterial: OpenPBRMaterial): string {
    const anisoStrengthTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessAnisotropyTexture;
    const tangentTexture = babylonMaterial.geometryCoatTangentTexture;
    const strengthId = anisoStrengthTexture && anisoStrengthTexture.getInternalTexture() ? anisoStrengthTexture!.getInternalTexture()!.uniqueId : "NoStrength";
    const tangentId = tangentTexture && tangentTexture.getInternalTexture() ? tangentTexture!.getInternalTexture()!.uniqueId : "NoTangent";
    return `${strengthId}_${tangentId}`;
}

// In your postExportMaterialAsync method:
async function CreateMergedAnisotropyTexture(babylonMaterial: OpenPBRMaterial): Promise<Nullable<ProceduralTexture>> {
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
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_clearcoat_anisotropy implements IGLTFExporterExtensionV2 {
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
        if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.coatRoughnessAnisotropy > 0) {
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
            if (babylonMaterial instanceof OpenPBRMaterial) {
                if (babylonMaterial.coatRoughnessAnisotropy > 0) {
                    // This material must have the clearcoat extension already before
                    // we can add the clearcoat anisotropy sub-extension
                    node.extensions = node.extensions || {};
                    const parentExt = node.extensions ? node.extensions["KHR_materials_clearcoat"] : null;
                    if (!parentExt) {
                        return resolve(node);
                    }
                    this._wasUsed = true;

                    // Check if we can convert from OpenPBR anisotropy to glTF anisotropy
                    // Conversion involves both specular roughness and anisotropic roughness changes so,
                    // if there are textures for either, we can't reliably convert due to there potentially
                    // being different mappings between the textures.
                    const roughnessTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessTexture;
                    const mergedAnisoTexture = this._anisoTexturesMap[babylonMaterial.id];

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
                        const anisotropyInfo: IKHRMaterialsClearcoatAnisotropy = {
                            clearcoatAnisotropyStrength: newAnisotropyStrength,
                            clearcoatAnisotropyRotation: babylonMaterial.geometryCoatTangentAngle + Math.PI * 0.5,
                            clearcoatAnisotropyTexture: undefined,
                        };
                        parentExt.extensions = parentExt.extensions || {};
                        parentExt.extensions[NAME] = anisotropyInfo;
                        return resolve(node);
                    }

                    const mergedAnisoTextureInfo = mergedAnisoTexture ? this._exporter._materialExporter.getTextureInfo(mergedAnisoTexture) : null;

                    const anisotropyInfo: IKHRMaterialsClearcoatAnisotropy = {
                        clearcoatAnisotropyStrength: babylonMaterial.coatRoughnessAnisotropy,
                        clearcoatAnisotropyRotation: babylonMaterial.geometryCoatTangentAngle,
                        clearcoatAnisotropyTexture: mergedAnisoTextureInfo ? mergedAnisoTextureInfo : undefined,
                        extensions: {},
                    };

                    if (!babylonMaterial._useGltfStyleAnisotropy) {
                        anisotropyInfo.extensions!["EXT_materials_anisotropy_openpbr"] = {
                            openPbrAnisotropyEnabled: true,
                        };
                        this._exporter._glTF.extensionsUsed ||= [];
                        if (this._exporter._glTF.extensionsUsed.indexOf("EXT_materials_anisotropy_openpbr") === -1) {
                            this._exporter._glTF.extensionsUsed.push("EXT_materials_anisotropy_openpbr");
                        }
                    }

                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);

                    parentExt.extensions = parentExt.extensions || {};
                    parentExt.extensions[NAME] = anisotropyInfo;
                }
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_clearcoat_anisotropy(exporter), 105);
