import { IBufferView, AccessorType, AccessorComponentType, IAccessor } from "babylonjs-gltf2interface";

import { FloatArray, Nullable } from "babylonjs/types";
import { Vector3, Vector4, Quaternion, Matrix } from "babylonjs/Maths/math.vector";

/**
 * @hidden
 */
export class _GLTFUtilities {
    /**
     * Creates a buffer view based on the supplied arguments
     * @param bufferIndex index value of the specified buffer
     * @param byteOffset byte offset value
     * @param byteLength byte length of the bufferView
     * @param byteStride byte distance between conequential elements
     * @param name name of the buffer view
     * @returns bufferView for glTF
     */
    public static _CreateBufferView(bufferIndex: number, byteOffset: number, byteLength: number, byteStride?: number, name?: string): IBufferView {
        let bufferview: IBufferView = { buffer: bufferIndex, byteLength: byteLength };
        if (byteOffset) {
            bufferview.byteOffset = byteOffset;
        }
        if (name) {
            bufferview.name = name;
        }
        if (byteStride) {
            bufferview.byteStride = byteStride;
        }

        return bufferview;
    }

    /**
     * Creates an accessor based on the supplied arguments
     * @param bufferviewIndex The index of the bufferview referenced by this accessor
     * @param name The name of the accessor
     * @param type The type of the accessor
     * @param componentType The datatype of components in the attribute
     * @param count The number of attributes referenced by this accessor
     * @param byteOffset The offset relative to the start of the bufferView in bytes
     * @param min Minimum value of each component in this attribute
     * @param max Maximum value of each component in this attribute
     * @returns accessor for glTF
     */
    public static _CreateAccessor(bufferviewIndex: number, name: string, type: AccessorType, componentType: AccessorComponentType, count: number, byteOffset: Nullable<number>, min: Nullable<number[]>, max: Nullable<number[]>): IAccessor {
        let accessor: IAccessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };

        if (min != null) {
            accessor.min = min;
        }
        if (max != null) {
            accessor.max = max;
        }
        if (byteOffset != null) {
            accessor.byteOffset = byteOffset;
        }

        return accessor;
    }

    /**
     * Calculates the minimum and maximum values of an array of position floats
     * @param positions Positions array of a mesh
     * @param vertexStart Starting vertex offset to calculate min and max values
     * @param vertexCount Number of vertices to check for min and max values
     * @returns min number array and max number array
     */
    public static _CalculateMinMaxPositions(positions: FloatArray, vertexStart: number, vertexCount: number, convertToRightHandedSystem: boolean): { min: number[], max: number[] } {
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        const positionStrideSize = 3;
        let indexOffset: number;
        let position: Vector3;
        let vector: number[];

        if (vertexCount) {
            for (let i = vertexStart, length = vertexStart + vertexCount; i < length; ++i) {
                indexOffset = positionStrideSize * i;

                position = Vector3.FromArray(positions, indexOffset);
                if (convertToRightHandedSystem) {
                    _GLTFUtilities._GetRightHandedPositionVector3FromRef(position);
                }
                vector = position.asArray();

                for (let j = 0; j < positionStrideSize; ++j) {
                    let num = vector[j];
                    if (num < min[j]) {
                        min[j] = num;
                    }
                    if (num > max[j]) {
                        max[j] = num;
                    }
                    ++indexOffset;
                }
            }
        }
        return { min, max };
    }

    /**
     * Converts a new right-handed Vector3
     * @param vector vector3 array
     * @returns right-handed Vector3
     */
    public static _GetRightHandedPositionVector3(vector: Vector3): Vector3 {
        return new Vector3(vector.x, vector.y, -vector.z);
    }

    /**
     * Converts a Vector3 to right-handed
     * @param vector Vector3 to convert to right-handed
     */
    public static _GetRightHandedPositionVector3FromRef(vector: Vector3) {
        vector.z *= -1;
    }

    /**
     * Converts a three element number array to right-handed
     * @param vector number array to convert to right-handed
     */
    public static _GetRightHandedPositionArray3FromRef(vector: number[]) {
        vector[2] *= -1;
    }

    /**
     * Converts a new right-handed Vector3
     * @param vector vector3 array
     * @returns right-handed Vector3
     */
    public static _GetRightHandedNormalVector3(vector: Vector3): Vector3 {
        return new Vector3(vector.x, vector.y, -vector.z);
    }

    /**
     * Converts a Vector3 to right-handed
     * @param vector Vector3 to convert to right-handed
     */
    public static _GetRightHandedNormalVector3FromRef(vector: Vector3) {
        vector.z *= -1;
    }

    /**
     * Converts a three element number array to right-handed
     * @param vector number array to convert to right-handed
     */
    public static _GetRightHandedNormalArray3FromRef(vector: number[]) {
        vector[2] *= -1;
    }

    /**
     * Converts a Vector4 to right-handed
     * @param vector Vector4 to convert to right-handed
     */
    public static _GetRightHandedVector4FromRef(vector: Vector4) {
        vector.z *= -1;
        vector.w *= -1;
    }

    /**
     * Converts a Vector4 to right-handed
     * @param vector Vector4 to convert to right-handed
     */
    public static _GetRightHandedArray4FromRef(vector: number[]) {
        vector[2] *= -1;
        vector[3] *= -1;
    }

    /**
     * Converts a Quaternion to right-handed
     * @param quaternion Source quaternion to convert to right-handed
     */
    public static _GetRightHandedQuaternionFromRef(quaternion: Quaternion) {
        quaternion.x *= -1;
        quaternion.y *= -1;
    }

    /**
     * Converts a Quaternion to right-handed
     * @param quaternion Source quaternion to convert to right-handed
     */
    public static _GetRightHandedQuaternionArrayFromRef(quaternion: number[]) {
        quaternion[0] *= -1;
        quaternion[1] *= -1;
    }

    public static _NormalizeTangentFromRef(tangent: Vector4) {
        const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y + tangent.z * tangent.z);
        if (length > 0) {
            tangent.x /= length;
            tangent.y /= length;
            tangent.z /= length;
        }
    }

    public static _GetRightHandedMatrixFromRef(matrix: Matrix) {
        const m = matrix.m;
        Matrix.FromValuesToRef(
            m[0], m[1], -m[2], m[3],
            m[4], m[5], -m[6], m[7],
            -m[8], m[9], m[10], m[11],
            m[12], m[13], m[14], m[15],
            matrix
        );
    }

    public static _GetDataAccessorElementCount(accessorType: AccessorType) {
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
}