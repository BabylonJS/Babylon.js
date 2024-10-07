/* eslint-disable jsdoc/require-jsdoc */

import type { IBufferView, AccessorComponentType, IAccessor } from "babylonjs-gltf2interface";
import { AccessorType, MeshPrimitiveMode } from "babylonjs-gltf2interface";

import type { DataArray, IndicesArray, Nullable } from "core/types";
import type { Vector4 } from "core/Maths/math.vector";
import { Quaternion, TmpVectors, Matrix, Vector3 } from "core/Maths/math.vector";
import { VertexBuffer } from "core/Buffers/buffer";
import { Material } from "core/Materials/material";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { enumerateFloatValues } from "core/Buffers/bufferUtils";
import type { Node } from "core/node";

// Matrix that converts handedness on the X-axis.
const convertHandednessMatrix = Matrix.Compose(new Vector3(-1, 1, 1), Quaternion.Identity(), Vector3.Zero());

/**
 * Creates a buffer view based on the supplied arguments
 * @param bufferIndex index value of the specified buffer
 * @param byteOffset byte offset value
 * @param byteLength byte length of the bufferView
 * @param byteStride byte distance between conequential elements
 * @returns bufferView for glTF
 */
export function createBufferView(bufferIndex: number, byteOffset: number, byteLength: number, byteStride?: number): IBufferView {
    const bufferview: IBufferView = { buffer: bufferIndex, byteLength: byteLength };

    if (byteOffset) {
        bufferview.byteOffset = byteOffset;
    }

    if (byteStride) {
        bufferview.byteStride = byteStride;
    }

    return bufferview;
}

/**
 * Creates an accessor based on the supplied arguments
 * @param bufferViewIndex The index of the bufferview referenced by this accessor
 * @param type The type of the accessor
 * @param componentType The datatype of components in the attribute
 * @param count The number of attributes referenced by this accessor
 * @param byteOffset The offset relative to the start of the bufferView in bytes
 * @param minMax Minimum and maximum value of each component in this attribute
 * @returns accessor for glTF
 */
export function createAccessor(
    bufferViewIndex: number,
    type: AccessorType,
    componentType: AccessorComponentType,
    count: number,
    byteOffset: Nullable<number>,
    minMax: Nullable<{ min: number[]; max: number[] }> = null
): IAccessor {
    const accessor: IAccessor = { bufferView: bufferViewIndex, componentType: componentType, count: count, type: type };

    if (minMax != null) {
        accessor.min = minMax.min;
        accessor.max = minMax.max;
    }

    if (byteOffset != null) {
        accessor.byteOffset = byteOffset;
    }

    return accessor;
}

export function getAccessorElementCount(accessorType: AccessorType): number {
    switch (accessorType) {
        case AccessorType.MAT2:
            return 4;
        case AccessorType.MAT3:
            return 9;
        case AccessorType.MAT4:
            return 16;
        case AccessorType.SCALAR:
            return 1;
        case AccessorType.VEC2:
            return 2;
        case AccessorType.VEC3:
            return 3;
        case AccessorType.VEC4:
            return 4;
    }
}

export function getAccessorType(kind: string): AccessorType {
    switch (kind) {
        case VertexBuffer.PositionKind:
        case VertexBuffer.NormalKind:
            return AccessorType.VEC3;
        case VertexBuffer.ColorKind:
        case VertexBuffer.TangentKind:
        case VertexBuffer.MatricesIndicesKind:
        case VertexBuffer.MatricesIndicesExtraKind:
        case VertexBuffer.MatricesWeightsKind:
        case VertexBuffer.MatricesWeightsExtraKind:
            return AccessorType.VEC4;
        case VertexBuffer.UVKind:
        case VertexBuffer.UV2Kind:
        case VertexBuffer.UV3Kind:
        case VertexBuffer.UV4Kind:
        case VertexBuffer.UV5Kind:
        case VertexBuffer.UV6Kind:
            return AccessorType.VEC2;
    }

    throw new Error(`Unknown kind ${kind}`);
}

export function getAttributeType(kind: string): string {
    switch (kind) {
        case VertexBuffer.PositionKind:
            return "POSITION";
        case VertexBuffer.NormalKind:
            return "NORMAL";
        case VertexBuffer.TangentKind:
            return "TANGENT";
        case VertexBuffer.ColorKind:
            return "COLOR_0";
        case VertexBuffer.UVKind:
            return "TEXCOORD_0";
        case VertexBuffer.UV2Kind:
            return "TEXCOORD_1";
        case VertexBuffer.UV3Kind:
            return "TEXCOORD_2";
        case VertexBuffer.UV4Kind:
            return "TEXCOORD_3";
        case VertexBuffer.UV5Kind:
            return "TEXCOORD_4";
        case VertexBuffer.UV6Kind:
            return "TEXCOORD_5";
        case VertexBuffer.MatricesIndicesKind:
            return "JOINTS_0";
        case VertexBuffer.MatricesIndicesExtraKind:
            return "JOINTS_1";
        case VertexBuffer.MatricesWeightsKind:
            return "WEIGHTS_0";
        case VertexBuffer.MatricesWeightsExtraKind:
            return "WEIGHTS_1";
    }

    throw new Error(`Unknown kind: ${kind}`);
}

