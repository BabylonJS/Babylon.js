import { type IMaterial, type IKHRMaterialsTransmission } from "babylonjs-gltf2interface";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { type Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { Logger } from "core/Misc/logger";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";
import { Color4 } from "core/Maths/math.color.pure";
import { type Nullable } from "core/types";
import { LerpTexturesAsync, CreateTextureWithFactorOperand, CreateFactorOperand, TextureChannel, TextureColorSpace } from "core/Materials/Textures/textureProcessor";
import { MergeTexturesAsync, CreateRGBAConfiguration, CreateTextureInput, CreateConstantInput } from "core/Materials/Textures/textureMerger";

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

    private _baseColorOperands = new Map<Material, { factor: Nullable<Color4>; texture: Nullable<BaseTexture> }>();

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    /** Dispose */
    public dispose() {
        for (const operand of this._transmissionOperands.values()) {
            operand.texture?.dispose();
        }
        this._transmissionOperands.clear();
        for (const operand of this._baseColorOperands.values()) {
            operand.texture?.dispose();
        }
        this._baseColorOperands.clear();
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
                    new Color4(subsurfaceWeight, subsurfaceWeight, subsurfaceWeight, 1.0),
                    subsurfaceChannel
                );
                const tOp = CreateTextureWithFactorOperand(
                    babylonMaterial.transmissionWeightTexture,
                    new Color4(transmissionWeight, transmissionWeight, transmissionWeight, 1.0),
                    TextureChannel.R
                );
                const transWeightResult = await LerpTexturesAsync(
                    `transmission weight (${babylonMaterial.name})`,
                    sOp,
                    CreateFactorOperand(new Color4(1, 1, 1, 1)),
                    tOp,
                    babylonMaterial.getScene()
                );
                this._transmissionOperands.set(babylonMaterial, { factor: transWeightResult.factor ?? null, texture: transWeightResult.texture ?? null });

                if (transWeightResult.texture) {
                    additionalTextures.push(transWeightResult.texture);
                }

                // glTF applies the base color as a tint on transmission while OpenPBR does not, so we lerp
                // the base color toward white by the transmission weight. Because this overwrites the
                // material's base color, we must re-bake geometryOpacity here the same way the OpenPBR
                // material exporter does: the scalar opacity goes into the base color factor alpha, and the
                // opacity texture is packed into the base color texture alpha. The lerp keeps that alpha
                // untouched (transOp alpha is 0), so it survives into the exported base color.
                const geometryOpacity = babylonMaterial.geometryOpacity;
                let baseColorTexture = babylonMaterial.baseColorTexture;
                if (babylonMaterial.geometryOpacityTexture) {
                    // Pack base color RGB and the opacity texture into a single RGBA texture (mirrors GLTFMaterialExporter).
                    baseColorTexture = await MergeTexturesAsync(
                        `base color opacity (${babylonMaterial.name})`,
                        CreateRGBAConfiguration(
                            babylonMaterial.baseColorTexture ? CreateTextureInput(babylonMaterial.baseColorTexture, 0) : CreateConstantInput(1.0),
                            babylonMaterial.baseColorTexture ? CreateTextureInput(babylonMaterial.baseColorTexture, 1) : CreateConstantInput(1.0),
                            babylonMaterial.baseColorTexture ? CreateTextureInput(babylonMaterial.baseColorTexture, 2) : CreateConstantInput(1.0),
                            CreateTextureInput(babylonMaterial.geometryOpacityTexture, 0)
                        ),
                        babylonMaterial.getScene()
                    );
                }

                const colorOp = CreateTextureWithFactorOperand(
                    baseColorTexture,
                    new Color4(babylonMaterial.baseColor.r, babylonMaterial.baseColor.g, babylonMaterial.baseColor.b, geometryOpacity),
                    TextureChannel.RGBA,
                    TextureColorSpace.SRGB
                );
                const transOp = CreateTextureWithFactorOperand(
                    transWeightResult.texture ?? null,
                    new Color4(transWeightResult.factor?.r ?? 1, transWeightResult.factor?.g ?? 1, transWeightResult.factor?.b ?? 1, 0.0), // alpha is 0 because we don't want to modify the base color alpha channel
                    TextureChannel.R
                );
                // glTF factors base color out of BOTH the diffuse and the transmission term, so the
                // exported base color must lerp from base_color toward the transmission tint by the
                // transmission weight (lerping toward a hardcoded white is only correct when that tint is
                // white, and otherwise washes base_color out for 0 < T < 1).
                //   - Volumetric transmission (KHR_materials_volume active): the tint is carried by the
                //     volume attenuationColor, so neutralize the surface tint toward white to avoid
                //     double-tinting.
                //   - Thin-walled / no depth: the surface base color IS the transmission tint, so lerp
                //     toward transmission_color (which equals base_color for a thin-walled round-trip,
                //     leaving the base color unchanged).
                const usesVolume = !babylonMaterial.geometryThinWalled && babylonMaterial.transmissionDepth > 0;
                const tintTargetOp = usesVolume
                    ? CreateFactorOperand(new Color4(1, 1, 1, 1))
                    : CreateTextureWithFactorOperand(
                          babylonMaterial.transmissionColorTexture,
                          new Color4(babylonMaterial.transmissionColor.r, babylonMaterial.transmissionColor.g, babylonMaterial.transmissionColor.b, 1.0),
                          TextureChannel.RGBA,
                          TextureColorSpace.SRGB
                      );
                const baseColorResult = await LerpTexturesAsync(
                    `base color (${babylonMaterial.name})`,
                    colorOp,
                    tintTargetOp,
                    transOp,
                    babylonMaterial.getScene(),
                    TextureColorSpace.SRGB
                );

                // Dispose the intermediate merged texture; LerpTexturesAsync does not own raw operand textures.
                if (babylonMaterial.geometryOpacityTexture && baseColorTexture) {
                    baseColorTexture.dispose();
                }

                this._baseColorOperands.set(babylonMaterial, { factor: baseColorResult.factor ?? null, texture: baseColorResult.texture ?? null });
                if (baseColorResult.texture) {
                    additionalTextures.push(baseColorResult.texture);
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
            const bakedTexture = this._exporter._materialExporter.getTextureInfo(operand?.texture ?? null);
            const bakedFactor = operand?.factor ?? null;

            const transmissionInfo: IKHRMaterialsTransmission = {
                transmissionFactor: bakedTexture ? 1.0 : (bakedFactor?.r ?? 0.0),
            };

            if (bakedTexture) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                transmissionInfo.transmissionTexture = bakedTexture;
            }

            const baseColorOperand = this._baseColorOperands.get(babylonMaterial);
            const baseColorBakedTexture = this._exporter._materialExporter.getTextureInfo(baseColorOperand?.texture ?? null);
            const baseColorBakedFactor = baseColorOperand?.factor ?? null;

            if (!node.pbrMetallicRoughness) {
                node.pbrMetallicRoughness = {};
            }
            node.pbrMetallicRoughness.baseColorFactor = baseColorBakedFactor
                ? [baseColorBakedFactor.r, baseColorBakedFactor.g, baseColorBakedFactor.b, baseColorBakedFactor.a]
                : [1, 1, 1, 1];

            if (baseColorBakedTexture) {
                node.pbrMetallicRoughness.baseColorTexture = baseColorBakedTexture;
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
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
