import type { IMaterial, IKHRMaterialsDispersion } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";

const NAME = "KHR_materials_dispersion";

/**
 * [Specification](TODO)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_dispersion implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _wasUsed = false;

    /** Constructor */
    constructor() {
    }

    /** */
    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    // public postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
    //     const additionalTextures: BaseTexture[] = [];

    //     if (babylonMaterial instanceof PBRMaterial) {
    //         if (this._isExtensionEnabled(babylonMaterial)) {
    //             if (babylonMaterial.subSurface.thicknessTexture) {
    //                 additionalTextures.push(babylonMaterial.subSurface.thicknessTexture);
    //             }
    //             return additionalTextures;
    //         }
    //     }

    //     return additionalTextures;
    // }

    private _isExtensionEnabled(mat: PBRMaterial): boolean {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        const subs = mat.subSurface;
        // this extension requires refraction to be enabled.
        if (!subs.isRefractionEnabled) {
            return false;
        }
        return true;
    }

    // private _hasTexturesExtension(mat: PBRMaterial): boolean {
    //     return mat.subSurface.thicknessTexture != null;
    // }

    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;

                // const subs = babylonMaterial.subSurface;
                const dispersion = 0.0;//subs.dispersion;
                
                const dispersionInfo: IKHRMaterialsDispersion = {
                    dispersion: dispersion,
                    // thicknessTexture: thicknessTexture,
                    // attenuationDistance: attenuationDistance,
                    // attenuationColor: attenuationColor,
                    // hasTextures: () => {
                    //     return this._hasTexturesExtension(babylonMaterial);
                    // },
                };
                node.extensions = node.extensions || {};
                node.extensions[NAME] = dispersionInfo;
            }
            resolve(node);
        });
    }
}

_Exporter.RegisterExtension(NAME, () => new KHR_materials_dispersion());
