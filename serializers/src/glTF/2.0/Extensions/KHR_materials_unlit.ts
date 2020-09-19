import { IMaterial } from "babylonjs-gltf2interface";
import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Material } from 'babylonjs/Materials/material';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { StandardMaterial } from 'babylonjs/Materials/standardMaterial';

const NAME = "KHR_materials_unlit";

/**
 * @hidden
 */
export class KHR_materials_unlit implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    constructor(exporter: _Exporter) {
    }

    /** @hidden */
    public get wasUsed() {
        return this._wasUsed;
    }

    public dispose() {
    }

    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve, reject) => {
            let unlitMaterial = false;

            if (babylonMaterial instanceof PBRMaterial) {
                unlitMaterial = babylonMaterial.unlit;
            } else if (babylonMaterial instanceof StandardMaterial) {
                unlitMaterial = babylonMaterial.disableLighting;
            }

            if (unlitMaterial) {
                this._wasUsed = true;

                if (node.extensions == null) {
                    node.extensions = {};
                }

                node.extensions[NAME] = {};
            }

            resolve(node);
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_unlit(exporter));