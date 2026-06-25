import { type IMaterial, type IKHRMaterialsIor } from "babylonjs-gltf2interface";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { type Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";

const NAME = "KHR_materials_ior";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_ior/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_ior implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    constructor() {}

    /** Dispose */
    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    private _isExtensionEnabled(mat: PBRMaterial | OpenPBRMaterial): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        if (mat instanceof OpenPBRMaterial) {
            return mat.specularIor != 1.5; // 1.5 is normative default value.
        } else if (mat instanceof PBRMaterial) {
            return mat.indexOfRefraction != undefined && mat.indexOfRefraction != 1.5; // 1.5 is normative default value.
        }
        return false;
    }

    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns promise, resolves with the material
     */
    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;

                const iorInfo: IKHRMaterialsIor = {
                    ior: babylonMaterial.indexOfRefraction,
                };
                node.extensions = node.extensions || {};
                node.extensions[NAME] = iorInfo;
            } else if (babylonMaterial instanceof OpenPBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;
                const iorInfo: IKHRMaterialsIor = {
                    ior: babylonMaterial.specularIor,
                };
                node.extensions = node.extensions || {};
                node.extensions[NAME] = iorInfo;
            }
            resolve(node);
        });
    }
}

let _Registered = false;
/**
 * Registers the KHR_materials_ior glTF serializer extension with the {@link GLTFExporter}.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_materials_ior(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    GLTFExporter.RegisterExtension(NAME, () => new KHR_materials_ior());
}
