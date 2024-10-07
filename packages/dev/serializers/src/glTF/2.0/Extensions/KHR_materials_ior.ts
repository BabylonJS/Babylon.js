// import type { IMaterial, IKHRMaterialsIor } from "babylonjs-gltf2interface";
// import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
// import { _Exporter } from "../glTFExporter";
// import type { Material } from "core/Materials/material";
// import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";

// const NAME = "KHR_materials_ior";

// /**
//  * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_ior/README.md)
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// export class KHR_materials_ior implements IGLTFExporterExtensionV2 {
//     /** Name of this extension */
//     public readonly name = NAME;

//     /** Defines whether this extension is enabled */
//     public enabled = true;

//     /** Defines whether this extension is required */
//     public required = false;

//     private _wasUsed = false;

//     constructor() {}

//     /** Dispose */
//     public dispose() {}

//     /** @internal */
//     public get wasUsed() {
//         return this._wasUsed;
//     }

//     private _isExtensionEnabled(mat: PBRMaterial): boolean {
//         // This extension must not be used on a material that also uses KHR_materials_unlit
//         if (mat.unlit) {
//             return false;
//         }
//         return mat.indexOfRefraction != undefined && mat.indexOfRefraction != 1.5; // 1.5 is normative default value.
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

//                 const iorInfo: IKHRMaterialsIor = {
//                     ior: babylonMaterial.indexOfRefraction,
//                 };
//                 node.extensions = node.extensions || {};
//                 node.extensions[NAME] = iorInfo;
//             }
//             resolve(node);
//         });
//     }
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// _Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_ior());
