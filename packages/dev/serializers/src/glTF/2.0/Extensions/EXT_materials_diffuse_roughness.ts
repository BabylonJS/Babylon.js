import type { IMaterial, IEXTMaterialsDiffuseRoughness } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Nullable } from "core/types";

const NAME = "EXT_materials_diffuse_roughness";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_materials_diffuse_roughness implements IGLTFExporterExtensionV2 {
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
            if (babylonMaterial._baseDiffuseRoughness) {
                if (babylonMaterial._baseDiffuseRoughnessTexture) {
                    additionalTextures.push(babylonMaterial._baseDiffuseRoughnessTexture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.baseDiffuseRoughness) {
                if (babylonMaterial.baseDiffuseRoughnessTexture) {
                    additionalTextures.push(babylonMaterial.baseDiffuseRoughnessTexture);
                }
                return additionalTextures;
            }
        }

        return [];
    }

    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            let diffuseRoughnessFactor: Nullable<number> = null;
            let diffuseRoughnessTexture: Nullable<BaseTexture> = null;
            if (babylonMaterial instanceof PBRBaseMaterial) {
                diffuseRoughnessFactor = babylonMaterial._baseDiffuseRoughness;
                diffuseRoughnessTexture = babylonMaterial._baseDiffuseRoughnessTexture;
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                diffuseRoughnessFactor = babylonMaterial.baseDiffuseRoughness;
                diffuseRoughnessTexture = babylonMaterial.baseDiffuseRoughnessTexture;
            }
            if (!diffuseRoughnessFactor) {
                resolve(node);
                return;
            }

            this._wasUsed = true;

            node.extensions = node.extensions || {};

            const diffuseRoughnessTextureInfo = this._exporter._materialExporter.getTextureInfo(diffuseRoughnessTexture);

            const diffuseRoughnessInfo: IEXTMaterialsDiffuseRoughness = {
                diffuseRoughnessFactor: diffuseRoughnessFactor,
                diffuseRoughnessTexture: diffuseRoughnessTextureInfo ?? undefined,
            };

            if (diffuseRoughnessInfo.diffuseRoughnessTexture !== null) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
            }

            node.extensions[NAME] = diffuseRoughnessInfo;

            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new EXT_materials_diffuse_roughness(exporter));
