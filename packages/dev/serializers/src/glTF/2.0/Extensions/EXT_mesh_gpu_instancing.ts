import type { IBufferView, IAccessor, INode, IEXTMeshGpuInstancing } from "babylonjs-gltf2interface";
import { AccessorType, AccessorComponentType } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter, _BinaryWriter } from "../glTFExporter";
import { _GLTFUtilities } from "../glTFUtilities";
import type { Nullable } from "core/types";
import type { Node } from "core/node";
import { Mesh } from "core/Meshes";
import { TmpVectors } from "core/Maths/math.vector";

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

                    // 1 - retreive all the matrix
                    const matrix = babylonNode.thinInstanceGetWorldMatrices();

                    // 2 - decompose the matrix as buffer of TRANSLATION, ROTATION, SCALE
                    const bufferOffset = binaryWriter.getByteOffset();

                    matrix.forEach((m) => {
                        m.decompose(TmpVectors.Vector3[0], TmpVectors.Quaternion[0], TmpVectors.Vector3[1]);
                        // TRANSLATION
                        binaryWriter.setFloat32(TmpVectors.Vector3[1].x);
                        binaryWriter.setFloat32(TmpVectors.Vector3[1].y);
                        binaryWriter.setFloat32(TmpVectors.Vector3[1].z);

                        // ROTATION
                        binaryWriter.setFloat32(TmpVectors.Quaternion[0].x);
                        binaryWriter.setFloat32(TmpVectors.Quaternion[0].y);
                        binaryWriter.setFloat32(TmpVectors.Quaternion[0].z);
                        binaryWriter.setFloat32(TmpVectors.Quaternion[0].w);

                        // SCALE
                        binaryWriter.setFloat32(TmpVectors.Vector3[0].x);
                        binaryWriter.setFloat32(TmpVectors.Vector3[0].y);
                        binaryWriter.setFloat32(TmpVectors.Vector3[0].z);
                    });

                    // byte stride is Vector3,Quaternion,Vector3 => 12,16,12 => 40
                    const byteStride = 40;
                    const bv: IBufferView = { buffer: 0, byteOffset: bufferOffset, byteLength: babylonNode.thinInstanceCount * byteStride, byteStride: byteStride };
                    const bufferViewIndex = this._exporter._bufferViews.length;
                    this._exporter._bufferViews.push(bv);

                    /* eslint-disable @typescript-eslint/naming-convention*/
                    const gpu_instancing: IEXTMeshGpuInstancing = {
                        attributes: {
                            TRANSLATION: this._buildAccessor(bufferViewIndex, 0, AccessorType.VEC3, babylonNode.thinInstanceCount),
                            ROTATION: this._buildAccessor(bufferViewIndex, 12, AccessorType.VEC4, babylonNode.thinInstanceCount),
                            SCALE: this._buildAccessor(bufferViewIndex, 28, AccessorType.VEC3, babylonNode.thinInstanceCount),
                        },
                    };
                    /* eslint-enable @typescript-eslint/naming-convention*/
                    node.extensions = node.extensions || {};
                    node.extensions[NAME] = gpu_instancing;
                }
            }
            resolve(node);
        });
    }

    private _buildAccessor(bufferViewIndex: number, byteOffset: number, type: AccessorType, count: number): number {
        const accessorIndex = this._exporter._accessors.length;
        const accessor: IAccessor = { bufferView: bufferViewIndex, byteOffset: byteOffset, componentType: AccessorComponentType.FLOAT, count: count, type: type };
        this._exporter._accessors.push(accessor);
        return accessorIndex;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
_Exporter.RegisterExtension(NAME, (exporter) => new EXT_mesh_gpu_instancing(exporter));
