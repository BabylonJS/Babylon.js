import { type IMaterial, type IKHRMaterialsVolume } from "babylonjs-gltf2interface";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { type Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";

const NAME = "KHR_materials_volume";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_volume implements IGLTFExporterExtensionV2 {
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

        if (babylonMaterial instanceof PBRMaterial) {
            if (this._isExtensionEnabled(babylonMaterial)) {
                if (babylonMaterial.subSurface.thicknessTexture) {
                    additionalTextures.push(babylonMaterial.subSurface.thicknessTexture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.transmissionWeight > 0 || babylonMaterial.subsurfaceWeight > 0) {
                if (babylonMaterial.geometryThicknessTexture) {
                    additionalTextures.push(babylonMaterial.geometryThicknessTexture);
                }
            }
        }

        return additionalTextures;
    }

    private _isExtensionEnabled(mat: PBRMaterial): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        const subs = mat.subSurface;
        // this extension requires either the KHR_materials_transmission or KHR_materials_diffuse_transmission extensions.
        if (!subs.isRefractionEnabled && !subs.isTranslucencyEnabled) {
            return false;
        }
        return (
            (subs.maximumThickness != undefined && subs.maximumThickness != 0) ||
            (subs.tintColorAtDistance != undefined && subs.tintColorAtDistance != Number.POSITIVE_INFINITY) ||
            (subs.tintColor != undefined && subs.tintColor != Color3.White()) ||
            this._hasTexturesExtension(mat)
        );
    }

    private _hasTexturesExtension(mat: PBRMaterial): boolean {
        return mat.subSurface.thicknessTexture != null;
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
            if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;

                const subs = babylonMaterial.subSurface;
                const thicknessFactor = subs.maximumThickness == 0 ? undefined : subs.maximumThickness;
                const thicknessTexture = this._exporter._materialExporter.getTextureInfo(subs.thicknessTexture) ?? undefined;
                const attenuationDistance = subs.tintColorAtDistance == Number.POSITIVE_INFINITY ? undefined : subs.tintColorAtDistance;
                const attenuationColor = subs.tintColor.equalsFloats(1.0, 1.0, 1.0) ? undefined : subs.tintColor.asArray();

                const volumeInfo: IKHRMaterialsVolume = {
                    thicknessFactor: thicknessFactor,
                    thicknessTexture: thicknessTexture,
                    attenuationDistance: attenuationDistance,
                    attenuationColor: attenuationColor,
                };

                if (this._hasTexturesExtension(babylonMaterial)) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions = node.extensions || {};
                node.extensions[NAME] = volumeInfo;
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                const transmissionVolume = babylonMaterial.transmissionWeight > 0 && !babylonMaterial.geometryThinWalled && babylonMaterial.transmissionDepth > 0;
                const subsurfaceVolume = babylonMaterial.subsurfaceWeight > 0 && !babylonMaterial.geometryThinWalled;
                if (transmissionVolume || subsurfaceVolume) {
                    this._wasUsed = true;

                    const thicknessFactor = babylonMaterial.geometryThickness;
                    const thicknessTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.geometryThicknessTexture) ?? undefined;
                    if (thicknessTexture) {
                        this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    }
                    let transmissionAttenuationDistance = 1;
                    const transmissionAttenuationColor = Color3.White().asArray();
                    if (transmissionVolume) {
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
                        const maxCoeff = Math.max(transmissionExtinctionCoefficient.x, transmissionExtinctionCoefficient.y, transmissionExtinctionCoefficient.z);
                        transmissionAttenuationDistance = 1.0 / maxCoeff;
                        transmissionAttenuationColor[0] = Math.exp(-transmissionExtinctionCoefficient.x * transmissionAttenuationDistance);
                        transmissionAttenuationColor[1] = Math.exp(-transmissionExtinctionCoefficient.y * transmissionAttenuationDistance);
                        transmissionAttenuationColor[2] = Math.exp(-transmissionExtinctionCoefficient.z * transmissionAttenuationDistance);
                    }
                    let subsurfaceAttenuationDistance = 1;
                    const subsurfaceAttenuationColor = Color3.White().asArray();
                    if (subsurfaceVolume) {
                        const r = babylonMaterial.subsurfaceRadius;
                        const radiusScale = babylonMaterial.subsurfaceRadiusScale;
                        const mfp = new Vector3(radiusScale.r, radiusScale.g, radiusScale.b).multiplyByFloats(r, r, r);
                        const extinctionCoeff = new Vector3(1.0 / Math.max(mfp.x, 1e-6), 1.0 / Math.max(mfp.y, 1e-6), 1.0 / Math.max(mfp.z, 1e-6));
                        const maxCoeff = Math.max(extinctionCoeff.x, extinctionCoeff.y, extinctionCoeff.z);
                        subsurfaceAttenuationDistance = 1.0 / maxCoeff;
                        subsurfaceAttenuationColor[0] = Math.exp(-extinctionCoeff.x * subsurfaceAttenuationDistance);
                        subsurfaceAttenuationColor[1] = Math.exp(-extinctionCoeff.y * subsurfaceAttenuationDistance);
                        subsurfaceAttenuationColor[2] = Math.exp(-extinctionCoeff.z * subsurfaceAttenuationDistance);
                    }

                    const subsurfaceFractionOfDielectric = (1.0 - babylonMaterial.transmissionWeight) * babylonMaterial.subsurfaceWeight;
                    const subsurfaceAndTransmissionFractionOfDielectric = subsurfaceFractionOfDielectric + babylonMaterial.transmissionWeight;
                    const reciprocalOfSubsurfaceAndTransmissionFractionOfDielectric = 1.0 / Math.max(subsurfaceAndTransmissionFractionOfDielectric, 1e-6);
                    const transWeight = babylonMaterial.transmissionWeight * reciprocalOfSubsurfaceAndTransmissionFractionOfDielectric;
                    const subsurfWeight = subsurfaceFractionOfDielectric * reciprocalOfSubsurfaceAndTransmissionFractionOfDielectric;

                    const attenuationColor = transmissionAttenuationColor.map((c, i) => c * transWeight + subsurfaceAttenuationColor[i] * subsurfWeight);
                    const attenuationDistance = transmissionAttenuationDistance * transWeight + subsurfaceAttenuationDistance * subsurfWeight;

                    const volumeInfo: IKHRMaterialsVolume = {
                        thicknessFactor: thicknessFactor,
                        thicknessTexture: thicknessTexture,
                        attenuationDistance: attenuationDistance,
                        attenuationColor: attenuationColor,
                    };
                    node.extensions = node.extensions || {};
                    node.extensions[NAME] = volumeInfo;
                }
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_volume(exporter));
