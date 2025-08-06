import type { IMaterial, IKHRMaterialsClearcoat } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

import { Tools } from "core/Misc/tools";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

const NAME = "KHR_materials_clearcoat";

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

    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    public postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
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
                if (babylonMaterial.coatWeightTexture) {
                    additionalTextures.push(babylonMaterial.coatWeightTexture);
                }
                if (babylonMaterial.geometryCoatNormalTexture) {
                    additionalTextures.push(babylonMaterial.geometryCoatNormalTexture);
                }
                if (babylonMaterial.coatRoughnessTexture) {
                    additionalTextures.push(babylonMaterial.coatRoughnessTexture);
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

                const clearCoatTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.coatWeightTexture);
                let clearCoatTextureRoughnessInfo;
                if (babylonMaterial.useCoatRoughnessFromWeightTexture) {
                    clearCoatTextureRoughnessInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.coatWeightTexture);
                } else {
                    clearCoatTextureRoughnessInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.coatRoughnessTexture);
                }

                if (babylonMaterial.coatColorTexture) {
                    Tools.Warn(`Clear Color tint is not supported for glTF export. Ignoring for: ${babylonMaterial.name}`);
                }

                const clearCoatNormalTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.geometryCoatNormalTexture);

                const clearCoatInfo: IKHRMaterialsClearcoat = {
                    clearcoatFactor: babylonMaterial.coatWeight,
                    clearcoatTexture: clearCoatTextureInfo ?? undefined,
                    clearcoatRoughnessFactor: babylonMaterial.coatRoughness,
                    clearcoatRoughnessTexture: clearCoatTextureRoughnessInfo ?? undefined,
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
