/* eslint-disable jsdoc/require-jsdoc */
import type { INode } from "babylonjs-gltf2interface";
import { AccessorType, MeshPrimitiveMode } from "babylonjs-gltf2interface";
import type { FloatArray, DataArray, IndicesArray, DeepImmutable } from "core/types";
import type { Vector4 } from "core/Maths/math.vector";
import { Quaternion, TmpVectors, Matrix, Vector3 } from "core/Maths/math.vector";
import { VertexBuffer } from "core/Buffers/buffer";
import { Material } from "core/Materials/material";
import { TransformNode } from "core/Meshes/transformNode";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { EnumerateFloatValues } from "core/Buffers/bufferUtils";
import type { Node } from "core/node";
import { Logger } from "core/Misc/logger";
import { TargetCamera } from "core/Cameras/targetCamera";
import type { ShadowLight } from "core/Lights/shadowLight";
import { Epsilon } from "core/Maths/math.constants";
import { ConvertHandednessMatrix } from "../../exportUtils";
import type { AreaLight } from "core/Lights/areaLight";

// Default values for comparison.
export const DefaultTranslation = Vector3.ZeroReadOnly;
export const DefaultRotation = Quaternion.Identity() as DeepImmutable<Quaternion>;
export const DefaultScale = Vector3.OneReadOnly;
const DefaultLoaderCameraParentScaleLh = new Vector3(-1, 1, 1) as DeepImmutable<Vector3>;

/**
 * Get the information necessary for enumerating a vertex buffer.
 * @param vertexBuffer the vertex buffer to enumerate
 * @param meshes the meshes that use the vertex buffer
 * @returns the information necessary to enumerate the vertex buffer
 */
export function GetVertexBufferInfo(vertexBuffer: VertexBuffer, meshes: AbstractMesh[]) {
    const { byteOffset, byteStride, type, normalized } = vertexBuffer;
    const componentCount = vertexBuffer.getSize();
    const totalVertices = meshes.reduce((max, current) => {
        return current.getTotalVertices() > max ? current.getTotalVertices() : max;
    }, -Number.MAX_VALUE); // Get the max total vertices count, to ensure we capture the full range of vertex data used by the meshes.
    const count = totalVertices * componentCount;
    const kind = vertexBuffer.getKind();

    return { byteOffset, byteStride, componentCount, type, count, normalized, totalVertices, kind };
}

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

/** @internal */
export function ConvertToRightHandedTransformMatrix(matrix: Matrix): Matrix {
    ConvertHandednessMatrix.invertToRef(TmpVectors.Matrix[0]).multiplyToRef(matrix, matrix).multiplyToRef(ConvertHandednessMatrix, matrix);
    return matrix;
}

/**
 * Converts, in-place, a left-handed quaternion to a right-handed quaternion via a change of basis.
 * @param value the unit quaternion to convert
 * @returns the converted quaternion
 */
export function ConvertToRightHandedRotation(value: Quaternion): Quaternion {
    /**
     * This is the simplified version of the following equation:
     *    q' = to_quaternion(M * to_matrix(q) * M^-1)
     * where M is the conversion matrix `convertHandednessMatrix`,
     * q is the input quaternion, and q' is the converted quaternion.
     * Reference: https://d3cw3dd2w32x2b.cloudfront.net/wp-content/uploads/2015/01/matrix-to-quat.pdf
     */
    if (value.x * value.x + value.y * value.y > 0.5) {
        const absX = Math.abs(value.x);
        const absY = Math.abs(value.y);
        if (absX > absY) {
            const sign = Math.sign(value.x);
            value.x = absX;
            value.y *= -sign;
            value.z *= -sign;
            value.w *= sign;
        } else {
            const sign = Math.sign(value.y);
            value.x *= -sign;
            value.y = absY;
            value.z *= sign;
            value.w *= -sign;
        }
    } else {
        const absZ = Math.abs(value.z);
        const absW = Math.abs(value.w);
        if (absZ > absW) {
            const sign = Math.sign(value.z);
            value.x *= -sign;
            value.y *= sign;
            value.z = absZ;
            value.w *= -sign;
        } else {
            const sign = Math.sign(value.w);
            value.x *= sign;
            value.y *= -sign;
            value.z *= -sign;
            value.w = absW;
        }
    }

    return value;
}

/**
 * Pre-multiplies a 180-degree Y rotation to the quaternion, in order to match glTF's flipped forward direction for cameras.
 * @param rotation Target camera rotation.
 */
