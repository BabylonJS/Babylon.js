import type { IBufferView, IAccessor, INode, IEXTMeshGpuInstancing } from "babylonjs-gltf2interface";
import { AccessorType, AccessorComponentType } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter, _BinaryWriter } from "../glTFExporter";
import type { Nullable } from "core/types";
import type { Node } from "core/node";
import { Mesh } from "core/Meshes";
import { TmpVectors, Quaternion, Vector3 } from "core/Maths/math.vector";
import { VertexBuffer } from "core/Buffers/buffer";
import { DefaultCollisionCoordinator } from "core/Collisions/collisionCoordinator";

const NAME = "EXT_mesh_gpu_instancing";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_mesh_gpu_instancing implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: _Exporter;

    private _wasUsed = false;

    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    public dispose() {}

    /** @hidden */
    public get wasUsed() {
        return this._wasUsed;
    }

    public postExportNodeAsync?(
        context: string,
        node: Nullable<INode>,
        babylonNode: Node,
        nodeMap?: { [key: number]: number },
        binaryWriter?: _BinaryWriter
    ): Promise<Nullable<INode>> {
        return new Promise((resolve) => {
            if (node && babylonNode instanceof Mesh) {
                if (babylonNode.hasThinInstances && binaryWriter) {
                    this._wasUsed = true;

                    const noTranslation = Vector3.Zero();
                    const noRotation = Quaternion.Identity();
                    const noScale = Vector3.One();

                    // retrieve all the instance world matrix

                    const matrix = babylonNode.thinInstanceGetWorldMatrices();

                    const iwt = TmpVectors.Vector3[2];
                    const iwr = TmpVectors.Quaternion[1];
                    const iws = TmpVectors.Vector3[3];

                    let hasAnyInstanceWorldTranslation = false;
                    let hasAnyInstanceWorldRotation = false;
                    let hasAnyInstanceWorldScale = false;

                    // prepare temp buffers
                    const translationBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);
                    const rotationBuffer = new Float32Array(babylonNode.thinInstanceCount * 4);
                    const scaleBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);

                    matrix.forEach((m, i) => {
                        m.decompose(iws, iwr, iwt);

                        // fill the temp buffer
                        translationBuffer.set(iwt.asArray(), i * 3);
                        rotationBuffer.set(iwr.asArray(), i * 4);
                        scaleBuffer.set(iws.asArray(), i * 3);

                        // this is where we decide if there is any transformation
                        hasAnyInstanceWorldTranslation = hasAnyInstanceWorldTranslation || !iwt.equalsWithEpsilon(noTranslation);
                        hasAnyInstanceWorldRotation = hasAnyInstanceWorldRotation || !iwr.equalsWithEpsilon(noRotation);
                        hasAnyInstanceWorldScale = hasAnyInstanceWorldScale || !iws.equalsWithEpsilon(noScale);
                    });

                    /* eslint-disable @typescript-eslint/naming-convention*/
                    const gpu_instancing: IEXTMeshGpuInstancing = {
                        attributes: {},
                    };

                    // do we need to write TRANSLATION ?
                    if (hasAnyInstanceWorldTranslation) {
                        gpu_instancing.attributes["TRANSLATION"] = this._buildAccessor(
                            translationBuffer,
                            AccessorType.VEC3,
                            babylonNode.thinInstanceCount,
                            binaryWriter,
                            AccessorComponentType.FLOAT
                        );
                    }
                    // do we need to write ROTATION ?
                    if (hasAnyInstanceWorldRotation) {
                        // Data type can be
                        //   - 5126 (FLOAT)
                        //   - 5120 (BYTE) normalized
                        //   - 5122 (SHORT) normalized
                        gpu_instancing.attributes["ROTATION"] = this._buildAccessor(
                            rotationBuffer,
                            AccessorType.VEC4,
                            babylonNode.thinInstanceCount,
                            binaryWriter,
                            AccessorComponentType.FLOAT
                        );
                    }
                    // do we need to write SCALE ?
                    if (hasAnyInstanceWorldScale) {
                        gpu_instancing.attributes["SCALE"] = this._buildAccessor(
                            scaleBuffer,
                            AccessorType.VEC3,
                            babylonNode.thinInstanceCount,
                            binaryWriter,
                            AccessorComponentType.FLOAT
                        );
                    }

                    /* eslint-enable @typescript-eslint/naming-convention*/
                    node.extensions = node.extensions || {};
                    node.extensions[NAME] = gpu_instancing;
                }
            }
            resolve(node);
        });
    }

    private _buildAccessor(
        buffer: Float32Array | Int8Array | Int16Array,
        type: AccessorType,
        count: number,
        binaryWriter: _BinaryWriter,
        componentType: AccessorComponentType
    ): number {
        // write the buffer
        const bufferOffset = binaryWriter.getByteOffset();
        switch (componentType) {
            case AccessorComponentType.FLOAT: {
                for (let i = 0; i != buffer.length; i++) {
                    binaryWriter.setFloat32(buffer[i]);
                }
                break;
            }
            case AccessorComponentType.BYTE: {
                for (let i = 0; i != buffer.length; i++) {
                    binaryWriter.setByte(buffer[i]);
                }
                break;
            }
            case AccessorComponentType.SHORT: {
                for (let i = 0; i != buffer.length; i++) {
                    binaryWriter.setInt16(buffer[i]);
                }
                break;
            }
        }
        // build the buffer view
        const bv: IBufferView = { buffer: 0, byteOffset: bufferOffset, byteLength: buffer.length * VertexBuffer.GetTypeByteLength(componentType) };
        const bufferViewIndex = this._exporter._bufferViews.length;
        this._exporter._bufferViews.push(bv);

        // finally build the accessor
        const accessorIndex = this._exporter._accessors.length;
        const accessor: IAccessor = { bufferView: bufferViewIndex, componentType: componentType, count: count, type: type };
        this._exporter._accessors.push(accessor);
        return accessorIndex;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
_Exporter.RegisterExtension(NAME, (exporter) => new EXT_mesh_gpu_instancing(exporter));
