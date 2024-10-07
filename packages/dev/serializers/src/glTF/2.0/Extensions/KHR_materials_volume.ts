// import type { IMaterial, IKHRMaterialsVolume } from "babylonjs-gltf2interface";
// import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
// import { _Exporter } from "../glTFExporter";
// import type { Material } from "core/Materials/material";
// import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
// import type { BaseTexture } from "core/Materials/Textures/baseTexture";
// import { Color3 } from "core/Maths/math.color";

// const NAME = "KHR_materials_volume";

// /**
//  * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md)
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// export class KHR_materials_volume implements IGLTFExporterExtensionV2 {
//     /** Name of this extension */
//     public readonly name = NAME;

//     /** Defines whether this extension is enabled */
//     public enabled = true;

//     /** Defines whether this extension is required */
//     public required = false;

//     private _exporter: _Exporter;

//     private _wasUsed = false;

//     constructor(exporter: _Exporter) {
//         this._exporter = exporter;
//     }

//     public dispose() {}

//     /** @internal */
//     public get wasUsed() {
//         return this._wasUsed;
//     }

//     /**
//      * After exporting a material, deal with additional textures
//      * @param context GLTF context of the material
//      * @param node exported GLTF node
//      * @param babylonMaterial corresponding babylon material
//      * @returns array of additional textures to export
//      */
//     public postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
//         const additionalTextures: BaseTexture[] = [];

//         if (babylonMaterial instanceof PBRMaterial) {
//             if (this._isExtensionEnabled(babylonMaterial)) {
//                 if (babylonMaterial.subSurface.thicknessTexture) {
//                     additionalTextures.push(babylonMaterial.subSurface.thicknessTexture);
//                 }
//                 return additionalTextures;
//             }
//         }

//         return additionalTextures;
//     }

//     private _isExtensionEnabled(mat: PBRMaterial): boolean {
//         // This extension must not be used on a material that also uses KHR_materials_unlit
//         if (mat.unlit) {
//             return false;
//         }
//         const subs = mat.subSurface;
//         // this extension requires either the KHR_materials_transmission or KHR_materials_diffuse_transmission extensions.
//         if (!subs.isRefractionEnabled && !subs.isTranslucencyEnabled) {
//             return false;
//         }
//         return (
//             (subs.maximumThickness != undefined && subs.maximumThickness != 0) ||
//             (subs.tintColorAtDistance != undefined && subs.tintColorAtDistance != Number.POSITIVE_INFINITY) ||
//             (subs.tintColor != undefined && subs.tintColor != Color3.White()) ||
//             this._hasTexturesExtension(mat)
//         );
//     }

//     private _hasTexturesExtension(mat: PBRMaterial): boolean {
//         return mat.subSurface.thicknessTexture != null;
//     }

//     /**
//      * After exporting a material
//      * @param context GLTF context of the material
//      * @param node exported GLTF node
//      * @param babylonMaterial corresponding babylon material
//      * @returns promise that resolves with the updated node
//      */
//     public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
//         return new Promise((resolve) => {
//             if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
//                 this._wasUsed = true;

//                 const subs = babylonMaterial.subSurface;
//                 const thicknessFactor = subs.maximumThickness == 0 ? undefined : subs.maximumThickness;
//                 const thicknessTexture = this._exporter._glTFMaterialExporter._getTextureInfo(subs.thicknessTexture) ?? undefined;
//                 const attenuationDistance = subs.tintColorAtDistance == Number.POSITIVE_INFINITY ? undefined : subs.tintColorAtDistance;
//                 const attenuationColor = subs.tintColor.equalsFloats(1.0, 1.0, 1.0) ? undefined : subs.tintColor.asArray();

//                 const volumeInfo: IKHRMaterialsVolume = {
//                     thicknessFactor: thicknessFactor,
//                     thicknessTexture: thicknessTexture,
//                     attenuationDistance: attenuationDistance,
//                     attenuationColor: attenuationColor,
//                     hasTextures: () => {
//                         return this._hasTexturesExtension(babylonMaterial);
//                     },
//                 };
//                 node.extensions = node.extensions || {};
//                 node.extensions[NAME] = volumeInfo;
//             }
//             resolve(node);
//         });
//     }
// }

// _Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_volume(exporter));
