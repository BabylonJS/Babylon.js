/// <reference types="babylonjs"/>

declare module 'babylonjs-serializers' { 
    export = BABYLON; 
}

declare module BABYLON {
    class OBJExport {
        static OBJ(mesh: Mesh[], materials?: boolean, matlibname?: string, globalposition?: boolean): string;
        static MTL(mesh: Mesh): string;
    }
}


declare module BABYLON {
    class GLTF2Export {
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * If glb is set to true, exports as .glb.
         * @param meshes
         * @param materials
         *
         * @returns {[fileName: string]: string | Blob} Returns an object with a .gltf, .glb and associates textures
         * as keys and their data and paths as values.
         */
        static GLTF(scene: BABYLON.Scene, filename: string): {
            [fileName: string]: string | Blob;
        };
        /**
         *
         * @param meshes
         * @param filename
         *
         * @returns {[fileName: string]: string | Blob} Returns an object with a .glb filename as key and data as value
         */
        static GLB(scene: BABYLON.Scene, filename: string): {
            [fileName: string]: string | Blob;
        };
        /**
         * Downloads data from glTF object.
         *
         * @param gltfData glTF object with keys being file names and values being data
         */
        static downloadFiles(gltfData: {
            [fileName: string]: string | Blob;
        }): void;
    }
}

declare module BABYLON {
    class _GLTF2Exporter {
        private bufferViews;
        private accessors;
        private nodes;
        private asset;
        private scenes;
        private meshes;
        private totalByteLength;
        private babylonScene;
        constructor(babylonScene: BABYLON.Scene);
        /**
         * Creates a buffer view based on teh supplied arguments
         * @param bufferIndex
         * @param byteOffset
         * @param byteLength
         *
         * @returns {_IGLTFBufferView}
         */
        private createBufferView(bufferIndex, byteOffset, byteLength);
        /**
         * Creates an accessor based on the supplied arguments
         * @param bufferviewIndex
         * @param name
         * @param type
         * @param componentType
         * @param count
         * @param min
         * @param max
         *
         * @returns {_IGLTFAccessor}
         */
        private createAccessor(bufferviewIndex, name, type, componentType, count, min?, max?);
        /**
         * Calculates the minimum and maximum values of an array of floats, based on stride
         * @param buff
         * @param vertexStart
         * @param vertexCount
         * @param arrayOffset
         * @param stride
         *
         * @returns {min: number[], max: number[]} min number array and max number array
         */
        private calculateMinMax(buff, vertexStart, vertexCount, arrayOffset, stride);
        /**
         * Write mesh attribute data to buffer.
         * Returns the bytelength of the data.
         * @param vertexBufferType
         * @param submesh
         * @param meshAttributeArray
         * @param strideSize
         * @param byteOffset
         * @param dataBuffer
         * @param useRightHandedSystem
         *
         * @returns {number} byte length
         */
        private writeAttributeData(vertexBufferType, submesh, meshAttributeArray, strideSize, byteOffset, dataBuffer, useRightHandedSystem);
        /**
         * Generates glTF json data
         * @param glb
         * @param glTFPrefix
         * @param prettyPrint
         *
         * @returns {string} json data as string
         */
        private generateJSON(glb, glTFPrefix?, prettyPrint?);
        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix
         *
         * @returns {[x: string]: string | Blob} object with glTF json tex filename
         * and binary file name as keys and their data as values
         */
        _generateGLTF(glTFPrefix: string): {
            [x: string]: string | Blob;
        };
        /**
         * Creates a binary buffer for glTF
         *
         * @returns {ArrayBuffer}
         */
        private generateBinary();
        /**
         * Generates a glb file from the json and binary data.
         * Returns an object with the glb file name as the key and data as the value.
         * @param jsonText
         * @param binaryBuffer
         * @param glTFPrefix
         *
         * @returns {[glbFileName: string]: Blob} object with glb filename as key and data as value
         */
        _generateGLB(glTFPrefix: string): {
            [glbFileName: string]: Blob;
        };
        /**
         * Sets the TRS for each node
         * @param node
         * @param babylonMesh
         * @param useRightHandedSystem
         */
        private setNodeTransformation(node, babylonMesh, useRightHandedSystem);
        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh
         * @param babylonMesh
         * @param byteOffset
         * @param useRightHandedSystem
         * @param dataBuffer
         *
         * @returns {number} bytelength of the primitive attributes plus the passed in byteOffset
         */
        private setPrimitiveAttributes(mesh, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer?);
        /**
         * Creates a glTF scene based on the array of meshes.
         * Returns the the total byte offset.
         * @param gltf
         * @param byteOffset
         * @param buffer
         * @param dataBuffer
         *
         * @returns {number} bytelength + byteoffset
         */
        private createScene(babylonScene, byteOffset, dataBuffer?);
    }
}
