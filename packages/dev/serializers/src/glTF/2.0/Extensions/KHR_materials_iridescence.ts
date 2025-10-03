import type { IMaterial, IKHRMaterialsIridescence } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

const NAME = "KHR_materials_iridescence";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_iridescence implements IGLTFExporterExtensionV2 {
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

    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];
        if (babylonMaterial instanceof PBRBaseMaterial) {
            if (babylonMaterial.iridescence.isEnabled) {
                if (babylonMaterial.iridescence.texture) {
                    additionalTextures.push(babylonMaterial.iridescence.texture);
                }
                if (babylonMaterial.iridescence.thicknessTexture && babylonMaterial.iridescence.thicknessTexture !== babylonMaterial.iridescence.texture) {
                    additionalTextures.push(babylonMaterial.iridescence.thicknessTexture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.thinFilmWeight > 0) {
                if (babylonMaterial.thinFilmWeightTexture) {
                    additionalTextures.push(babylonMaterial.thinFilmWeightTexture);
                }
                if (babylonMaterial.thinFilmThicknessTexture && babylonMaterial.thinFilmThicknessTexture !== babylonMaterial.thinFilmWeightTexture) {
                    additionalTextures.push(babylonMaterial.thinFilmThicknessTexture);
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
                if (!babylonMaterial.iridescence.isEnabled) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                node.extensions = node.extensions || {};

                const iridescenceTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.iridescence.texture);
                const iridescenceThicknessTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.iridescence.thicknessTexture);

                const iridescenceInfo: IKHRMaterialsIridescence = {
                    iridescenceFactor: babylonMaterial.iridescence.intensity,
                    iridescenceIor: babylonMaterial.iridescence.indexOfRefraction,
                    iridescenceThicknessMinimum: babylonMaterial.iridescence.minimumThickness,
                    iridescenceThicknessMaximum: babylonMaterial.iridescence.maximumThickness,

                    iridescenceTexture: iridescenceTextureInfo ?? undefined,
                    iridescenceThicknessTexture: iridescenceThicknessTextureInfo ?? undefined,
                };

                if (iridescenceInfo.iridescenceTexture !== null || iridescenceInfo.iridescenceThicknessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = iridescenceInfo;
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                if (babylonMaterial.thinFilmWeight <= 0) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                node.extensions = node.extensions || {};

                const thinFilmWeightTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.thinFilmWeightTexture);
                const thinFilmThicknessTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.thinFilmThicknessTexture);

                const iridescenceInfo: IKHRMaterialsIridescence = {
                    iridescenceFactor: babylonMaterial.thinFilmWeight,
                    iridescenceIor: babylonMaterial.thinFilmIor,
                    iridescenceThicknessMinimum: babylonMaterial.thinFilmThicknessMin * 1000, // Convert to nanometers for glTF
                    iridescenceThicknessMaximum: babylonMaterial.thinFilmThickness * 1000, // Convert to nanometers for glTF

                    iridescenceTexture: thinFilmWeightTextureInfo ?? undefined,
                    iridescenceThicknessTexture: thinFilmThicknessTextureInfo ?? undefined,
                };

                if (iridescenceInfo.iridescenceTexture !== null || iridescenceInfo.iridescenceThicknessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions[NAME] = iridescenceInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_iridescence(exporter));
