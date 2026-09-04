import { type IMaterial, type IKHRMaterialsScatter } from "babylonjs-gltf2interface";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { type Material } from "core/Materials/material";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { Color3, Color4 } from "core/Maths/math.color.pure";
import { type Nullable } from "core/types";
import {
    type ITextureProcessOperand,
    ChannelMask,
    CreateFactorOperand,
    CreateTextureWithFactorOperand,
    DivideTexturesAsync,
    InvertTextureAsync,
    LerpTexturesAsync,
    MultiplyTexturesAsync,
    SingleScatterToMultiScatterAlbedoAsync,
    TextureChannel,
    TextureColorSpace,
} from "core/Materials/Textures/textureProcessor";
import { MergeTexturesAsync, CreateRGBAConfiguration, CreateTextureInput } from "core/Materials/Textures/textureMerger";

const NAME = "KHR_materials_scatter";

// Scatter result cached per material between postExportMaterialAdditionalTexturesAsync (where it is
// baked) and postExportMaterialAsync (where it is referenced). `ownedTextures` holds the textures this
// extension created (as opposed to raw material textures it references) and are disposed in dispose().
type ScatterResult = {
    strengthFactor: number;
    strengthTexture: Nullable<BaseTexture>;
    colorFactor: [number, number, number];
    colorTexture: Nullable<BaseTexture>;
    anisotropy: number;
    ownedTextures: BaseTexture[];
};

