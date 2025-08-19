import type { IMaterial, IEXTMaterialsClearcoatColor } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

const NAME = "EXT_materials_clearcoat_color";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_materials_clearcoat_color implements IGLTFExporterExtensionV2 {
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
            if (babylonMaterial.clearCoat.isEnabled) {
                if (babylonMaterial.clearCoat.tintTexture) {
                    additionalTextures.push(babylonMaterial.clearCoat.tintTexture);
                }
                return additionalTextures;
            }
        } else if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.coatWeight > 0) {
                if (babylonMaterial.coatColorTexture) {
                    additionalTextures.push(babylonMaterial.coatColorTexture);
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
                if (!babylonMaterial.clearCoat.isEnabled) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                // This material must have the clearcoat extension already before
                // we can add the clearcoat color sub-extension
                const parentExt = node.extensions ? node.extensions["KHR_materials_clearcoat"] : null;
                if (!parentExt) {
                    resolve(node);
                    return;
                }

                const coatColorTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.clearCoat.tintTexture);

                const clearCoatInfo: IEXTMaterialsClearcoatColor = {
                    clearcoatColorFactor: babylonMaterial.clearCoat.tintColor.asArray(),
                    clearcoatColorTexture: coatColorTextureInfo ?? undefined,
                };

                if (clearCoatInfo.clearcoatColorTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }

                parentExt.extensions = parentExt.extensions || {};
                parentExt.extensions[NAME] = clearCoatInfo;
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                if (babylonMaterial.coatWeight == 0.0) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                // This material must have the clearcoat extension already before
                // we can add the clearcoat color sub-extension
                const parentExt = node.extensions ? node.extensions["KHR_materials_clearcoat"] : null;
                if (!parentExt) {
                    resolve(node);
                    return;
                }

                const coatColorTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.coatWeightTexture);
                const clearCoatInfo: IEXTMaterialsClearcoatColor = {
                    clearcoatColorFactor: babylonMaterial.coatColor.asArray(),
                    clearcoatColorTexture: coatColorTextureInfo ?? undefined,
                };

                if (clearCoatInfo.clearcoatColorTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }
                parentExt.extensions = parentExt.extensions || {};
                parentExt.extensions[NAME] = clearCoatInfo;
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new EXT_materials_clearcoat_color(exporter));
