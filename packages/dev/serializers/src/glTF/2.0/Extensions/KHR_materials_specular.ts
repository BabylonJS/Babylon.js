// import type { IMaterial, IKHRMaterialsSpecular } from "babylonjs-gltf2interface";
// import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
// import { _Exporter } from "../glTFExporter";
// import type { Material } from "core/Materials/material";
// import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
// import type { BaseTexture } from "core/Materials/Textures/baseTexture";

// const NAME = "KHR_materials_specular";

// /**
//  * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_specular/README.md)
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// export class KHR_materials_specular implements IGLTFExporterExtensionV2 {
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

//     /** Dispose */
//     public dispose() {}

//     /** @internal */
//     public get wasUsed() {
//         return this._wasUsed;
//     }

//     /**
//      * After exporting a material, deal with the additional textures
//      * @param context GLTF context of the material
//      * @param node exported GLTF node
//      * @param babylonMaterial corresponding babylon material
//      * @returns array of additional textures to export
//      */
//     public postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
//         const additionalTextures: BaseTexture[] = [];

//         if (babylonMaterial instanceof PBRMaterial) {
//             if (this._isExtensionEnabled(babylonMaterial)) {
//                 if (babylonMaterial.metallicReflectanceTexture) {
//                     additionalTextures.push(babylonMaterial.metallicReflectanceTexture);
//                 }
//                 if (babylonMaterial.reflectanceTexture) {
//                     additionalTextures.push(babylonMaterial.reflectanceTexture);
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
//         return (
//             (mat.metallicF0Factor != undefined && mat.metallicF0Factor != 1.0) ||
//             (mat.metallicReflectanceColor != undefined && !mat.metallicReflectanceColor.equalsFloats(1.0, 1.0, 1.0)) ||
//             this._hasTexturesExtension(mat)
//         );
//     }

//     private _hasTexturesExtension(mat: PBRMaterial): boolean {
//         return mat.metallicReflectanceTexture != null || mat.reflectanceTexture != null;
//     }

//     /**
//      * After exporting a material
//      * @param context GLTF context of the material
//      * @param node exported GLTF node
//      * @param babylonMaterial corresponding babylon material
//      * @returns promise, resolves with the material
//      */
//     public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
//         return new Promise((resolve) => {
//             if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
//                 this._wasUsed = true;

//                 node.extensions = node.extensions || {};

//                 const metallicReflectanceTexture = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.metallicReflectanceTexture) ?? undefined;
//                 const reflectanceTexture = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.reflectanceTexture) ?? undefined;
//                 const metallicF0Factor = babylonMaterial.metallicF0Factor == 1.0 ? undefined : babylonMaterial.metallicF0Factor;
//                 const metallicReflectanceColor = babylonMaterial.metallicReflectanceColor.equalsFloats(1.0, 1.0, 1.0)
//                     ? undefined
//                     : babylonMaterial.metallicReflectanceColor.asArray();

//                 const specularInfo: IKHRMaterialsSpecular = {
//                     specularFactor: metallicF0Factor,
//                     specularTexture: metallicReflectanceTexture,
//                     specularColorFactor: metallicReflectanceColor,
//                     specularColorTexture: reflectanceTexture,
//                     hasTextures: () => {
//                         return this._hasTexturesExtension(babylonMaterial);
//                     },
//                 };
//                 node.extensions[NAME] = specularInfo;
//             }
//             resolve(node);
//         });
//     }
// }

// _Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_specular(exporter));