/**
 * TODO: In-progress specification
 * [Specification](https://github.com/KhronosGroup/glTF/blob/7ea427ed55d44427e83c0a6d1c87068b1a4151c5/extensions/2.0/Khronos/KHR_materials_scatter/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_scatter implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: GLTFExporter;

    private _wasUsed = false;

    private _scatterResults = new Map<Material, ScatterResult>();

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    public dispose() {
        for (const result of this._scatterResults.values()) {
            for (const texture of result.ownedTextures) {
                texture.dispose();
            }
        }
        this._scatterResults.clear();
    }

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    /**
     * After exporting a material, bake the combined multi-scatter color texture (if any).
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns array of additional textures to export
     */
    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];

        if (babylonMaterial instanceof OpenPBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
            const result = await this._bakeScatterAsync(babylonMaterial);
            this._scatterResults.set(babylonMaterial, result);
            if (result.strengthTexture) {
                additionalTextures.push(result.strengthTexture);
            }
            if (result.colorTexture) {
                additionalTextures.push(result.colorTexture);
            }
        }

        return additionalTextures;
    }

    private _isExtensionEnabled(mat: OpenPBRMaterial): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        // Scattering is enabled if either subsurface or transmission scattering is enabled.
        // Transmission scattering is only enabled if the material is not thin-walled, and has a non-zero transmission depth.
        const transmissionVolume = mat.transmissionWeight > 0 && !mat.geometryThinWalled && mat.transmissionDepth > 0;
        const transmissionScatter = transmissionVolume && !mat.transmissionScatter.equals(Color3.Black());
        if (transmissionScatter || mat.subsurfaceWeight > 0) {
            return true;
        }
        return false;
    }

    /**
     * Bake the KHR_materials_scatter data for an OpenPBR material, dispatching on thin-walled vs volumetric.
     * @param mat the OpenPBR material to bake scatter data for
     * @returns the scatter strength, multi-scatter color, and anisotropy (constants and/or baked textures)
     */
    private async _bakeScatterAsync(mat: OpenPBRMaterial): Promise<ScatterResult> {
        return mat.geometryThinWalled ? await this._bakeThinWalledScatterAsync(mat) : await this._bakeVolumetricScatterAsync(mat);
    }

    /**
     * Per-pixel transmission fraction operand `T / (1 - (1 - T)(1 - S))` from the (possibly textured)
     * transmission weight `T` and subsurface weight `S`. Folds to a constant when neither weight has a
     * texture. The subsurface fraction is `1 - transmissionFraction`. Weights are read from the
     * glTF-convention channels (transmission R; subsurface A when packed in alpha, otherwise R).
     * @param mat the OpenPBR material whose weights drive the fraction
     * @returns an operand carrying the transmission fraction (constant or baked texture)
     */
    private async _computeTransmissionFractionAsync(mat: OpenPBRMaterial): Promise<ITextureProcessOperand> {
        const scene = mat.getScene();
        const transmissionWeight = mat.transmissionWeight;
        const subsurfaceWeight = mat.subsurfaceWeight;
        const subsurfaceChannel = mat._useSubsurfaceWeightFromTextureAlpha ? TextureChannel.A : TextureChannel.R;
        const makeTransmissionWeightOp = () =>
            CreateTextureWithFactorOperand(mat.transmissionWeightTexture, new Color4(transmissionWeight, transmissionWeight, transmissionWeight, 1.0), TextureChannel.R);
        const makeSubsurfaceWeightOp = () =>
            CreateTextureWithFactorOperand(mat.subsurfaceWeightTexture, new Color4(subsurfaceWeight, subsurfaceWeight, subsurfaceWeight, 1.0), subsurfaceChannel);

        const oneMinusT = await InvertTextureAsync(`scatter 1-T (${mat.name})`, makeTransmissionWeightOp(), scene, ChannelMask.RGB);
        const oneMinusS = await InvertTextureAsync(`scatter 1-S (${mat.name})`, makeSubsurfaceWeightOp(), scene, ChannelMask.RGB);
        const oneMinusProduct = await MultiplyTexturesAsync(`scatter (1-T)(1-S) (${mat.name})`, oneMinusT, oneMinusS, scene);
        const denominator = await InvertTextureAsync(`scatter denom (${mat.name})`, oneMinusProduct, scene, ChannelMask.RGB);
        return await DivideTexturesAsync(`scatter transmission fraction (${mat.name})`, makeTransmissionWeightOp(), denominator, scene);
    }

    /**
     * Bake the constant slab fractions used only for the scatter anisotropy blend (glTF has no
     * anisotropy texture, so anisotropy always uses the constant weights).
     * @param mat the OpenPBR material whose constant weights drive the fractions
     * @returns the constant transmission and subsurface fractions of the dielectric
     */
    private _constantFractions(mat: OpenPBRMaterial): { transmissionFraction: number; subsurfaceFraction: number } {
        const subsurfaceFractionOfDielectric = (1.0 - mat.transmissionWeight) * mat.subsurfaceWeight;
        const denominator = subsurfaceFractionOfDielectric + mat.transmissionWeight;
        const reciprocal = 1.0 / Math.max(denominator, 1e-6);
        return { transmissionFraction: mat.transmissionWeight * reciprocal, subsurfaceFraction: subsurfaceFractionOfDielectric * reciprocal };
    }

    /**
     * Volumetric scatter: glTF stores a single multi-scatter color blended from the transmission and
     * subsurface slabs, with `scatterStrength = 1`.
     *
     * OpenPBR represents the two slabs as:
     *  - The transmission slab stores `transmission_scatter = -log(transmissionColor) * singleScatterAlbedo`
     *    (OpenPBR 1.1). We recover the single-scatter albedo by dividing out `-log(transmissionColor)`,
     *    then convert it to a multi-scatter albedo (the quantity KHR_materials_scatter stores).
     *  - The subsurface slab stores `subsurface_color`, which is already a multi-scatter albedo.
     *
     * The two are blended by `lerp(subsurface, transmission, transmissionFraction)` (the two fractions
     * sum to one). The whole computation is exact per-pixel when any slab or weight carries a texture,
     * and folds to a constant factor when none do.
     *
     * TODO: OpenPBR 1.2 will define `transmission_scatter` as the single-scatter albedo directly,
     * which removes the `-log(transmissionColor)` division below.
     * @param mat the OpenPBR material to bake volumetric scatter data for
     * @returns scatter strength (always 1), the blended multi-scatter color, and blended anisotropy
     */
    private async _bakeVolumetricScatterAsync(mat: OpenPBRMaterial): Promise<ScatterResult> {
        const scene = mat.getScene();
        const transmissionWeight = mat.transmissionWeight;
        const subsurfaceWeight = mat.subsurfaceWeight;

        // Transmission slab → multi-scatter albedo.
        let transmissionMultiOp: ITextureProcessOperand;
        if (transmissionWeight > 0) {
            const scatter = mat.transmissionScatter;
            const transmissionScatterOp = CreateTextureWithFactorOperand(mat.transmissionScatterTexture, new Color4(scatter.r, scatter.g, scatter.b, 1.0));
            const color = mat.transmissionColor;
            const extinctionTimesDepth = CreateFactorOperand(new Color4(-Math.log(color.r), -Math.log(color.g), -Math.log(color.b), 1.0));
            const singleScatterOp = await DivideTexturesAsync(`scatter single-scatter (${mat.name})`, transmissionScatterOp, extinctionTimesDepth, scene);
            transmissionMultiOp = await SingleScatterToMultiScatterAlbedoAsync(`scatter multi-scatter (${mat.name})`, singleScatterOp, scene);
        } else {
            transmissionMultiOp = CreateFactorOperand(new Color4(0, 0, 0, 1.0));
        }

        // Subsurface slab → multi-scatter albedo (subsurface_color already is one).
        let subsurfaceMultiOp: ITextureProcessOperand;
        if (subsurfaceWeight > 0) {
            const color = mat.subsurfaceColor;
            const colorSpace = mat.subsurfaceColorTexture?.gammaSpace ? TextureColorSpace.SRGB : TextureColorSpace.Linear;
            subsurfaceMultiOp = CreateTextureWithFactorOperand(mat.subsurfaceColorTexture, new Color4(color.r, color.g, color.b, 1.0), TextureChannel.RGBA, colorSpace);
        } else {
            subsurfaceMultiOp = CreateFactorOperand(new Color4(0, 0, 0, 1.0));
        }

        // multiscatterColor = lerp(subsurface, transmission, transmissionFraction). Force opaque alpha and
        // output sRGB so the baked glTF color texture round-trips through the loader (which reads it as sRGB).
        const transmissionFractionOp = await this._computeTransmissionFractionAsync(mat);
        const combined = await LerpTexturesAsync(
            `scatter multiscatter color (${mat.name})`,
            subsurfaceMultiOp,
            transmissionMultiOp,
            transmissionFractionOp,
            scene,
            TextureColorSpace.SRGB,
            ChannelMask.RGB
        );

        const fractions = this._constantFractions(mat);
        const anisotropy = mat.transmissionScatterAnisotropy * fractions.transmissionFraction + mat.subsurfaceScatterAnisotropy * fractions.subsurfaceFraction;
        const ownedTextures: BaseTexture[] = [];
        if (combined.texture) {
            ownedTextures.push(combined.texture);
        }
        return {
            strengthFactor: 1.0,
            strengthTexture: null,
            colorFactor: combined.texture ? [1, 1, 1] : [combined.factor?.r ?? 0, combined.factor?.g ?? 0, combined.factor?.b ?? 0],
            colorTexture: combined.texture ?? null,
            anisotropy,
            ownedTextures,
        };
    }

    /**
     * Thin-walled scatter: there is no volumetric slab, so the multi-scatter color is simply
     * `subsurface_color` and the scatter strength is the subsurface fraction of the dielectric
     * `S(1-T) / (1 - (1-T)(1-S))` (= `1 - transmissionFraction`). This is the exact inverse of the
     * loader's thin-walled `ThinWalledScatterWeightsAsync`, so it round-trips.
     * @param mat the OpenPBR material to bake thin-walled scatter data for
     * @returns the subsurface fraction as scatter strength, subsurface_color as multi-scatter color, and subsurface anisotropy
     */
    private async _bakeThinWalledScatterAsync(mat: OpenPBRMaterial): Promise<ScatterResult> {
        const scene = mat.getScene();

        // scatterStrength = subsurfaceFraction = 1 - transmissionFraction.
        const transmissionFractionOp = await this._computeTransmissionFractionAsync(mat);
        const subsurfaceFractionOp = await InvertTextureAsync(`scatter strength (${mat.name})`, transmissionFractionOp, scene, ChannelMask.RGB);

        const ownedTextures: BaseTexture[] = [];
        let strengthFactor = subsurfaceFractionOp.factor?.r ?? 0;
        let strengthTexture: Nullable<BaseTexture> = null;
        if (subsurfaceFractionOp.texture) {
            // KHR_materials_scatter stores scatterStrengthTexture in the alpha channel, but the texture
            // processor produces the fraction in RGB, so route it (R -> A) via a channel merge.
            strengthTexture = await MergeTexturesAsync(
                `scatter strength (${mat.name})`,
                CreateRGBAConfiguration(
                    CreateTextureInput(subsurfaceFractionOp.texture, 0),
                    CreateTextureInput(subsurfaceFractionOp.texture, 0),
                    CreateTextureInput(subsurfaceFractionOp.texture, 0),
                    CreateTextureInput(subsurfaceFractionOp.texture, 0)
                ),
                scene
            );
            subsurfaceFractionOp.texture.dispose(); // intermediate; the merged texture replaces it
            strengthFactor = 1.0;
            ownedTextures.push(strengthTexture);
        }

        const color = mat.subsurfaceColor;
        return {
            strengthFactor,
            strengthTexture,
            // multiscatterColor is subsurface_color directly (factor and/or the raw material texture, not owned).
            colorFactor: [color.r, color.g, color.b],
            colorTexture: mat.subsurfaceColorTexture,
            anisotropy: mat.subsurfaceScatterAnisotropy,
            ownedTextures,
        };
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

                const result = this._scatterResults.get(babylonMaterial);

                const scatterInfo: IKHRMaterialsScatter = {
                    scatterStrengthFactor: result?.strengthFactor ?? 1.0,
                    scatterAnisotropy: result?.anisotropy ?? 0,
                };

                // Scatter strength (thin-walled bakes a subsurface-fraction texture; volumetric is always 1).
                if (result?.strengthTexture) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    const strengthTextureInfo = this._exporter._materialExporter.getTextureInfo(result.strengthTexture);
                    if (strengthTextureInfo) {
                        scatterInfo.scatterStrengthFactor = 1.0;
                        scatterInfo.scatterStrengthTexture = strengthTextureInfo;
                    }
                }

                // Multi-scatter color (blended albedo for volumetric; subsurface_color for thin-walled).
                if (result) {
                    scatterInfo.multiscatterColorFactor = result.colorFactor;
                }
                if (result?.colorTexture) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                    const colorTextureInfo = this._exporter._materialExporter.getTextureInfo(result.colorTexture);
                    if (colorTextureInfo) {
                        scatterInfo.multiscatterColorTexture = colorTextureInfo;
                    }
                }

                node.extensions = node.extensions || {};
                node.extensions[NAME] = scatterInfo;
            }
            resolve(node);
        });
    }
}

let _Registered = false;
/**
 * Registers the KHR_materials_scatter glTF serializer extension with the {@link GLTFExporter}.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_materials_scatter(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_scatter(exporter), 101);
}
