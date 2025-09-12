import type { IMaterial, IKHRMaterialsSheen } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

const NAME = "KHR_materials_sheen";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_sheen implements IGLTFExporterExtensionV2 {
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

    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    public async postExportMaterialAdditionalTexturesAsync(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        if (babylonMaterial instanceof PBRMaterial) {
            if (babylonMaterial.sheen.isEnabled && babylonMaterial.sheen.texture) {
                return [babylonMaterial.sheen.texture];
            }
        }

        return [];
    }

    public async postExportMaterialAsync(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return await new Promise((resolve) => {
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
                };

                if (sheenInfo.sheenColorTexture !== null || sheenInfo.sheenRoughnessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                if (babylonMaterial.sheen.texture) {
                    sheenInfo.sheenColorTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.sheen.texture) ?? undefined;
                }

                if (babylonMaterial.sheen.textureRoughness && !babylonMaterial.sheen.useRoughnessFromMainTexture) {
                    sheenInfo.sheenRoughnessTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.sheen.textureRoughness) ?? undefined;
                } else if (babylonMaterial.sheen.texture && babylonMaterial.sheen.useRoughnessFromMainTexture) {
                    sheenInfo.sheenRoughnessTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.sheen.texture) ?? undefined;
                }

                node.extensions[NAME] = sheenInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_sheen(exporter));
