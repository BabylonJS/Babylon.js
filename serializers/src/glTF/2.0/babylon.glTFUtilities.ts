/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
    /**
     * @hidden
     */
    export class _GLTFUtilities {
        /**
         * @ignore
         * 
         * Creates a buffer view based on the supplied arguments
         * @param bufferIndex index value of the specified buffer
         * @param byteOffset byte offset value
         * @param byteLength byte length of the bufferView
         * @param byteStride byte distance between conequential elements
         * @param name name of the buffer view
         * @returns bufferView for glTF
         */
        public static CreateBufferView(bufferIndex: number, byteOffset: number, byteLength: number, byteStride?: number, name?: string): IBufferView {
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
         * @ignore
         * 
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
        public static CreateAccessor(bufferviewIndex: number, name: string, type: AccessorType, componentType: AccessorComponentType, count: number, byteOffset: Nullable<number>, min: Nullable<number[]>, max: Nullable<number[]>): IAccessor {
            let accessor: IAccessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };

            if (min) {
                accessor.min = min;
            }
            if (max) {
                accessor.max = max;
            }
            if (byteOffset) {
                accessor.byteOffset = byteOffset;
            }

            return accessor;
        }

        /**
         * @ignore
         * 
         * Calculates the minimum and maximum values of an array of position floats
         * @param positions Positions array of a mesh
         * @param vertexStart Starting vertex offset to calculate min and max values
         * @param vertexCount Number of vertices to check for min and max values
         * @returns min number array and max number array
         */
        public static CalculateMinMaxPositions(positions: FloatArray, vertexStart: number, vertexCount: number, convertToRightHandedSystem: boolean): { min: number[], max: number[] } {
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
                        _GLTFUtilities.GetRightHandedVector3FromRef(position);
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
         * @ignore
         * 
         * Converts a new right-handed Vector3
         * @param vector vector3 array
         * @returns right-handed Vector3
         */
        public static GetRightHandedVector3(vector: Vector3): Vector3 {
            return new Vector3(vector.x, vector.y, -vector.z);
        }

        /**
         * @ignore
         * 
         * Converts a Vector3 to right-handed
         * @param vector Vector3 to convert to right-handed
         */
        public static GetRightHandedVector3FromRef(vector: Vector3) {
            vector.z *= -1;
        }

        /**
         * @ignore
         * 
         * Converts a Vector4 to right-handed
         * @param vector Vector4 to convert to right-handed
         */
        public static GetRightHandedVector4FromRef(vector: Vector4) {
            vector.z *= -1;
            vector.w *= -1;
        }

        /**
         * @ignore
         * 
         * Converts a Quaternion to right-handed
         * @param quaternion Source quaternion to convert to right-handed
         */
        public static GetRightHandedQuaternionFromRef(quaternion: Quaternion) {
            quaternion.x *= -1;
            quaternion.y *= -1;
        }
    }
}