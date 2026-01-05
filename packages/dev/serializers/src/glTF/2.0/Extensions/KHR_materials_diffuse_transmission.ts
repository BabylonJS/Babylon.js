import type { IMaterial, IKHRMaterialsDiffuseTransmission } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Logger } from "core/Misc/logger";
import type { Nullable } from "core/types";

const NAME = "KHR_materials_diffuse_transmission";

/**
 * Get the appropriate translucency intensity texture for the material.
 * @internal
 */
function GetTranslucencyIntensityTexture(context: string, babylonMaterial: PBRMaterial): Nullable<BaseTexture> {
    const subs = babylonMaterial.subSurface;
    let texture = null;

    // Check if translucency intensity texture is available or can be derived from thickness texture
    if (subs.translucencyIntensityTexture) {
        texture = subs.translucencyIntensityTexture;
    } else if (subs.thicknessTexture && subs.useMaskFromThicknessTexture) {
        texture = subs.thicknessTexture;
    }

    if (texture && !subs.useGltfStyleTextures) {
        Logger.Warn(`${context}: Translucency intensity texture is not supported when useGltfStyleTextures = false. Ignoring for: ${babylonMaterial.name}`, 1);
        return null;
    }

    return texture;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1825)
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_diffuse_transmission implements IGLTFExporterExtensionV2 {
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

        if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
            const translucencyIntensityTexture = GetTranslucencyIntensityTexture(context, babylonMaterial);
            if (translucencyIntensityTexture) {
                additionalTextures.push(translucencyIntensityTexture);
            }
            if (babylonMaterial.subSurface.translucencyColorTexture) {
                additionalTextures.push(babylonMaterial.subSurface.translucencyColorTexture);
            }
            return additionalTextures;
        }

        return additionalTextures;
    }

    private _isExtensionEnabled(mat: PBRMaterial): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        const subs = mat.subSurface;
        if (!subs.isTranslucencyEnabled) {
            return false;
        }

        return (
            !mat.unlit &&
            !subs.useAlbedoToTintTranslucency &&
            subs.useGltfStyleTextures &&
            subs.volumeIndexOfRefraction === 1 &&
            subs.minimumThickness === 0 &&
            subs.maximumThickness === 0
        );
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
                const translucencyIntensityTexture = GetTranslucencyIntensityTexture(context, babylonMaterial);

                const diffuseTransmissionFactor = subs.translucencyIntensity == 0 ? undefined : subs.translucencyIntensity;
                const diffuseTransmissionTexture = this._exporter._materialExporter.getTextureInfo(translucencyIntensityTexture) ?? undefined;
                const diffuseTransmissionColorFactor = !subs.translucencyColor || subs.translucencyColor.equalsFloats(1.0, 1.0, 1.0) ? undefined : subs.translucencyColor.asArray();
                const diffuseTransmissionColorTexture = this._exporter._materialExporter.getTextureInfo(subs.translucencyColorTexture) ?? undefined;

                const diffuseTransmissionInfo: IKHRMaterialsDiffuseTransmission = {
                    diffuseTransmissionFactor,
                    diffuseTransmissionTexture,
                    diffuseTransmissionColorFactor,
                    diffuseTransmissionColorTexture,
                };

                if (diffuseTransmissionTexture || diffuseTransmissionColorTexture) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                node.extensions = node.extensions || {};
                node.extensions[NAME] = diffuseTransmissionInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_diffuse_transmission(exporter));
