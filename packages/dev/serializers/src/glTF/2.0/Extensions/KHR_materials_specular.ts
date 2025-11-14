import type { IMaterial, IKHRMaterialsSpecular, IEXTMaterialsSpecularEdgeColor } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";

const NAME = "KHR_materials_specular";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_specular/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_specular implements IGLTFExporterExtensionV2 {
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
     * After exporting a material, deal with the additional textures
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns array of additional textures to export
     */
    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];

        if (babylonMaterial instanceof PBRMaterial) {
            if (this._isExtensionEnabled(babylonMaterial)) {
                if (babylonMaterial.metallicReflectanceTexture) {
                    additionalTextures.push(babylonMaterial.metallicReflectanceTexture);
                }
                if (babylonMaterial.reflectanceTexture) {
                    additionalTextures.push(babylonMaterial.reflectanceTexture);
                }
                return additionalTextures;
            }
        }

        return additionalTextures;
    }

    private _isExtensionEnabled(mat: PBRMaterial): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        return (
            (mat.metallicF0Factor != undefined && mat.metallicF0Factor != 1.0) ||
            (mat.metallicReflectanceColor != undefined && !mat.metallicReflectanceColor.equalsFloats(1.0, 1.0, 1.0)) ||
            this._hasTexturesExtension(mat)
        );
    }

    private _hasTexturesExtension(mat: PBRMaterial): boolean {
        return mat.metallicReflectanceTexture != null || mat.reflectanceTexture != null;
    }

    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns promise, resolves with the material
     */
    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;

                node.extensions = node.extensions || {};

                const metallicReflectanceTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.metallicReflectanceTexture) ?? undefined;
                const reflectanceTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.reflectanceTexture) ?? undefined;
                const metallicF0Factor = babylonMaterial.metallicF0Factor == 1.0 ? undefined : babylonMaterial.metallicF0Factor;
                const metallicReflectanceColor = babylonMaterial.metallicReflectanceColor.equalsFloats(1.0, 1.0, 1.0)
                    ? undefined
                    : babylonMaterial.metallicReflectanceColor.asArray();

                const specularInfo: IKHRMaterialsSpecular = {
                    specularFactor: metallicF0Factor,
                    specularTexture: metallicReflectanceTexture,
                    specularColorFactor: metallicReflectanceColor,
                    specularColorTexture: reflectanceTexture,
                };

                if (this._hasTexturesExtension(babylonMaterial)) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = specularInfo;
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                node.extensions = node.extensions || {};

                const specularWeightTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.specularWeightTexture) ?? undefined;
                const specularColorTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.specularColorTexture) ?? undefined;
                const specularWeight = babylonMaterial.specularWeight == 1.0 ? undefined : babylonMaterial.specularWeight;
                const specularColor = babylonMaterial.specularColor.equalsFloats(1.0, 1.0, 1.0) ? undefined : babylonMaterial.specularColor.asArray();

                if (!specularColorTexture && !specularWeightTexture && specularWeight === undefined && specularColor === undefined) {
                    return resolve(node);
                }
                this._wasUsed = true;

                const specularEdgeColorInfo: IEXTMaterialsSpecularEdgeColor = {
                    specularEdgeColorEnabled: true,
                };

                const specularInfo: IKHRMaterialsSpecular = {
                    specularFactor: specularWeight,
                    specularTexture: specularWeightTexture,
                    specularColorFactor: specularColor,
                    specularColorTexture: specularColorTexture,
                    extensions: {},
                };

                specularInfo.extensions!["EXT_materials_specular_edge_color"] = specularEdgeColorInfo;
                this._exporter._glTF.extensionsUsed ||= [];
                if (this._exporter._glTF.extensionsUsed.indexOf("EXT_materials_specular_edge_color") === -1) {
                    this._exporter._glTF.extensionsUsed.push("EXT_materials_specular_edge_color");
                }

                if (specularWeightTexture || specularColorTexture) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = specularInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_specular(exporter));
