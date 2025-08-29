import type { IMaterial, IKHRMaterialsAnisotropy } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

const NAME = "KHR_materials_anisotropy";

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
            if (babylonMaterial.anisotropy.isEnabled && !babylonMaterial.anisotropy.legacy) {
                if (babylonMaterial.anisotropy.texture) {
                    additionalTextures.push(babylonMaterial.anisotropy.texture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.specularRoughnessAnisotropy > 0) {
                if (babylonMaterial.geometryTangentTexture) {
                    additionalTextures.push(babylonMaterial.geometryTangentTexture);
                }
                if (babylonMaterial.specularRoughnessAnisotropyTexture && !babylonMaterial._useSpecularRoughnessAnisotropyFromTangentTexture) {
                    additionalTextures.push(babylonMaterial.specularRoughnessAnisotropyTexture);
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

                    const geometryTangentTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.geometryTangentTexture);

                    // TODO - if _useSpecularRoughnessAnisotropyFromTangentTexture isn't true, the anisotropy strength is in a separate
                    // texture and needs to be merged into the blue channel of the aniosotropy texture for glTF. Is there a good way of
                    // doing this in Babylon?

                    const specularRoughnessAnisotropyInfo: IKHRMaterialsAnisotropy = {
                        anisotropyStrength: babylonMaterial.specularRoughnessAnisotropy,
                        anisotropyRotation: babylonMaterial.geometryTangentAngle,
                        anisotropyTexture: geometryTangentTextureInfo ?? undefined,
                    };

                    if (specularRoughnessAnisotropyInfo.anisotropyTexture !== null) {
                        this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    }

                    node.extensions[NAME] = specularRoughnessAnisotropyInfo;
                }
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_anisotropy(exporter));
