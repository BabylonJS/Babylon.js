import { type IKHRMaterialsRetroreflection, type IMaterial } from "babylonjs-gltf2interface";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Material } from "core/Materials/material";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";
import { GLTFExporter } from "../glTFExporter";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";

const NAME = "KHR_materials_retroreflection";

/**
 * Exports the draft KHR_materials_retroreflection glTF extension.
 * [Specification](https://github.com/KhronosGroup/glTF/blob/bfb9d65397d19cf630a36a3d1f95cb86a2f671c4/extensions/2.0/Khronos/KHR_materials_retroreflection/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_retroreflection implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    constructor(private readonly _exporter: GLTFExporter) {}

    /** Dispose */
    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    public async postExportMaterialAdditionalTexturesAsync?(_context: string, _node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        if (babylonMaterial instanceof OpenPBRMaterial && this._isExtensionEnabled(babylonMaterial) && babylonMaterial.specularRetroreflectivityTexture) {
            return [babylonMaterial.specularRetroreflectivityTexture];
        }

        return [];
    }

    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(_context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (!(babylonMaterial instanceof OpenPBRMaterial) || !this._isExtensionEnabled(babylonMaterial)) {
                resolve(node);
                return;
            }

            this._wasUsed = true;
            node.extensions ||= {};

            const retroreflectionTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.specularRetroreflectivityTexture) ?? undefined;
            const retroreflectionInfo: IKHRMaterialsRetroreflection = {
                retroreflectionFactor: babylonMaterial.specularRetroreflectivity === 0 ? undefined : babylonMaterial.specularRetroreflectivity,
                retroreflectionTexture,
            };

            if (retroreflectionTexture) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
            }

            node.extensions[NAME] = retroreflectionInfo;
            resolve(node);
        });
    }

    private _isExtensionEnabled(material: OpenPBRMaterial): boolean {
        return material.specularRetroreflectivity !== 0 || !!material.specularRetroreflectivityTexture;
    }
}

let _Registered = false;

/**
 * Registers the KHR_materials_retroreflection glTF serializer extension with the {@link GLTFExporter}.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_materials_retroreflection(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_retroreflection(exporter));
}
