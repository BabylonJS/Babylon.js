import type { IBufferView, IAccessor } from "babylonjs-gltf2interface";
import { AccessorComponentType, AccessorType } from "babylonjs-gltf2interface";
import type { MorphTarget } from "core/Morph/morphTarget";
import type { BufferManager } from "./bufferManager";

import { NormalizeTangent } from "./glTFUtilities";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { Vector3, Vector4 } from "core/Maths/math.vector";
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
    mesh: AbstractMesh,
    bufferManager: BufferManager,
    bufferViews: IBufferView[],
    accessors: IAccessor[],
    convertToRightHanded: boolean
): IMorphTargetData {
    const result: IMorphTargetData = {
        attributes: {},
        influence: morphTarget.influence,
        name: morphTarget.name,
    };

    const geometry = mesh.geometry;
    if (!geometry) {
        Tools.Warn("Attempted to export morph target data from a mesh without geometry. This should not happen.");
        return result;
    }

    const flipX = convertToRightHanded ? -1 : 1;
    const floatSize = 4;
    const difference = Vector3.Zero();
    let vertexStart = 0;
    let vertexCount = 0;

    if (morphTarget.hasPositions) {
        const morphPositions = morphTarget.getPositions()!;
        const originalPositions = geometry.getVerticesData(VertexBuffer.PositionKind); // Bypasses any instance data of mesh

        if (originalPositions) {
            const positionData = new Float32Array(originalPositions.length);
            const min = [Infinity, Infinity, Infinity];
            const max = [-Infinity, -Infinity, -Infinity];
            vertexCount = originalPositions.length / 3;
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

                positionData[i * 3] = difference.x;
                positionData[i * 3 + 1] = difference.y;
                positionData[i * 3 + 2] = difference.z;
            }

            const bufferView = bufferManager.createBufferView(positionData, floatSize * 3);
            const accessor = bufferManager.createAccessor(bufferView, AccessorType.VEC3, AccessorComponentType.FLOAT, morphPositions.length / 3, 0, { min, max });
            accessors.push(accessor);
            result.attributes["POSITION"] = accessors.length - 1;
        } else {
            Tools.Warn(`Morph target positions for mesh ${mesh.name} were not exported. Mesh does not have position vertex data`);
        }
    }

    if (morphTarget.hasNormals) {
        const morphNormals = morphTarget.getNormals()!;
        const originalNormals = geometry.getVerticesData(VertexBuffer.NormalKind);

        if (originalNormals) {
            const normalData = new Float32Array(originalNormals.length);
            vertexCount = originalNormals.length / 3;
            vertexStart = 0;
            for (let i = vertexStart; i < vertexCount; ++i) {
                const originalNormal = Vector3.FromArray(originalNormals, i * 3).normalize();
                const morphNormal = Vector3.FromArray(morphNormals, i * 3).normalize();
                morphNormal.subtractToRef(originalNormal, difference);

                normalData[i * 3] = difference.x * flipX;
                normalData[i * 3 + 1] = difference.y;
                normalData[i * 3 + 2] = difference.z;
            }

            const bufferView = bufferManager.createBufferView(normalData, floatSize * 3);
            const accessor = bufferManager.createAccessor(bufferView, AccessorType.VEC3, AccessorComponentType.FLOAT, morphNormals.length / 3, 0);
            accessors.push(accessor);
            result.attributes["NORMAL"] = accessors.length - 1;
        } else {
            Tools.Warn(`Morph target normals for mesh ${mesh.name} were not exported. Mesh does not have normals vertex data`);
        }
    }

    if (morphTarget.hasTangents) {
        const morphTangents = morphTarget.getTangents()!;
        const originalTangents = geometry.getVerticesData(VertexBuffer.TangentKind);

        if (originalTangents) {
            vertexCount = originalTangents.length / 4;
            const tangentData = new Float32Array(vertexCount * 3);
            vertexStart = 0;
            for (let i = vertexStart; i < vertexCount; ++i) {
                // Only read the x, y, z components and ignore w
                const originalTangent = Vector3.FromArray(originalTangents, i * 4);
                NormalizeTangent(originalTangent);

                // Morph target tangents omit the w component so it won't be present in the data
                const morphTangent = Vector3.FromArray(morphTangents, i * 3);
                NormalizeTangent(morphTangent);

                morphTangent.subtractToRef(originalTangent, difference);
                tangentData[i * 3] = difference.x * flipX;
                tangentData[i * 3 + 1] = difference.y;
                tangentData[i * 3 + 2] = difference.z;
            }
            const bufferView = bufferManager.createBufferView(tangentData, floatSize * 3);
            const accessor = bufferManager.createAccessor(bufferView, AccessorType.VEC3, AccessorComponentType.FLOAT, vertexCount, 0);
            accessors.push(accessor);
            result.attributes["TANGENT"] = accessors.length - 1;
        } else {
            Tools.Warn(`Morph target tangents for mesh ${mesh.name} were not exported. Mesh does not have tangents vertex data`);
        }
    }

    if (morphTarget.hasColors) {
        const morphColors = morphTarget.getColors()!;
        const originalColors = geometry.getVerticesData(VertexBuffer.ColorKind);
        const buffer = geometry.getVertexBuffer(VertexBuffer.ColorKind);

        if (originalColors && buffer) {
            const componentSize = buffer.getSize();

            vertexCount = originalColors.length / componentSize;
            const colorData = new Float32Array(vertexCount * componentSize);
            vertexStart = 0;
            for (let i = vertexStart; i < vertexCount; ++i) {
                if (componentSize === 3) {
                    const originalColor = Vector3.FromArray(originalColors, i * componentSize);
                    const morphColor = Vector3.FromArray(morphColors, i * componentSize);

                    morphColor.subtractToRef(originalColor, difference);
                    colorData[i * 3] = difference.x;
                    colorData[i * 3 + 1] = difference.y;
                    colorData[i * 3 + 2] = difference.z;
                } else if (componentSize === 4) {
                    const difference4 = new Vector4();
                    const originalColor = Vector4.FromArray(originalColors, i * componentSize);
                    const morphColor = Vector4.FromArray(morphColors, i * componentSize);

                    morphColor.subtractToRef(originalColor, difference4);
                    colorData[i * 4] = difference4.x;
                    colorData[i * 4 + 1] = difference4.y;
                    colorData[i * 4 + 2] = difference4.z;
                    colorData[i * 4 + 3] = difference4.w;
                } else {
                    Tools.Warn(`Unsupported number of components for color attribute: ${componentSize}`);
                }
            }
            const bufferView = bufferManager.createBufferView(colorData, floatSize * componentSize);
            const accessor = bufferManager.createAccessor(bufferView, componentSize === 3 ? AccessorType.VEC3 : AccessorType.VEC4, AccessorComponentType.FLOAT, vertexCount, 0);
            accessors.push(accessor);
            result.attributes["COLOR_0"] = accessors.length - 1;
        } else {
            Tools.Warn(`Morph target colors for mesh ${mesh.name} were not exported. Mesh does not have colors vertex data`);
        }
    }

    return result;
}
