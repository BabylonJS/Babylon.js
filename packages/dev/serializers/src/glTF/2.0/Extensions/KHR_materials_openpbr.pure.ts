import { type IMaterial } from "babylonjs-gltf2interface";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { type Material } from "core/Materials/material";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";

const NAME = "KHR_materials_openpbr";

/**
 * TODO: Add link to specification. Specification still being drafted.
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_openpbr implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
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
            if (babylonMaterial instanceof OpenPBRMaterial) {
                this._wasUsed = true;

                node.extensions = node.extensions || {};
                node.extensions[NAME] = {};
            }
            resolve(node);
        });
    }
}

let _Registered = false;
/**
 * Registers the KHR_materials_openpbr glTF serializer extension with the {@link GLTFExporter}.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_materials_openpbr(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    GLTFExporter.RegisterExtension(NAME, () => new KHR_materials_openpbr());
}