export function getPrimitiveMode(fillMode: number): MeshPrimitiveMode {
    switch (fillMode) {
        case Material.TriangleFillMode:
            return MeshPrimitiveMode.TRIANGLES;
        case Material.TriangleStripDrawMode:
            return MeshPrimitiveMode.TRIANGLE_STRIP;
        case Material.TriangleFanDrawMode:
            return MeshPrimitiveMode.TRIANGLE_FAN;
        case Material.PointListDrawMode:
        case Material.PointFillMode:
            return MeshPrimitiveMode.POINTS;
        case Material.LineLoopDrawMode:
            return MeshPrimitiveMode.LINE_LOOP;
        case Material.LineListDrawMode:
            return MeshPrimitiveMode.LINES;
        case Material.LineStripDrawMode:
            return MeshPrimitiveMode.LINE_STRIP;
    }

    throw new Error(`Unknown fill mode: ${fillMode}`);
}

export function isTriangleFillMode(fillMode: number): boolean {
    switch (fillMode) {
        case Material.TriangleFillMode:
        case Material.TriangleStripDrawMode:
        case Material.TriangleFanDrawMode:
            return true;
    }

    return false;
}

export function normalizeTangent(tangent: Vector4) {
    const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y + tangent.z * tangent.z);
    if (length > 0) {
        tangent.x /= length;
        tangent.y /= length;
        tangent.z /= length;
    }
}

export function convertToRightHandedPosition(value: Vector3): Vector3 {
    value.x *= -1;
    return value;
}

export function convertToRightHandedRotation(value: Quaternion): Quaternion {
    value.x *= -1;
    value.y *= -1;
    return value;
}

// /**
//  * Converts a new right-handed Vector3
//  * @param vector vector3 array
//  * @returns right-handed Vector3
//  */
// public static _GetRightHandedNormalVector3(vector: Vector3): Vector3 {
//     return new Vector3(vector.x, vector.y, -vector.z);
// }

// /**
//  * Converts a Vector3 to right-handed
//  * @param vector Vector3 to convert to right-handed
//  */
// public static _GetRightHandedNormalVector3FromRef(vector: Vector3) {
//     vector.z *= -1;
// }

// /**
//  * Converts a three element number array to right-handed
//  * @param vector number array to convert to right-handed
//  */
// public static _GetRightHandedNormalArray3FromRef(vector: number[]) {
//     vector[2] *= -1;
// }

// /**
//  * Converts a Vector4 to right-handed
//  * @param vector Vector4 to convert to right-handed
//  */
// public static _GetRightHandedVector4FromRef(vector: Vector4) {
//     vector.z *= -1;
//     vector.w *= -1;
// }

// /**
//  * Converts a Vector4 to right-handed
//  * @param vector Vector4 to convert to right-handed
//  */
// public static _GetRightHandedArray4FromRef(vector: number[]) {
//     vector[2] *= -1;
//     vector[3] *= -1;
// }

// /**
//  * Converts a Quaternion to right-handed
//  * @param quaternion Source quaternion to convert to right-handed
//  */
// public static _GetRightHandedQuaternionFromRef(quaternion: Quaternion) {
//     quaternion.x *= -1;
//     quaternion.y *= -1;
// }

// /**
//  * Converts a Quaternion to right-handed
//  * @param quaternion Source quaternion to convert to right-handed
//  */
// public static _GetRightHandedQuaternionArrayFromRef(quaternion: number[]) {
//     quaternion[0] *= -1;
//     quaternion[1] *= -1;
// }

export function isNoopNode(node: Node, useRightHandedSystem: boolean): boolean {
    if (!(node instanceof TransformNode)) {
        return false;
    }

    // Transform
    if (useRightHandedSystem) {
        const matrix = node.getWorldMatrix();
        if (!matrix.isIdentity()) {
            return false;
        }
    } else {
        const matrix = node.getWorldMatrix().multiplyToRef(convertHandednessMatrix, TmpVectors.Matrix[0]);
        if (!matrix.isIdentity()) {
            return false;
        }
    }

    // Geometry
    if ((node instanceof Mesh && node.geometry) || (node instanceof InstancedMesh && node.sourceMesh.geometry)) {
        return false;
    }

    return true;
}

export function areIndices32Bits(indices: Nullable<IndicesArray>, count: number): boolean {
    if (indices) {
        if (indices instanceof Array) {
            return indices.some((value) => value >= 65536);
        }

        return indices.BYTES_PER_ELEMENT === 4;
    }

    return count >= 65536;
}

export function indicesArrayToUint8Array(indices: IndicesArray, start: number, count: number, is32Bits: boolean): Uint8Array {
    if (indices instanceof Array) {
        const subarray = indices.slice(start, start + count);
        indices = is32Bits ? new Uint32Array(subarray) : new Uint16Array(subarray);
        return new Uint8Array(indices.buffer, indices.byteOffset, indices.byteLength);
    }

    return ArrayBuffer.isView(indices) ? new Uint8Array(indices.buffer, indices.byteOffset, indices.byteLength) : new Uint8Array(indices);
}

export function dataArrayToUint8Array(data: DataArray): Uint8Array {
    if (data instanceof Array) {
        const floatData = new Float32Array(data);
        return new Uint8Array(floatData.buffer, floatData.byteOffset, floatData.byteLength);
    }

    return ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
}

export function getMinMax(data: DataArray, vertexBuffer: VertexBuffer, start: number, count: number): { min: number[]; max: number[] } {
    const { byteOffset, byteStride, type, normalized } = vertexBuffer;
    const size = vertexBuffer.getSize();
    const min = new Array<number>(size).fill(Infinity);
    const max = new Array<number>(size).fill(-Infinity);
    enumerateFloatValues(data, byteOffset + start * byteStride, byteStride, size, type, count * size, normalized, (values) => {
        for (let i = 0; i < size; i++) {
            min[i] = Math.min(min[i], values[i]);
            max[i] = Math.max(max[i], values[i]);
        }
    });

    return { min, max };
}
