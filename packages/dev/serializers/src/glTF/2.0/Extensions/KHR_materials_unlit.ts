import type { IMaterial } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";

const NAME = "KHR_materials_unlit";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_unlit implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    constructor() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    public dispose() {}

    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
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

_Exporter.RegisterExtension(NAME, () => new KHR_materials_unlit());
