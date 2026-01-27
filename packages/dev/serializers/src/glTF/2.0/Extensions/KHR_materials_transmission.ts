import type { IMaterial, IKHRMaterialsTransmission } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Logger } from "core/Misc/logger";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";

const NAME = "KHR_materials_transmission";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_transmission/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_transmission implements IGLTFExporterExtensionV2 {
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

    /** Dispose */
    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    /**
     * After exporting a material, deal with additional textures
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns array of additional textures to export
     */
    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];

        if (babylonMaterial instanceof PBRMaterial) {
            if (this._isExtensionEnabled(babylonMaterial)) {
                if (babylonMaterial.subSurface.refractionIntensityTexture && babylonMaterial.subSurface.useGltfStyleTextures) {
                    additionalTextures.push(babylonMaterial.subSurface.refractionIntensityTexture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.transmissionWeight > 0 && babylonMaterial.transmissionWeightTexture) {
                additionalTextures.push(babylonMaterial.transmissionWeightTexture);
            }
        }

        return additionalTextures;
    }

    private _isExtensionEnabled(mat: Material): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat instanceof OpenPBRMaterial && !mat.unlit) {
            return mat.transmissionWeight > 0;
        } else if (mat instanceof PBRMaterial && !mat.unlit) {
            const subs = mat.subSurface;
            return (
                (subs.isRefractionEnabled && subs.refractionIntensity != undefined && subs.refractionIntensity != 0) ||
                (subs.refractionIntensityTexture != null && subs.useGltfStyleTextures)
            );
        }
        return false;
    }

    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns true if successful
     */
    public async postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        if (!this._isExtensionEnabled(babylonMaterial)) {
            return node;
        }
        if (babylonMaterial instanceof PBRMaterial) {
            this._wasUsed = true;

            const subSurface = babylonMaterial.subSurface;
            const transmissionFactor = subSurface.refractionIntensity === 0 ? undefined : subSurface.refractionIntensity;

            const transmissionInfo: IKHRMaterialsTransmission = {
                transmissionFactor: transmissionFactor,
            };

            if (subSurface.refractionIntensityTexture) {
                if (subSurface.useGltfStyleTextures) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    const transmissionTexture = this._exporter._materialExporter.getTextureInfo(subSurface.refractionIntensityTexture);
                    if (transmissionTexture) {
                        transmissionInfo.transmissionTexture = transmissionTexture;
                    }
                } else {
                    Logger.Warn(`${context}: Exporting a subsurface refraction intensity texture without \`useGltfStyleTextures\` is not supported`);
                }
            }

            node.extensions ||= {};
            node.extensions[NAME] = transmissionInfo;
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            this._wasUsed = true;

            const transmissionFactor = babylonMaterial.transmissionWeight;

            const transmissionInfo: IKHRMaterialsTransmission = {
                transmissionFactor: transmissionFactor,
            };

            if (babylonMaterial.transmissionWeightTexture) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                const transmissionTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.transmissionWeightTexture);
                if (transmissionTexture) {
                    transmissionInfo.transmissionTexture = transmissionTexture;
                }
            }

            if (transmissionFactor === 1) {
                if (node.pbrMetallicRoughness) {
                    node.pbrMetallicRoughness.baseColorFactor = undefined;
                }
            }

            node.extensions ||= {};
            node.extensions[NAME] = transmissionInfo;
        }

        return node;
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_transmission(exporter));
