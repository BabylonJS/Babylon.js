import { type IKHRMaterialsRetroreflection, type IMaterial } from "babylonjs-gltf2interface";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Material } from "core/Materials/material";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";
import { Clamp } from "core/Maths/math.scalar.functions";
import { Logger } from "core/Misc/logger";
import { GLTFExporter } from "../glTFExporter";
import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";

const NAME = "KHR_materials_retroreflection";

/**
 * Exports the Release Candidate KHR_materials_retroreflection glTF extension.
 * [Specification](https://github.com/KhronosGroup/glTF/blob/166ed853dfde3780d9c7e3080291d835a926ebab/extensions/2.0/Khronos/KHR_materials_retroreflection/README.md)
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

    /**
     * Collects the retroreflection texture for export.
     * @param _context GLTF context of the material
     * @param _node Exported glTF material
     * @param babylonMaterial Source Babylon material
     * @returns Additional textures to export
     */
    public async postExportMaterialAdditionalTexturesAsync?(_context: string, _node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        if (babylonMaterial instanceof OpenPBRMaterial && this._isExtensionEnabled(babylonMaterial) && babylonMaterial.specularRetroreflectivityTexture) {
            return [babylonMaterial.specularRetroreflectivityTexture];
        }

        return [];
    }

    /**
     * Adds retroreflection properties to the exported glTF material.
     * @param context GLTF context of the material
     * @param node Exported glTF material
     * @param babylonMaterial Source Babylon material
     * @returns The exported glTF material
     */
    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (!(babylonMaterial instanceof OpenPBRMaterial) || !this._isExtensionEnabled(babylonMaterial)) {
                resolve(node);
                return;
            }

            this._wasUsed = true;
            node.extensions ||= {};

            const retroreflectionTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.specularRetroreflectivityTexture) ?? undefined;
            const factor = babylonMaterial.specularRetroreflectivity * (babylonMaterial.specularRetroreflectivityTexture?.level ?? 1);
            if (factor < 0 || factor > 1) {
                Logger.Warn(`${context}: ${NAME} factor for ${babylonMaterial.name} is outside [0, 1] and will be clamped.`);
            }
            const retroreflectionInfo: IKHRMaterialsRetroreflection = {
                retroreflectionFactor: factor === 0 ? undefined : Clamp(factor),
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
