import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { IMaterial, IKHRMaterialsEmissiveStrength } from "babylonjs-gltf2interface";

const NAME = "KHR_materials_emissive_strength";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_emissive_strength implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    /** Dispose */
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
     * @returns promise, resolves with the material
     */
    public async postExportMaterialAsync(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return await new Promise((resolve) => {
            if (!(babylonMaterial instanceof PBRMaterial)) {
                return resolve(node);
            }

            const emissiveStrength = babylonMaterial.emissiveIntensity;

            if (emissiveStrength !== 1) {
                this._wasUsed = true;

                const emissiveStrengthInfo: IKHRMaterialsEmissiveStrength = {
                    emissiveStrength,
                };
                node.extensions ||= {};
                node.extensions[NAME] = emissiveStrengthInfo;
            }

            return resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, () => new KHR_materials_emissive_strength());
