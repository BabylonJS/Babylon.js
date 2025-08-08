import type { IMaterial, IEXTMaterialsClearcoatDarkening } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Nullable } from "core/types";

const NAME = "EXT_materials_clearcoat_darkening";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_materials_clearcoat_darkening implements IGLTFExporterExtensionV2 {
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
        if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.coatDarkening) {
                if (babylonMaterial.coatDarkeningTexture) {
                    additionalTextures.push(babylonMaterial.coatDarkeningTexture);
                }
                return additionalTextures;
            }
        }

        return [];
    }

    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            let coatDarkeningFactor: Nullable<number> = null;
            let coatDarkeningTexture: Nullable<BaseTexture> = null;
            if (babylonMaterial instanceof OpenPBRMaterial) {
                coatDarkeningFactor = babylonMaterial.coatDarkening;
                coatDarkeningTexture = babylonMaterial.coatDarkeningTexture;
            }
            if (coatDarkeningFactor === null || (coatDarkeningFactor === 1.0 && coatDarkeningTexture === null)) {
                resolve(node);
                return;
            }

            this._wasUsed = true;

            // This material must have the clearcoat extension already before
            // we can add the clearcoat darkening sub-extension
            const parentExt = node.extensions ? node.extensions["KHR_materials_clearcoat"] : null;
            if (!parentExt) {
                resolve(node);
                return;
            }

            const coatDarkeningTextureInfo = this._exporter._materialExporter.getTextureInfo(coatDarkeningTexture);

            const coatDarkeningInfo: IEXTMaterialsClearcoatDarkening = {
                clearcoatDarkeningFactor: coatDarkeningFactor,
                clearcoatDarkeningTexture: coatDarkeningTextureInfo ?? undefined,
            };

            if (coatDarkeningInfo.clearcoatDarkeningTexture !== null) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
            }

            parentExt.extensions = parentExt.extensions || {};
            parentExt.extensions[NAME] = coatDarkeningInfo;

            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new EXT_materials_clearcoat_darkening(exporter));
