// import type { IMaterial, IKHRMaterialsDiffuseTransmission } from "babylonjs-gltf2interface";
// import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
// import { _Exporter } from "../glTFExporter";
// import type { Material } from "core/Materials/material";
// import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
// import type { BaseTexture } from "core/Materials/Textures/baseTexture";

// const NAME = "KHR_materials_diffuse_transmission";

// /**
//  * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1825)
//  * !!! Experimental Extension Subject to Changes !!!
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// export class KHR_materials_diffuse_transmission implements IGLTFExporterExtensionV2 {
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
//         if (!subs.isTranslucencyEnabled) {
//             return false;
//         }

//         return (
//             !mat.unlit &&
//             !subs.useAlbedoToTintTranslucency &&
//             subs.useGltfStyleTextures &&
//             subs.volumeIndexOfRefraction === 1 &&
//             subs.minimumThickness === 0 &&
//             subs.maximumThickness === 0
//         );
//     }

//     private _hasTexturesExtension(mat: PBRMaterial): boolean {
//         return mat.subSurface.translucencyIntensityTexture != null || mat.subSurface.translucencyColorTexture != null;
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

//                 const diffuseTransmissionFactor = subs.translucencyIntensity == 1 ? undefined : subs.translucencyIntensity;
//                 const diffuseTransmissionTexture = this._exporter._glTFMaterialExporter._getTextureInfo(subs.translucencyIntensityTexture) ?? undefined;
//                 const diffuseTransmissionColorFactor = !subs.translucencyColor || subs.translucencyColor.equalsFloats(1.0, 1.0, 1.0) ? undefined : subs.translucencyColor.asArray();
//                 const diffuseTransmissionColorTexture = this._exporter._glTFMaterialExporter._getTextureInfo(subs.translucencyColorTexture) ?? undefined;

//                 const diffuseTransmissionInfo: IKHRMaterialsDiffuseTransmission = {
//                     diffuseTransmissionFactor,
//                     diffuseTransmissionTexture,
//                     diffuseTransmissionColorFactor,
//                     diffuseTransmissionColorTexture,
//                     hasTextures: () => {
//                         return this._hasTexturesExtension(babylonMaterial);
//                     },
//                 };
//                 node.extensions = node.extensions || {};
//                 node.extensions[NAME] = diffuseTransmissionInfo;
//             }
//             resolve(node);
//         });
//     }
// }

// _Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_diffuse_transmission(exporter));
