import { IMaterial } from "babylonjs-gltf2interface";
import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Material } from 'babylonjs/Materials/material';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { PBRBaseMaterial } from 'babylonjs/Materials/PBR/pbrBaseMaterial';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { IKHRMaterialsClearcoat } from 'babylonjs-gltf2interface';
import { PBRMetallicRoughnessMaterial } from "babylonjs/Materials/PBR/pbrMetallicRoughnessMaterial";

const NAME = "KHR_materials_clearcoat";

/**
 * @hidden
 */
export class KHR_materials_clearcoat implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: _Exporter;

    private _wasUsed = false;

    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    public dispose() {
    }

    /** @hidden */
    public get wasUsed() {
        return this._wasUsed;
    }

    public postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
        let additionalTextures: BaseTexture[] = [];
        if (babylonMaterial instanceof PBRMaterial) {
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
        }

        return [];
    }

    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve, reject) => {
            if (babylonMaterial instanceof PBRBaseMaterial) {
                if (!babylonMaterial.clearCoat.isEnabled) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                if (node.extensions == null) {
                    node.extensions = {};
                }

                let clearCoatTextureInfo = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.clearCoat.texture);
                let clearCoatTextureRoughnessInfo;
                if (babylonMaterial.clearCoat.useRoughnessFromMainTexture) {
                    clearCoatTextureRoughnessInfo = this._exporter._glTFMaterialExporter._getTextureInfo((babylonMaterial as PBRMaterial).metallicTexture
                                                                                                        ?? (babylonMaterial as PBRMetallicRoughnessMaterial).metallicRoughnessTexture);
                } else {
                    clearCoatTextureRoughnessInfo = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.clearCoat.textureRoughness);
                }

                let clearCoatNormalTextureInfo = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.clearCoat.bumpTexture);

                const clearCoatInfo: IKHRMaterialsClearcoat = {
                    clearcoatFactor: babylonMaterial.clearCoat.intensity,
                    clearcoatTexture: clearCoatTextureInfo ?? undefined,
                    clearcoatRoughnessFactor: babylonMaterial.clearCoat.roughness,
                    clearcoatRoughnessTexture: clearCoatTextureRoughnessInfo ?? undefined,
                    clearcoatNormalTexture: clearCoatNormalTextureInfo ?? undefined
                };

                node.extensions[NAME] = clearCoatInfo;
            }
            resolve(node);
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_clearcoat(exporter));