export function Rotate180Y(rotation: Quaternion): void {
    // Simplified from: rotation * (0, 1, 0, 0).
    rotation.copyFromFloats(-rotation.z, rotation.w, rotation.x, -rotation.y);
}

/**
 * Collapses GLTF parent and node into a single node, ignoring scaling.
 * This is useful for removing nodes that were added by the GLTF importer.
 * @param node Original GLTF node (Light or Camera).
 * @param parentNode Target parent node.
 */
export function CollapseChildIntoParent(node: INode, parentNode: INode): void {
    const parentTranslation = Vector3.FromArrayToRef(parentNode.translation || [0, 0, 0], 0, TmpVectors.Vector3[0]);
    const parentRotation = Quaternion.FromArrayToRef(parentNode.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[0]);
    const parentMatrix = Matrix.ComposeToRef(DefaultScale, parentRotation, parentTranslation, TmpVectors.Matrix[0]);

    const translation = Vector3.FromArrayToRef(node.translation || [0, 0, 0], 0, TmpVectors.Vector3[2]);
    const rotation = Quaternion.FromArrayToRef(node.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[1]);
    const matrix = Matrix.ComposeToRef(DefaultScale, rotation, translation, TmpVectors.Matrix[1]);

    parentMatrix.multiplyToRef(matrix, matrix);
    matrix.decompose(undefined, parentRotation, parentTranslation);

    if (parentTranslation.equalsWithEpsilon(DefaultTranslation, Epsilon)) {
        delete parentNode.translation;
    } else {
        parentNode.translation = parentTranslation.asArray();
    }

    if (parentRotation.equalsWithEpsilon(DefaultRotation, Epsilon)) {
        delete parentNode.rotation;
    } else {
        parentNode.rotation = parentRotation.asArray();
    }

    if (parentNode.scale) {
        delete parentNode.scale;
    }
}

/**
 * Checks whether a camera or light node is candidate for collapsing with its parent node.
 * This is useful for roundtrips, as the glTF Importer parents a new node to
 * lights and cameras to store their original transformation information.
 * @param babylonNode Babylon light or camera node.
 * @param parentBabylonNode Target Babylon parent node.
 * @returns True if the two nodes can be merged, false otherwise.
 */
export function IsChildCollapsible(babylonNode: ShadowLight | TargetCamera | AreaLight, parentBabylonNode: Node): boolean {
    if (!(parentBabylonNode instanceof TransformNode)) {
        return false;
    }

    // Verify child is the only descendant
    const isOnlyDescendant = parentBabylonNode.getChildren().length === 1 && babylonNode.getChildren().length === 0 && babylonNode.parent === parentBabylonNode;
    if (!isOnlyDescendant) {
        return false;
    }

    // Verify parent has the expected scaling, determined by the node type and scene's coordinate system.
    const scene = babylonNode.getScene();
    const expectedScale = babylonNode instanceof TargetCamera && !scene.useRightHandedSystem ? DefaultLoaderCameraParentScaleLh : DefaultScale;

    if (!parentBabylonNode.scaling.equalsWithEpsilon(expectedScale, Epsilon)) {
        Logger.Warn(`Cannot collapse node ${babylonNode.name} into parent node ${parentBabylonNode.name} with modified scaling.`);
        return false;
    }

    return true;
}

/**
 * Converts an IndicesArray into either a Uint32Array or Uint16Array.
 * If the `start` and `count` parameters specify a subset of the array, a new view is created.
 * If the input is a number[], the data is copied into a new buffer.
 * @param indices input array to be converted
 * @param start starting index
 * @param count number of indices
 * @param is32Bits whether the output should be Uint32Array (true) or Uint16Array (false) when indices is an `Array`
 * @returns a Uint32Array or Uint16Array
 * @internal
 */
export function IndicesArrayToTypedSubarray(indices: IndicesArray, start: number, count: number, is32Bits: boolean): Uint32Array | Uint16Array {
    let processedIndices = indices;
    if (start !== 0 || count !== indices.length) {
        processedIndices = Array.isArray(indices) ? indices.slice(start, start + count) : indices.subarray(start, start + count);
    }

    // If Int32Array, cast the indices (which should all be positive) to Uint32Array
    if (processedIndices instanceof Int32Array) {
        return new Uint32Array(processedIndices.buffer, processedIndices.byteOffset, processedIndices.length);
    }

    if (Array.isArray(processedIndices)) {
        return is32Bits ? new Uint32Array(processedIndices) : new Uint16Array(processedIndices);
    }

    return processedIndices;
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
export function OmitDefaultValues<T extends object>(object: T, defaultValues: Partial<T>): T {
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
