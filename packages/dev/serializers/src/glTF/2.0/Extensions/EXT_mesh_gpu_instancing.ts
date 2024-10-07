// import type { IBufferView, IAccessor, INode, IEXTMeshGpuInstancing } from "babylonjs-gltf2interface";
// import { AccessorType, AccessorComponentType } from "babylonjs-gltf2interface";
// import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
// import type { _BinaryWriter } from "../glTFExporter";
// import { _Exporter } from "../glTFExporter";
// import type { Nullable } from "core/types";
// import type { Node } from "core/node";
// import { Mesh } from "core/Meshes/mesh";
// import "core/Meshes/thinInstanceMesh";
// import { TmpVectors, Quaternion, Vector3 } from "core/Maths/math.vector";
// import { VertexBuffer } from "core/Buffers/buffer";

// const NAME = "EXT_mesh_gpu_instancing";

// /**
//  * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing/README.md)
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// export class EXT_mesh_gpu_instancing implements IGLTFExporterExtensionV2 {
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
//      * After node is exported
//      * @param context the GLTF context when loading the asset
//      * @param node the node exported
//      * @param babylonNode the corresponding babylon node
//      * @param nodeMap map from babylon node id to node index
//      * @param binaryWriter binary writer
//      * @returns nullable promise, resolves with the node
//      */
//     public postExportNodeAsync(
//         context: string,
//         node: Nullable<INode>,
//         babylonNode: Node,
//         nodeMap: { [key: number]: number },
//         binaryWriter: _BinaryWriter
//     ): Promise<Nullable<INode>> {
//         return new Promise((resolve) => {
//             if (node && babylonNode instanceof Mesh) {
//                 if (babylonNode.hasThinInstances && binaryWriter) {
//                     this._wasUsed = true;

//                     const noTranslation = Vector3.Zero();
//                     const noRotation = Quaternion.Identity();
//                     const noScale = Vector3.One();

//                     // retrieve all the instance world matrix
//                     const matrix = babylonNode.thinInstanceGetWorldMatrices();

//                     const iwt = TmpVectors.Vector3[2];
//                     const iwr = TmpVectors.Quaternion[1];
//                     const iws = TmpVectors.Vector3[3];

//                     let hasAnyInstanceWorldTranslation = false;
//                     let hasAnyInstanceWorldRotation = false;
//                     let hasAnyInstanceWorldScale = false;

//                     // prepare temp buffers
//                     const translationBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);
//                     const rotationBuffer = new Float32Array(babylonNode.thinInstanceCount * 4);
//                     const scaleBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);

//                     let i = 0;
//                     for (const m of matrix) {
//                         m.decompose(iws, iwr, iwt);

//                         // fill the temp buffer
//                         translationBuffer.set(iwt.asArray(), i * 3);
//                         rotationBuffer.set(iwr.normalize().asArray(), i * 4); // ensure the quaternion is normalized
//                         scaleBuffer.set(iws.asArray(), i * 3);

//                         // this is where we decide if there is any transformation
//                         hasAnyInstanceWorldTranslation = hasAnyInstanceWorldTranslation || !iwt.equalsWithEpsilon(noTranslation);
//                         hasAnyInstanceWorldRotation = hasAnyInstanceWorldRotation || !iwr.equalsWithEpsilon(noRotation);
//                         hasAnyInstanceWorldScale = hasAnyInstanceWorldScale || !iws.equalsWithEpsilon(noScale);

//                         i++;
//                     }

//                     const extension: IEXTMeshGpuInstancing = {
//                         attributes: {},
//                     };

//                     // do we need to write TRANSLATION ?
//                     if (hasAnyInstanceWorldTranslation) {
//                         extension.attributes["TRANSLATION"] = this._buildAccessor(
//                             translationBuffer,
//                             AccessorType.VEC3,
//                             babylonNode.thinInstanceCount,
//                             binaryWriter,
//                             AccessorComponentType.FLOAT
//                         );
//                     }
//                     // do we need to write ROTATION ?
//                     if (hasAnyInstanceWorldRotation) {
//                         const componentType = AccessorComponentType.FLOAT; // we decided to stay on FLOAT for now see https://github.com/BabylonJS/Babylon.js/pull/12495
//                         extension.attributes["ROTATION"] = this._buildAccessor(rotationBuffer, AccessorType.VEC4, babylonNode.thinInstanceCount, binaryWriter, componentType);
//                     }
//                     // do we need to write SCALE ?
//                     if (hasAnyInstanceWorldScale) {
//                         extension.attributes["SCALE"] = this._buildAccessor(
//                             scaleBuffer,
//                             AccessorType.VEC3,
//                             babylonNode.thinInstanceCount,
//                             binaryWriter,
//                             AccessorComponentType.FLOAT
//                         );
//                     }

//                     /* eslint-enable @typescript-eslint/naming-convention*/
//                     node.extensions = node.extensions || {};
//                     node.extensions[NAME] = extension;
//                 }
//             }
//             resolve(node);
//         });
//     }

//     private _buildAccessor(buffer: Float32Array, type: AccessorType, count: number, binaryWriter: _BinaryWriter, componentType: AccessorComponentType): number {
//         // write the buffer
//         const bufferOffset = binaryWriter.getByteOffset();
//         switch (componentType) {
//             case AccessorComponentType.FLOAT: {
//                 for (let i = 0; i != buffer.length; i++) {
//                     binaryWriter.setFloat32(buffer[i]);
//                 }
//                 break;
//             }
//             case AccessorComponentType.BYTE: {
//                 for (let i = 0; i != buffer.length; i++) {
//                     binaryWriter.setByte(buffer[i] * 127);
//                 }
//                 break;
//             }
//             case AccessorComponentType.SHORT: {
//                 for (let i = 0; i != buffer.length; i++) {
//                     binaryWriter.setInt16(buffer[i] * 32767);
//                 }

//                 break;
//             }
//         }
//         // build the buffer view
//         const bv: IBufferView = { buffer: 0, byteOffset: bufferOffset, byteLength: buffer.length * VertexBuffer.GetTypeByteLength(componentType) };
//         const bufferViewIndex = this._exporter._bufferViews.length;
//         this._exporter._bufferViews.push(bv);

//         // finally build the accessor
//         const accessorIndex = this._exporter._accessors.length;
//         const accessor: IAccessor = {
//             bufferView: bufferViewIndex,
//             componentType: componentType,
//             count: count,
//             type: type,
//             normalized: componentType == AccessorComponentType.BYTE || componentType == AccessorComponentType.SHORT,
//         };
//         this._exporter._accessors.push(accessor);
//         return accessorIndex;
//     }
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// _Exporter.RegisterExtension(NAME, (exporter) => new EXT_mesh_gpu_instancing(exporter));
