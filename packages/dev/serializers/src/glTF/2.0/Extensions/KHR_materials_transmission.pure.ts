import { type IMaterial, type IKHRMaterialsTransmission } from "babylonjs-gltf2interface";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { type Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { Logger } from "core/Misc/logger";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";
import { Color3, Color4 } from "core/Maths/math.color.pure";
import { type Nullable } from "core/types";
import { LerpTexturesAsync, CreateTextureWithFactorOperand, CreateFactorOperand, TextureChannel } from "core/Materials/Textures/textureProcessor";

const NAME = "KHR_materials_transmission";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_transmission/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_transmission implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: GLTFExporter;

    private _wasUsed = false;

    // Caches the lerp result per material (computed in postExportMaterialAdditionalTexturesAsync,
    // consumed in postExportMaterialAsync). Texture is disposed in dispose().
    private _transmissionOperands = new Map<Material, { factor: Nullable<Color4>; texture: Nullable<BaseTexture> }>();

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    /** Dispose */
    public dispose() {
        for (const operand of this._transmissionOperands.values()) {
            operand.texture?.dispose();
        }
        this._transmissionOperands.clear();
    }

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
                if (babylonMaterial.subSurface.refractionIntensityTexture && babylonMaterial.subSurface.useGltfStyleTextures) {
                    additionalTextures.push(babylonMaterial.subSurface.refractionIntensityTexture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (this._isExtensionEnabled(babylonMaterial)) {
                const subsurfaceWeight = babylonMaterial.subsurfaceWeight;
                const transmissionWeight = babylonMaterial.transmissionWeight;
                const subsurfaceChannel = babylonMaterial._useSubsurfaceWeightFromTextureAlpha ? TextureChannel.A : TextureChannel.R;

                // OpenPBR can have surface transmission in either transmission_weight or subsurface_weight,
                // and we need to combine them into a single transmission weight for glTF.
                // The final transmission weight is computed as a linear interpolation of the two weights.
                // lerp(subsurface_weight, 1, transmission_weight)
                const sOp = CreateTextureWithFactorOperand(
                    babylonMaterial.subsurfaceWeightTexture,
                    new Color4(subsurfaceWeight, subsurfaceWeight, subsurfaceWeight, subsurfaceWeight),
                    subsurfaceChannel
                );
                const tOp = CreateTextureWithFactorOperand(
                    babylonMaterial.transmissionWeightTexture,
                    new Color4(transmissionWeight, transmissionWeight, transmissionWeight, transmissionWeight),
                    TextureChannel.R
                );
                const result = await LerpTexturesAsync(
                    `transmission weight (${babylonMaterial.name})`,
                    sOp,
                    CreateFactorOperand(new Color4(1, 1, 1, 1)),
                    tOp,
                    babylonMaterial.getScene()
                );
                this._transmissionOperands.set(babylonMaterial, { factor: result.factor ?? null, texture: result.texture ?? null });

                if (result.texture) {
                    additionalTextures.push(result.texture);
                }
                if (babylonMaterial.transmissionColorTexture) {
                    additionalTextures.push(babylonMaterial.transmissionColorTexture);
                }
            }
        }

        return additionalTextures;
    }

    private _isExtensionEnabled(mat: Material): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat instanceof OpenPBRMaterial && !mat.unlit) {
            return mat.transmissionWeight > 0 || mat.subsurfaceWeight > 0;
        } else if (mat instanceof PBRMaterial && !mat.unlit) {
            const subs = mat.subSurface;
            return (
                (subs.isRefractionEnabled && subs.refractionIntensity != undefined && subs.refractionIntensity != 0) ||
                (subs.refractionIntensityTexture != null && subs.useGltfStyleTextures)
            );
        }
        return false;
    }

    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns true if successful
     */
    public async postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        if (!this._isExtensionEnabled(babylonMaterial)) {
            return node;
        }
        if (babylonMaterial instanceof PBRMaterial) {
            this._wasUsed = true;

            const subSurface = babylonMaterial.subSurface;
            const transmissionFactor = subSurface.refractionIntensity === 0 ? undefined : subSurface.refractionIntensity;

            const transmissionInfo: IKHRMaterialsTransmission = {
                transmissionFactor: transmissionFactor,
            };

            if (subSurface.refractionIntensityTexture) {
                if (subSurface.useGltfStyleTextures) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    const transmissionTexture = this._exporter._materialExporter.getTextureInfo(subSurface.refractionIntensityTexture);
                    if (transmissionTexture) {
                        transmissionInfo.transmissionTexture = transmissionTexture;
                    }
                } else {
                    Logger.Warn(`${context}: Exporting a subsurface refraction intensity texture without \`useGltfStyleTextures\` is not supported`);
                }
            }

            node.extensions ||= {};
            node.extensions[NAME] = transmissionInfo;
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            this._wasUsed = true;

            const operand = this._transmissionOperands.get(babylonMaterial);
            const bakedTexture = operand?.texture ?? null;
            const bakedFactor = operand?.factor ?? null;

            const transmissionInfo: IKHRMaterialsTransmission = {
                transmissionFactor: bakedTexture ? 1.0 : (bakedFactor?.r ?? 0.0),
            };

            if (bakedTexture) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                const transmissionTexture = this._exporter._materialExporter.getTextureInfo(bakedTexture);
                if (transmissionTexture) {
                    transmissionInfo.transmissionTexture = transmissionTexture;
                }
            }

            if (babylonMaterial.transmissionDepth == 0.0 && (!babylonMaterial.transmissionColor.equals(Color3.White()) || babylonMaterial.transmissionColorTexture)) {
                if (node.pbrMetallicRoughness) {
                    if (!node.pbrMetallicRoughness.baseColorFactor) {
                        node.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
                    }
                    node.pbrMetallicRoughness.baseColorFactor[0] *= babylonMaterial.transmissionColor.r;
                    node.pbrMetallicRoughness.baseColorFactor[1] *= babylonMaterial.transmissionColor.g;
                    node.pbrMetallicRoughness.baseColorFactor[2] *= babylonMaterial.transmissionColor.b;
                    if (babylonMaterial.transmissionColorTexture && !node.pbrMetallicRoughness.baseColorTexture) {
                        const transmissionColorTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.transmissionColorTexture);
                        if (transmissionColorTexture) {
                            node.pbrMetallicRoughness.baseColorTexture = transmissionColorTexture;
                            this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                        }
                    }
                }
            }

            node.extensions ||= {};
            node.extensions[NAME] = transmissionInfo;
        }

        return node;
    }
}

let _Registered = false;
/**
 * Registers the KHR_materials_transmission glTF serializer extension with the {@link GLTFExporter}.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_materials_transmission(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_transmission(exporter));
}
