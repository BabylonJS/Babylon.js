
declare module BABYLON {
    interface IGLTFExporterOptions {
        /**
         * Interface function which indicates whether a babylon mesh should be exported or not.
         * @param mesh
         * @returns boolean, which indicates whether the mesh should be exported (true) or not (false)
         */
        shouldExportMesh?(mesh: AbstractMesh): boolean;
    }
    class GLTF2Export {
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * @param meshes
         * @param materials
         * @param options
         *
         * @returns - Returns an object with a .gltf, .glb and associates textures
         * as keys and their data and paths as values.
         */
        static GLTF(scene: Scene, filename: string, options?: IGLTFExporterOptions): _GLTFData;
        /**
         *
         * @param meshes
         * @param filename
         *
         * @returns - Returns an object with a .glb filename as key and data as value
         */
        static GLB(scene: Scene, filename: string, options?: IGLTFExporterOptions): _GLTFData;
    }
}

declare module BABYLON {
    /**
     * glTF Alpha Mode Enum
     */
    enum _EGLTFAlphaModeEnum {
        OPAQUE = "OPAQUE",
        MASK = "MASK",
        BLEND = "BLEND",
    }
    /**
     * Babylon Specular Glossiness interface
     */
    interface _IBabylonSpecularGlossiness {
        diffuse: Color3;
        opacity: number;
        specular: Color3;
        glossiness: number;
    }
    /**
     * Babylon Metallic Roughness interface
     */
    interface _IBabylonMetallicRoughness {
        baseColor: Color3;
        opacity: number;
        metallic: number;
        roughness: number;
    }
    /**
     * Converts Babylon Scene into glTF 2.0
     */
    class _GLTF2Exporter {
        private bufferViews;
        private accessors;
        private nodes;
        private asset;
        private scenes;
        private meshes;
        private materials;
        private textures;
        private images;
        private totalByteLength;
        private babylonScene;
        private options?;
        private imageData;
        constructor(babylonScene: Scene, options?: IGLTFExporterOptions);
        /**
         * Creates a buffer view based on teh supplied arguments
         * @param {number} bufferIndex - index value of the specified buffer
         * @param {number} byteOffset - byte offset value
         * @param {number} byteLength - byte length of the bufferView
         * @returns - bufferView for glTF
         */
        private createBufferView(bufferIndex, byteOffset, byteLength, name?);
        /**
         * Creates an accessor based on the supplied arguments
         * @param bufferviewIndex
         * @param name
         * @param type
         * @param componentType
         * @param count
         * @param min
         * @param max
         * @returns - accessor for glTF
         */
        private createAccessor(bufferviewIndex, name, type, componentType, count, min?, max?);
        /**
         * Calculates the minimum and maximum values of an array of floats, based on stride
         * @param buff
         * @param vertexStart
         * @param vertexCount
         * @param arrayOffset
         * @param stride
         * @returns - min number array and max number array
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
         * @returns - byte length
         */
        private writeAttributeData(vertexBufferType, submesh, meshAttributeArray, strideSize, byteOffset, dataBuffer, useRightHandedSystem);
        /**
         * Generates glTF json data
         * @param glb
         * @param glTFPrefix
         * @param prettyPrint
         * @returns - json data as string
         */
        private generateJSON(glb, glTFPrefix?, prettyPrint?);
        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix
         * @returns - object with glTF json tex filename
         * and binary file name as keys and their data as values
         */
        _generateGLTF(glTFPrefix: string): _GLTFData;
        /**
         * Creates a binary buffer for glTF
         * @returns - array buffer for binary data
         */
        private generateBinary();
        /**
         * Pads the number to a power of 4
         * @param num - number to pad
         * @returns - padded number
         */
        private _getPadding(num);
        /**
         * Generates a glb file from the json and binary data.
         * Returns an object with the glb file name as the key and data as the value.
         * @param jsonText
         * @param binaryBuffer
         * @param glTFPrefix
         * @returns - object with glb filename as key and data as value
         */
        _generateGLB(glTFPrefix: string): _GLTFData;
        /**
         * Sets the TRS for each node
         * @param node
         * @param babylonMesh
         * @param useRightHandedSystem
         */
        private setNodeTransformation(node, babylonMesh, useRightHandedSystem);
        /**
         *
         * @param babylonTexture
         * @return - glTF texture, or null if the texture format is not supported
         */
        private exportTexture(babylonTexture, mimeType?);
        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh
         * @param babylonMesh
         * @param byteOffset
         * @param useRightHandedSystem
         * @param dataBuffer
         * @returns - bytelength of the primitive attributes plus the passed in byteOffset
         */
        private setPrimitiveAttributes(mesh, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer?);
        /**
         * Creates a glTF scene based on the array of meshes.
         * Returns the the total byte offset.
         * @param gltf
         * @param byteOffset
         * @param buffer
         * @param dataBuffer
         * @returns bytelength + byteoffset
         */
        private createScene(babylonScene, byteOffset, dataBuffer?);
    }
}

declare module BABYLON {
    /**
     * Class for holding and downloading glTF file data
     */
    class _GLTFData {
        glTFFiles: {
            [fileName: string]: string | Blob;
        };
        constructor();
        /**
         * Downloads glTF data.
         */
        downloadFiles(): void;
    }
}

declare module BABYLON {
    /**
     * Utility methods for working with glTF material conversion properties
     */
    class _GLTFMaterial {
        private static dielectricSpecular;
        private static epsilon;
        /**
         * Converts Specular Glossiness to Metallic Roughness
         * @param  babylonSpecularGlossiness - Babylon specular glossiness parameters
         * @returns - Babylon metallic roughness values
         */
        static ConvertToMetallicRoughness(babylonSpecularGlossiness: _IBabylonSpecularGlossiness): _IBabylonMetallicRoughness;
        /**
         * Returns the perceived brightness value based on the provided color
         * @param color - color used in calculating the perceived brightness
         * @returns - perceived brightness value
         */
        private static PerceivedBrightness(color);
        /**
         * Computes the metallic factor
         * @param diffuse - diffused value
         * @param specular - specular value
         * @param oneMinusSpecularStrength - one minus the specular strength
         * @returns - metallic value
         */
        static SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number;
        /**
         * Gets the glTF alpha mode from the Babylon Material
         * @param babylonMaterial - Babylon Material
         * @returns - The Babylon alpha mode value
         */
        static GetAlphaMode(babylonMaterial: Material): string;
    }
}
