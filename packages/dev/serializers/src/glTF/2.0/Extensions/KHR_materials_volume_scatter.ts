import { type IMaterial, type IKHRMaterialsVolumeScatter } from "babylonjs-gltf2interface";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { type Material } from "core/Materials/material";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
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
            if (babylonMaterial.subsurfaceWeight > 0) {
                if (babylonMaterial.subsurfaceColorTexture) {
                    additionalTextures.push(babylonMaterial.subsurfaceColorTexture);
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
        const transmissionVolume = mat.transmissionWeight > 0 && !mat.geometryThinWalled && mat.transmissionDepth > 0;
        const transmissionScatter = transmissionVolume && !mat.transmissionScatter.equals(Color3.Black());
        const subsurfaceVolume = mat.subsurfaceWeight > 0 && !mat.geometryThinWalled;
        if (transmissionScatter || subsurfaceVolume) {
            return true;
        }
        return false;
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

                // If both transmission and subsurface volumes exist, combine them.
                let transmissionMultiscatterColor = Vector3.Zero();
                let transmissionScatterAnisotropy = 0;
                if (babylonMaterial.transmissionWeight > 0) {
                    const invDepth = 1.0 / babylonMaterial.transmissionDepth;
                    let transmissionExtinctionCoefficient = new Vector3(
                        -Math.log(babylonMaterial.transmissionColor.r) * invDepth,
                        -Math.log(babylonMaterial.transmissionColor.g) * invDepth,
                        -Math.log(babylonMaterial.transmissionColor.b) * invDepth
                    );
                    const transmissionScatteringCoefficient = new Vector3(
                        babylonMaterial.transmissionScatter.r * invDepth,
                        babylonMaterial.transmissionScatter.g * invDepth,
                        babylonMaterial.transmissionScatter.b * invDepth
                    );
                    const transmissionAbsorptionCoefficient = transmissionExtinctionCoefficient.subtract(transmissionScatteringCoefficient);
                    const minCoeff = Math.min(transmissionAbsorptionCoefficient.x, transmissionAbsorptionCoefficient.y, transmissionAbsorptionCoefficient.z);
                    if (minCoeff < 0) {
                        transmissionAbsorptionCoefficient.x = transmissionAbsorptionCoefficient.x - minCoeff;
                        transmissionAbsorptionCoefficient.y = transmissionAbsorptionCoefficient.y - minCoeff;
                        transmissionAbsorptionCoefficient.z = transmissionAbsorptionCoefficient.z - minCoeff;
                    }
                    transmissionExtinctionCoefficient = transmissionAbsorptionCoefficient.add(transmissionScatteringCoefficient);

                    const ssAlbedo = new Vector3(
                        transmissionScatteringCoefficient.x / Math.max(transmissionExtinctionCoefficient.x, 0.000001),
                        transmissionScatteringCoefficient.y / Math.max(transmissionExtinctionCoefficient.y, 0.000001),
                        transmissionScatteringCoefficient.z / Math.max(transmissionExtinctionCoefficient.z, 0.000001)
                    );
                    transmissionMultiscatterColor = SingleScatterToMultiScatterAlbedo(ssAlbedo);
                    transmissionScatterAnisotropy = babylonMaterial.transmissionScatterAnisotropy;
                }

                const subsurfaceMultiscatterColor = Vector3.Zero();
                let subsurfaceScatterAnisotropy = 0;
                if (babylonMaterial.subsurfaceWeight > 0) {
                    subsurfaceMultiscatterColor.set(babylonMaterial.subsurfaceColor.r, babylonMaterial.subsurfaceColor.g, babylonMaterial.subsurfaceColor.b);
                    subsurfaceScatterAnisotropy = babylonMaterial.subsurfaceScatterAnisotropy;
                }

                const subsurfaceFractionOfDielectric = (1.0 - babylonMaterial.transmissionWeight) * babylonMaterial.subsurfaceWeight;
                const subsurfaceAndTransmissionFractionOfDielectric = subsurfaceFractionOfDielectric + babylonMaterial.transmissionWeight;
                const reciprocalOfSubsurfaceAndTransmissionFractionOfDielectric = 1.0 / Math.max(subsurfaceAndTransmissionFractionOfDielectric, 1e-6);
                const transWeight = babylonMaterial.transmissionWeight * reciprocalOfSubsurfaceAndTransmissionFractionOfDielectric;
                const subsurfWeight = subsurfaceFractionOfDielectric * reciprocalOfSubsurfaceAndTransmissionFractionOfDielectric;

                const multiscatterColor = transmissionMultiscatterColor
                    .multiplyByFloats(transWeight, transWeight, transWeight)
                    .addInPlace(subsurfaceMultiscatterColor.multiplyByFloats(subsurfWeight, subsurfWeight, subsurfWeight));

                const volumeInfo: IKHRMaterialsVolumeScatter = {
                    multiscatterColorFactor: multiscatterColor.asArray(),
                    scatterAnisotropy: transmissionScatterAnisotropy * transWeight + subsurfaceScatterAnisotropy * subsurfWeight,
                };

                if (babylonMaterial.subsurfaceWeight > 0 && babylonMaterial.subsurfaceColorTexture) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    const subsurfaceScatterTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.subsurfaceColorTexture);
                    if (subsurfaceScatterTexture) {
                        volumeInfo.multiscatterColorTexture = subsurfaceScatterTexture;
                    }
                } else if (babylonMaterial.transmissionWeight > 0 && babylonMaterial.transmissionScatterTexture) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    const transmissionTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.transmissionScatterTexture);
                    if (transmissionTexture) {
                        volumeInfo.multiscatterColorTexture = transmissionTexture;
                    }
                }

                node.extensions = node.extensions || {};
                node.extensions[NAME] = volumeInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_volume_scatter(exporter), 101);
