/* eslint-disable jsdoc/require-jsdoc */

import type { INode } from "babylonjs-gltf2interface";
import { AccessorType, MeshPrimitiveMode } from "babylonjs-gltf2interface";
import type { FloatArray, DataArray, IndicesArray } from "core/types";
import type { Vector4 } from "core/Maths/math.vector";
import { Quaternion, TmpVectors, Matrix, Vector3 } from "core/Maths/math.vector";
import { VertexBuffer } from "core/Buffers/buffer";
import { Material } from "core/Materials/material";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { EnumerateFloatValues } from "core/Buffers/bufferUtils";
import type { Node } from "core/node";

// Matrix that converts handedness on the X-axis.
const convertHandednessMatrix = Matrix.Compose(new Vector3(-1, 1, 1), Quaternion.Identity(), Vector3.Zero());

// 180 degrees rotation in Y.
const rotation180Y = new Quaternion(0, 1, 0, 0);

// Default values for comparison.
const epsilon = 1e-6;
const defaultTranslation = Vector3.Zero();
const defaultScale = Vector3.One();

export function GetAccessorElementCount(accessorType: AccessorType): number {
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

export function FloatsNeed16BitInteger(floatArray: FloatArray): boolean {
    return floatArray.some((value) => value >= 256);
}

export function IsStandardVertexAttribute(type: string): boolean {
    switch (type) {
        case VertexBuffer.PositionKind:
        case VertexBuffer.NormalKind:
        case VertexBuffer.TangentKind:
        case VertexBuffer.ColorKind:
        case VertexBuffer.MatricesIndicesKind:
        case VertexBuffer.MatricesIndicesExtraKind:
        case VertexBuffer.MatricesWeightsKind:
        case VertexBuffer.MatricesWeightsExtraKind:
        case VertexBuffer.UVKind:
        case VertexBuffer.UV2Kind:
        case VertexBuffer.UV3Kind:
        case VertexBuffer.UV4Kind:
        case VertexBuffer.UV5Kind:
        case VertexBuffer.UV6Kind:
            return true;
    }
    return false;
}

export function GetAccessorType(kind: string, hasVertexColorAlpha: boolean): AccessorType {
    if (kind == VertexBuffer.ColorKind) {
        return hasVertexColorAlpha ? AccessorType.VEC4 : AccessorType.VEC3;
    }

    switch (kind) {
        case VertexBuffer.PositionKind:
        case VertexBuffer.NormalKind:
            return AccessorType.VEC3;
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

export function GetAttributeType(kind: string): string {
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

export function GetPrimitiveMode(fillMode: number): MeshPrimitiveMode {
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

export function IsTriangleFillMode(fillMode: number): boolean {
    switch (fillMode) {
        case Material.TriangleFillMode:
        case Material.TriangleStripDrawMode:
        case Material.TriangleFanDrawMode:
            return true;
    }

    return false;
}

export function NormalizeTangent(tangent: Vector4 | Vector3) {
    const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y + tangent.z * tangent.z);
    if (length > 0) {
        tangent.x /= length;
        tangent.y /= length;
        tangent.z /= length;
    }
}

export function ConvertToRightHandedPosition(value: Vector3): Vector3 {
    value.x *= -1;
    return value;
}

export function ConvertToRightHandedRotation(value: Quaternion): Quaternion {
    value.x *= -1;
    value.y *= -1;
    return value;
}

export function ConvertToRightHandedNode(value: INode) {
    let translation = Vector3.FromArrayToRef(value.translation || [0, 0, 0], 0, TmpVectors.Vector3[0]);
    let rotation = Quaternion.FromArrayToRef(value.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[0]);

    translation = ConvertToRightHandedPosition(translation);
    rotation = ConvertToRightHandedRotation(rotation);

    if (translation.equalsWithEpsilon(defaultTranslation, epsilon)) {
        delete value.translation;
    } else {
        value.translation = translation.asArray();
    }

    if (Quaternion.IsIdentity(rotation)) {
        delete value.rotation;
    } else {
        value.rotation = rotation.asArray();
    }
}

/**
 * Rotation by 180 as glTF has a different convention than Babylon.
 * @param rotation Target camera rotation.
 * @returns Ref to camera rotation.
 */
export function ConvertCameraRotationToGLTF(rotation: Quaternion): Quaternion {
    return rotation.multiplyInPlace(rotation180Y);
}

export function RotateNode180Y(node: INode) {
    const rotation = Quaternion.FromArrayToRef(node.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[1]);
    rotation180Y.multiplyToRef(rotation, rotation);
    node.rotation = rotation.asArray();
}

/**
 * Collapses GLTF parent and node into a single node. This is useful for removing nodes that were added by the GLTF importer.
 * @param node Target parent node.
 * @param parentNode Original GLTF node (Light or Camera).
 */
export function CollapseParentNode(node: INode, parentNode: INode) {
    const parentTranslation = Vector3.FromArrayToRef(parentNode.translation || [0, 0, 0], 0, TmpVectors.Vector3[0]);
    const parentRotation = Quaternion.FromArrayToRef(parentNode.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[0]);
    const parentScale = Vector3.FromArrayToRef(parentNode.scale || [1, 1, 1], 0, TmpVectors.Vector3[1]);
    const parentMatrix = Matrix.ComposeToRef(parentScale, parentRotation, parentTranslation, TmpVectors.Matrix[0]);

    const translation = Vector3.FromArrayToRef(node.translation || [0, 0, 0], 0, TmpVectors.Vector3[2]);
    const rotation = Quaternion.FromArrayToRef(node.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[1]);
    const scale = Vector3.FromArrayToRef(node.scale || [1, 1, 1], 0, TmpVectors.Vector3[1]);
    const matrix = Matrix.ComposeToRef(scale, rotation, translation, TmpVectors.Matrix[1]);

    parentMatrix.multiplyToRef(matrix, matrix);
    matrix.decompose(parentScale, parentRotation, parentTranslation);

    if (parentTranslation.equalsWithEpsilon(defaultTranslation, epsilon)) {
        delete parentNode.translation;
    } else {
        parentNode.translation = parentTranslation.asArray();
    }

    if (Quaternion.IsIdentity(parentRotation)) {
        delete parentNode.rotation;
    } else {
        parentNode.rotation = parentRotation.asArray();
    }

    if (parentScale.equalsWithEpsilon(defaultScale, epsilon)) {
        delete parentNode.scale;
    } else {
        parentNode.scale = parentScale.asArray();
    }
}

/**
 * Sometimes the GLTF Importer can add extra transform nodes (for lights and cameras). This checks if a parent node was added by the GLTF Importer. If so, it should be removed during serialization.
 * @param babylonNode Original GLTF node (Light or Camera).
 * @param parentBabylonNode Target parent node.
 * @returns True if the parent node was added by the GLTF importer.
 */
export function IsParentAddedByImporter(babylonNode: Node, parentBabylonNode: Node): boolean {
    return parentBabylonNode instanceof TransformNode && parentBabylonNode.getChildren().length == 1 && babylonNode.getChildren().length == 0;
}

export function IsNoopNode(node: Node, useRightHandedSystem: boolean): boolean {
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

/**
 * Converts an IndicesArray into either Uint32Array or Uint16Array, only copying if the data is number[].
 * @param indices input array to be converted
 * @param start starting index to copy from
 * @param count number of indices to copy
 * @returns a Uint32Array or Uint16Array
 * @internal
 */
export function IndicesArrayToTypedArray(indices: IndicesArray, start: number, count: number, is32Bits: boolean): Uint32Array | Uint16Array {
    if (indices instanceof Uint16Array || indices instanceof Uint32Array) {
        return indices;
    }

    // If Int32Array, cast the indices (which are all positive) to Uint32Array
    if (indices instanceof Int32Array) {
        return new Uint32Array(indices.buffer, indices.byteOffset, indices.length);
    }

    const subarray = indices.slice(start, start + count);
    return is32Bits ? new Uint32Array(subarray) : new Uint16Array(subarray);
}

export function DataArrayToUint8Array(data: DataArray): Uint8Array {
    if (data instanceof Array) {
        const floatData = new Float32Array(data);
        return new Uint8Array(floatData.buffer, floatData.byteOffset, floatData.byteLength);
    }

    return ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
}

export function GetMinMax(data: DataArray, vertexBuffer: VertexBuffer, start: number, count: number): { min: number[]; max: number[] } {
    const { byteOffset, byteStride, type, normalized } = vertexBuffer;
    const size = vertexBuffer.getSize();
    const min = new Array<number>(size).fill(Infinity);
    const max = new Array<number>(size).fill(-Infinity);
    EnumerateFloatValues(data, byteOffset + start * byteStride, byteStride, size, type, count * size, normalized, (values) => {
        for (let i = 0; i < size; i++) {
            min[i] = Math.min(min[i], values[i]);
            max[i] = Math.max(max[i], values[i]);
        }
    });

    return { min, max };
}

/**
 * Removes, in-place, object properties which have the same value as the default value.
 * Useful for avoiding unnecessary properties in the glTF JSON.
 * @param object the object to omit default values from
 * @param defaultValues a partial object with default values
 * @returns object with default values omitted
 */
export function OmitDefaultValues<T extends Object>(object: T, defaultValues: Partial<T>): T {
    for (const [key, value] of Object.entries(object)) {
        const defaultValue = defaultValues[key as keyof T];
        if ((Array.isArray(value) && Array.isArray(defaultValue) && AreArraysEqual(value, defaultValue)) || value === defaultValue) {
            delete object[key as keyof T];
        }
    }
    return object;
}

function AreArraysEqual(array1: unknown[], array2: unknown[]): boolean {
    return array1.length === array2.length && array1.every((val, i) => val === array2[i]);
}
