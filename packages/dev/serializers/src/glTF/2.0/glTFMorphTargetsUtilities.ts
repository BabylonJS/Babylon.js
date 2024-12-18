import type { IBufferView, IAccessor } from "babylonjs-gltf2interface";
import { AccessorComponentType, AccessorType } from "babylonjs-gltf2interface";
import type { MorphTarget } from "core/Morph/morphTarget";
import type { DataWriter } from "./dataWriter";

import { CreateAccessor, CreateBufferView, NormalizeTangent } from "./glTFUtilities";
import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { Vector3 } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";

/**
 * Interface to store morph target information.
 * @internal
 */
export interface IMorphTargetData {
    attributes: Record<string, number>;
    influence: number;
    name: string;
}

export function BuildMorphTargetBuffers(
    morphTarget: MorphTarget,
    mesh: Mesh,
    dataWriter: DataWriter,
    bufferViews: IBufferView[],
    accessors: IAccessor[],
    convertToRightHanded: boolean
): IMorphTargetData {
    const result: IMorphTargetData = {
        attributes: {},
        influence: morphTarget.influence,
        name: morphTarget.name,
    };

    const flipX = convertToRightHanded ? -1 : 1;
    const floatSize = 4;
    const difference = Vector3.Zero();
    let vertexStart = 0;
    let vertexCount = 0;
    let byteOffset = 0;
    let bufferViewIndex = 0;

    if (morphTarget.hasPositions) {
        const morphPositions = morphTarget.getPositions()!;
        const originalPositions = mesh.getVerticesData(VertexBuffer.PositionKind, undefined, undefined, true);

        if (originalPositions) {
            const min = [Infinity, Infinity, Infinity];
            const max = [-Infinity, -Infinity, -Infinity];
            vertexCount = originalPositions.length / 3;
            byteOffset = dataWriter.byteOffset;
            vertexStart = 0;
            for (let i = vertexStart; i < vertexCount; ++i) {
                const originalPosition = Vector3.FromArray(originalPositions, i * 3);
                const morphPosition = Vector3.FromArray(morphPositions, i * 3);
                morphPosition.subtractToRef(originalPosition, difference);
                difference.x *= flipX;

                min[0] = Math.min(min[0], difference.x);
                max[0] = Math.max(max[0], difference.x);

                min[1] = Math.min(min[1], difference.y);
                max[1] = Math.max(max[1], difference.y);

                min[2] = Math.min(min[2], difference.z);
                max[2] = Math.max(max[2], difference.z);

                dataWriter.writeFloat32(difference.x);
                dataWriter.writeFloat32(difference.y);
                dataWriter.writeFloat32(difference.z);
            }

            bufferViews.push(CreateBufferView(0, byteOffset, morphPositions.length * floatSize, floatSize * 3));
            bufferViewIndex = bufferViews.length - 1;
            accessors.push(CreateAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, morphPositions.length / 3, 0, { min, max }));
            result.attributes["POSITION"] = accessors.length - 1;
        } else {
            Tools.Warn(`Morph target positions for mesh ${mesh.name} were not exported. Mesh does not have position vertex data`);
        }
    }

    if (morphTarget.hasNormals) {
        const morphNormals = morphTarget.getNormals()!;
        const originalNormals = mesh.getVerticesData(VertexBuffer.NormalKind, undefined, undefined, true);

        if (originalNormals) {
            vertexCount = originalNormals.length / 3;
            byteOffset = dataWriter.byteOffset;
            vertexStart = 0;
            for (let i = vertexStart; i < vertexCount; ++i) {
                const originalNormal = Vector3.FromArray(originalNormals, i * 3).normalize();
                const morphNormal = Vector3.FromArray(morphNormals, i * 3).normalize();
                morphNormal.subtractToRef(originalNormal, difference);
                dataWriter.writeFloat32(difference.x * flipX);
                dataWriter.writeFloat32(difference.y);
                dataWriter.writeFloat32(difference.z);
            }

            bufferViews.push(CreateBufferView(0, byteOffset, morphNormals.length * floatSize, floatSize * 3));
            bufferViewIndex = bufferViews.length - 1;
            accessors.push(CreateAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, morphNormals.length / 3, 0));
            result.attributes["NORMAL"] = accessors.length - 1;
        } else {
            Tools.Warn(`Morph target normals for mesh ${mesh.name} were not exported. Mesh does not have normals vertex data`);
        }
    }

    if (morphTarget.hasTangents) {
        const morphTangents = morphTarget.getTangents()!;
        const originalTangents = mesh.getVerticesData(VertexBuffer.TangentKind, undefined, undefined, true);

        if (originalTangents) {
            vertexCount = originalTangents.length / 4;
            vertexStart = 0;
            byteOffset = dataWriter.byteOffset;
            for (let i = vertexStart; i < vertexCount; ++i) {
                // Only read the x, y, z components and ignore w
                const originalTangent = Vector3.FromArray(originalTangents, i * 4);
                NormalizeTangent(originalTangent);

                // Morph target tangents omit the w component so it won't be present in the data
                const morphTangent = Vector3.FromArray(morphTangents, i * 3);
                NormalizeTangent(morphTangent);

                morphTangent.subtractToRef(originalTangent, difference);
                dataWriter.writeFloat32(difference.x * flipX);
                dataWriter.writeFloat32(difference.y);
                dataWriter.writeFloat32(difference.z);
            }

            bufferViews.push(CreateBufferView(0, byteOffset, vertexCount * floatSize * 3, floatSize * 3));
            bufferViewIndex = bufferViews.length - 1;
            accessors.push(CreateAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, vertexCount, 0));
            result.attributes["TANGENT"] = accessors.length - 1;
        } else {
            Tools.Warn(`Morph target tangents for mesh ${mesh.name} were not exported. Mesh does not have tangents vertex data`);
        }
    }

    return result;
}
