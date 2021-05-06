import { IMaterial } from "babylonjs-gltf2interface";
import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Material } from "babylonjs/Materials/material";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IKHRMaterialsSheen } from "babylonjs-gltf2interface";

const NAME = "KHR_materials_sheen";

/**
 * @hidden
 */
export class KHR_materials_sheen implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    private _exporter : _Exporter;

    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    public dispose() {
    }

    /** @hidden */
    public get wasUsed() {
        return this._wasUsed;
    }

    public postExportMaterialAdditionalTextures(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
        if (babylonMaterial instanceof PBRMaterial) {
            if (babylonMaterial.sheen.isEnabled && babylonMaterial.sheen.texture) {
                return [babylonMaterial.sheen.texture];
            }
        }

        return [];
    }

    public postExportMaterialAsync(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve, reject) => {
            if (babylonMaterial instanceof PBRMaterial) {
                if (!babylonMaterial.sheen.isEnabled) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                if (node.extensions == null) {
                    node.extensions = {};
                }
                const sheenInfo: IKHRMaterialsSheen = {
                    sheenColorFactor: babylonMaterial.sheen.color.asArray(),
                    sheenRoughnessFactor: babylonMaterial.sheen.roughness ?? 0,
                    hasTextures: () => {
                        return sheenInfo.sheenColorTexture !== null || sheenInfo.sheenRoughnessTexture !== null;
                    }
                };

                if (babylonMaterial.sheen.texture) {
                    sheenInfo.sheenColorTexture = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.sheen.texture) ?? undefined;
                }

                if (babylonMaterial.sheen.textureRoughness && !babylonMaterial.sheen.useRoughnessFromMainTexture) {
                    sheenInfo.sheenRoughnessTexture = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.sheen.textureRoughness) ?? undefined;
                } else if (babylonMaterial.sheen.texture && babylonMaterial.sheen.useRoughnessFromMainTexture) {
                    sheenInfo.sheenRoughnessTexture = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.sheen.texture) ?? undefined;
                }

                node.extensions[NAME] = sheenInfo;
            }
            resolve(node);
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_sheen(exporter));