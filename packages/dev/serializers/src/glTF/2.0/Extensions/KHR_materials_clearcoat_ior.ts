import type { IMaterial, IKHRMaterialsClearcoatIor } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Nullable } from "core/types";

const NAME = "KHR_materials_clearcoat_ior";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_clearcoat_ior implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: GLTFExporter;

    private _wasUsed = false;

    /**
     * @param exporter The glTF exporter
     */
    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    /** @internal */
    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    // eslint-disable-next-line no-restricted-syntax
    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
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
            let coatIor: Nullable<number> = null;
            if (babylonMaterial instanceof OpenPBRMaterial) {
                coatIor = babylonMaterial.coatIor;
            } else if (babylonMaterial instanceof PBRMaterial) {
                coatIor = babylonMaterial.clearCoat.indexOfRefraction;
            }
            if (coatIor === null || coatIor === 1.5) {
                return resolve(node);
            }

            // This material must have the clearcoat extension already before
            // we can add the clearcoat IOR sub-extension
            const parentExt = node.extensions ? node.extensions["KHR_materials_clearcoat"] : null;
            if (!parentExt) {
                return resolve(node);
            }

            this._wasUsed = true;

            const coatIorInfo: IKHRMaterialsClearcoatIor = {
                clearcoatIor: coatIor,
            };

            if (coatIorInfo.clearcoatIor !== null) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
            }

            parentExt.extensions = parentExt.extensions || {};
            parentExt.extensions[NAME] = coatIorInfo;

            return resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_clearcoat_ior(exporter));
