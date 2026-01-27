import type { IMaterial, IKHRMaterialsVolumeScatter } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";

const NAME = "KHR_materials_volume_scatter";

function SingleScatterToMultiScatterAlbedo(singleScatter: Vector3): Vector3 {
    const s = new Vector3(Math.sqrt(1.0 - singleScatter.x), Math.sqrt(1.0 - singleScatter.y), Math.sqrt(1.0 - singleScatter.z));
    const ones = new Vector3(1.0, 1.0, 1.0);
    const t = ones.subtract(s);
    const p = ones.subtract(new Vector3(0.139, 0.139, 0.139).multiplyInPlace(s));
    const k = ones.add(new Vector3(1.17, 1.17, 1.17).multiplyInPlace(s));

    return t.multiplyInPlace(p).divideInPlace(k);
}

/**
 * TODO: In-progress specification
 * [Specification](https://github.com/KhronosGroup/glTF/blob/7ea427ed55d44427e83c0a6d1c87068b1a4151c5/extensions/2.0/Khronos/KHR_materials_volume_scatter/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_volume_scatter implements IGLTFExporterExtensionV2 {
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

    /**
     * After exporting a material, deal with additional textures
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns array of additional textures to export
     */
    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];

        if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.transmissionWeight > 0) {
                if (babylonMaterial.transmissionScatterTexture) {
                    additionalTextures.push(babylonMaterial.transmissionScatterTexture);
                }
            }
        }

        return additionalTextures;
    }

    private _isExtensionEnabled(mat: OpenPBRMaterial): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        if (mat.transmissionWeight == 0 || mat.transmissionScatter.equals(Color3.Black())) {
            return false;
        }
        return true;
    }

    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns promise that resolves with the updated node
     */
    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof OpenPBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;
                const invDepth = 1.0 / babylonMaterial.transmissionDepth;
                const extinctionCoefficient = new Vector3(
                    -Math.log(babylonMaterial.transmissionColor.r) * invDepth,
                    -Math.log(babylonMaterial.transmissionColor.g) * invDepth,
                    -Math.log(babylonMaterial.transmissionColor.b) * invDepth
                );
                const scatteringCoefficient = new Vector3(
                    babylonMaterial.transmissionScatter.r * invDepth,
                    babylonMaterial.transmissionScatter.g * invDepth,
                    babylonMaterial.transmissionScatter.b * invDepth
                );
                const absorptionCoefficient = extinctionCoefficient.subtract(scatteringCoefficient);
                const minCoeff = Math.min(absorptionCoefficient.x, absorptionCoefficient.y, absorptionCoefficient.z);
                if (minCoeff < 0.0) {
                    absorptionCoefficient.subtractInPlace(new Vector3(minCoeff, minCoeff, minCoeff));
                    // Set extinction coefficient after shifting the absorption to be non-negative.
                    extinctionCoefficient.copyFrom(absorptionCoefficient).addInPlace(scatteringCoefficient);
                }

                const ssAlbedo = new Vector3(
                    scatteringCoefficient.x / extinctionCoefficient.x,
                    scatteringCoefficient.y / extinctionCoefficient.y,
                    scatteringCoefficient.z / extinctionCoefficient.z
                );
                const multiScatterColor = SingleScatterToMultiScatterAlbedo(ssAlbedo);

                const volumeInfo: IKHRMaterialsVolumeScatter = {
                    multiscatterColor: multiScatterColor.asArray(),
                    scatterAnisotropy: babylonMaterial.transmissionScatterAnisotropy,
                };

                if (babylonMaterial.transmissionScatterTexture) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    const transmissionTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.transmissionScatterTexture);
                    if (transmissionTexture) {
                        volumeInfo.multiscatterColorTexture = transmissionTexture;
                    }
                }

                node.extensions = node.extensions || {};
                node.extensions[NAME] = volumeInfo;

                // Now go back and set the extinction coefficient in the volume info.
                if (node.extensions["KHR_materials_volume"]) {
                    const volumeExt = node.extensions["KHR_materials_volume"] as any;
                    const maxExtinction = Math.max(extinctionCoefficient.x, extinctionCoefficient.y, extinctionCoefficient.z);
                    volumeExt.attenuationDistance = 1.0 / Math.max(maxExtinction, 0.0001);
                    volumeExt.attenuationColor = new Color3(
                        Math.exp(-extinctionCoefficient.x * volumeExt.attenuationDistance),
                        Math.exp(-extinctionCoefficient.y * volumeExt.attenuationDistance),
                        Math.exp(-extinctionCoefficient.z * volumeExt.attenuationDistance)
                    ).asArray();
                }
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_volume_scatter(exporter), 101);
