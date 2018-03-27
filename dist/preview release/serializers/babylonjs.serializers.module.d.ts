

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
    /**
     * Holds a collection of exporter options and parameters
     */
    interface IExporterOptions {
        /**
         * Function which indicates whether a babylon mesh should be exported or not.
         * @param mesh - source Babylon mesh. It is used to check whether it should be
         * exported to glTF or not.
         * @returns boolean, which indicates whether the mesh should be exported (true) or not (false)
         */
        shouldExportMesh?(mesh: AbstractMesh): boolean;
    }
    /**
     * Class for generating glTF data from a Babylon scene.
     */
    class GLTF2Export {
        /**
         * Exports the geometry of the scene to .gltf file format.
         * @param scene - Babylon scene with scene hierarchy information.
         * @param filePrefix - File prefix to use when generating the glTF file.
         * @param options - Exporter options.
         * @returns - Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values.
         */
        static GLTF(scene: Scene, filePrefix: string, options?: IExporterOptions): _GLTFData;
        /**
         * Exports the geometry of the scene to .glb file format.
         * @param scene - Babylon scene with scene hierarchy information.
         * @param filePrefix - File prefix to use when generating glb file.
         * @param options - Exporter options.
         * @returns - Returns an object with a .glb filename as key and data as value
         */
        static GLB(scene: Scene, filePrefix: string, options?: IExporterOptions): _GLTFData;
    }
}


/**
 * Module for the Babylon glTF 2.0 exporter.  Should ONLY be used internally.
 * @ignore - capitalization of GLTF2 module.
 */
declare module BABYLON.GLTF2 {
    /**
     * Converts Babylon Scene into glTF 2.0.
     */
    class _Exporter {
        /**
         * Stores all generated buffer views, which represents views into the main glTF buffer data.
         */
        private bufferViews;
        /**
         * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF.
         */
        private accessors;
        /**
         * Stores all the generated nodes, which contains transform and/or mesh information per node.
         */
        private nodes;
        /**
         * Stores the glTF asset information, which represents the glTF version and this file generator.
         */
        private asset;
        /**
         * Stores all the generated glTF scenes, which stores multiple node hierarchies.
         */
        private scenes;
        /**
         * Stores all the generated mesh information, each containing a set of primitives to render in glTF.
         */
        private meshes;
        /**
         * Stores all the generated material information, which represents the appearance of each primitive.
         */
        private materials;
        /**
         * Stores all the generated texture information, which is referenced by glTF materials.
         */
        private textures;
        /**
         * Stores all the generated image information, which is referenced by glTF textures.
         */
        private images;
        /**
         * Stores the total amount of bytes stored in the glTF buffer.
         */
        private totalByteLength;
        /**
         * Stores a reference to the Babylon scene containing the source geometry and material information.
         */
        private babylonScene;
        /**
         * Stores the exporter options, which are optionally passed in from the glTF serializer.
         */
        private options?;
        /**
         * Stores a map of the image data, where the key is the file name and the value
         * is the image data.
         */
        private imageData;
        /**
         * Stores a map of the unique id of a node to its index in the node array.
         */
        private nodeMap;
        /**
         * Stores the binary buffer used to store geometry data.
         */
        private binaryBuffer;
        /**
         * Specifies if the Babylon scene should be converted to right-handed on export.
         */
        private convertToRightHandedSystem;
        /**
         * Creates a glTF Exporter instance, which can accept optional exporter options.
         * @param babylonScene - Babylon scene object
         * @param options - Options to modify the behavior of the exporter.
         */
        constructor(babylonScene: Scene, options?: IExporterOptions);
        /**
         * Creates a buffer view based on teh supplied arguments
         * @param bufferIndex - index value of the specified buffer
         * @param byteOffset - byte offset value
         * @param byteLength - byte length of the bufferView
         * @param byteStride - byte distance between conequential elements.
         * @param name - name of the buffer view
         * @returns - bufferView for glTF
         */
        private createBufferView(bufferIndex, byteOffset, byteLength, byteStride?, name?);
        /**
         * Creates an accessor based on the supplied arguments
         * @param bufferviewIndex - The index of the bufferview referenced by this accessor.
         * @param name - The name of the accessor.
         * @param type - The type of the accessor.
         * @param componentType - The datatype of components in the attribute.
         * @param count - The number of attributes referenced by this accessor.
         * @param byteOffset - The offset relative to the start of the bufferView in bytes.
         * @param min - Minimum value of each component in this attribute.
         * @param max - Maximum value of each component in this attribute.
         * @returns - accessor for glTF
         */
        private createAccessor(bufferviewIndex, name, type, componentType, count, byteOffset, min, max);
        /**
         * Calculates the minimum and maximum values of an array of position floats.
         * @param positions - Positions array of a mesh.
         * @param vertexStart - Starting vertex offset to calculate min and max values.
         * @param vertexCount - Number of vertices to check for min and max values.
         * @returns - min number array and max number array.
         */
        private calculateMinMaxPositions(positions, vertexStart, vertexCount);
        /**
         * Converts a vector3 array to right-handed.
         * @param vector - vector3 Array to convert to right-handed.
         * @returns - right-handed Vector3 array.
         */
        private static GetRightHandedVector3(vector);
        /**
         * Converts a vector4 array to right-handed.
         * @param vector - vector4 Array to convert to right-handed.
         * @returns - right-handed vector4 array.
         */
        private static GetRightHandedVector4(vector);
        /**
         * Converts a quaternion to right-handed.
         * @param quaternion - Source quaternion to convert to right-handed.
         */
        private static GetRightHandedQuaternion(quaternion);
        /**
         * Writes mesh attribute data to a data buffer.
         * Returns the bytelength of the data.
         * @param vertexBufferKind - Indicates what kind of vertex data is being passed in.
         * @param meshAttributeArray - Array containing the attribute data.
         * @param byteOffset - The offset to start counting bytes from.
         * @param dataBuffer - The buffer to write the binary data to.
         * @returns - Byte length of the attribute data.
         */
        private writeAttributeData(vertexBufferKind, meshAttributeArray, byteOffset, dataBuffer);
        /**
         * Generates glTF json data
         * @param shouldUseGlb - Indicates whether the json should be written for a glb file.
         * @param glTFPrefix - Text to use when prefixing a glTF file.
         * @param prettyPrint - Indicates whether the json file should be pretty printed (true) or not (false).
         * @returns - json data as string
         */
        private generateJSON(shouldUseGlb, glTFPrefix?, prettyPrint?);
        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix - Text to use when prefixing a glTF file.
         * @returns - GLTFData with glTF file data.
         */
        _generateGLTF(glTFPrefix: string): _GLTFData;
        /**
         * Creates a binary buffer for glTF
         * @returns - array buffer for binary data
         */
        private generateBinary();
        /**
         * Pads the number to a multiple of 4
         * @param num - number to pad
         * @returns - padded number
         */
        private _getPadding(num);
        /**
         * Generates a glb file from the json and binary data.
         * Returns an object with the glb file name as the key and data as the value.
         * @param glTFPrefix
         * @returns - object with glb filename as key and data as value
         */
        _generateGLB(glTFPrefix: string): _GLTFData;
        /**
         * Sets the TRS for each node
         * @param node - glTF Node for storing the transformation data.
         * @param babylonMesh - Babylon mesh used as the source for the transformation data.
         */
        private setNodeTransformation(node, babylonMesh);
        /**
         * Creates a bufferview based on the vertices type for the Babylon mesh
         * @param kind - Indicates the type of vertices data.
         * @param babylonMesh - The Babylon mesh to get the vertices data from.
         * @param byteOffset - The offset from the buffer to start indexing from.
         * @param dataBuffer - The buffer to write the bufferview data to.
         * @returns bytelength of the bufferview data.
         */
        private createBufferViewKind(kind, babylonMesh, byteOffset, dataBuffer);
        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh - glTF Mesh object to store the primitive attribute information.
         * @param babylonMesh - Babylon mesh to get the primitive attribute data from.
         * @param byteOffset - The offset in bytes of the buffer data.
         * @param dataBuffer - Buffer to write the attribute data to.
         * @returns - bytelength of the primitive attributes plus the passed in byteOffset.
         */
        private setPrimitiveAttributes(mesh, babylonMesh, byteOffset, dataBuffer);
        /**
         * Creates a glTF scene based on the array of meshes.
         * Returns the the total byte offset.
         * @param babylonScene - Babylon scene to get the mesh data from.
         * @param byteOffset - Offset to start from in bytes.
         * @returns bytelength + byteoffset
         */
        private createScene(babylonScene, byteOffset);
        /**
         * Creates a mapping of Node unique id to node index
         * @param scene - Babylon Scene.
         * @param byteOffset - The initial byte offset.
         * @returns - Node mapping of unique id to index.
         */
        private createNodeMap(scene, byteOffset);
        /**
         * Creates a glTF node from a Babylon mesh.
         * @param babylonMesh - Source Babylon mesh.
         * @param byteOffset - The initial byte offset.
         * @param dataBuffer - Buffer for storing geometry data.
         * @returns - Object containing an INode and byteoffset.
         */
        private createNode(babylonMesh, byteOffset, dataBuffer);
    }
}


declare module BABYLON {
    /**
     * Class for holding and downloading glTF file data
     */
    class _GLTFData {
        /**
         * Object which contains the file name as the key and its data as the value.
         */
        glTFFiles: {
            [fileName: string]: string | Blob;
        };
        /**
         * Initializes the glTF file object.
         */
        constructor();
        /**
         * Downloads the glTF data as files based on their names and data.
         */
        downloadFiles(): void;
    }
}


declare module BABYLON.GLTF2 {
    /**
     * Utility methods for working with glTF material conversion properties.  This class should only be used internally.
     */
    class _GLTFMaterial {
        /**
         * Represents the dielectric specular values for R, G and B.
         */
        private static readonly _dielectricSpecular;
        /**
         * Allows the maximum specular power to be defined for material calculations.
         */
        private static _maxSpecularPower;
        /**
         * Numeric tolerance value
         */
        private static _epsilon;
        /**
         * Specifies if two colors are approximately equal in value.
         * @param color1 - first color to compare to.
         * @param color2 - second color to compare to.
         * @param epsilon - threshold value
         */
        private static FuzzyEquals(color1, color2, epsilon);
        /**
         * Gets the materials from a Babylon scene and converts them to glTF materials.
         * @param scene - babylonjs scene.
         * @param mimeType - texture mime type.
         * @param images - array of images.
         * @param textures - array of textures.
         * @param materials - array of materials.
         * @param imageData - mapping of texture names to base64 textures
         * @param hasTextureCoords - specifies if texture coordinates are present on the material.
         */
        static _ConvertMaterialsToGLTF(babylonMaterials: Material[], mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        /**
         * Makes a copy of the glTF material without the texture parameters.
         * @param originalMaterial - original glTF material.
         * @returns glTF material without texture parameters
         */
        static _StripTexturesFromMaterial(originalMaterial: IMaterial): IMaterial;
        /**
         * Specifies if the material has any texture parameters present.
         * @param material - glTF Material.
         * @returns boolean specifying if texture parameters are present
         */
        static _HasTexturesPresent(material: IMaterial): boolean;
        /**
         * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material.
         * @param babylonStandardMaterial
         * @returns - glTF Metallic Roughness Material representation
         */
        static _ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness;
        /**
         * Computes the metallic factor
         * @param diffuse - diffused value
         * @param specular - specular value
         * @param oneMinusSpecularStrength - one minus the specular strength
         * @returns - metallic value
         */
        static _SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number;
        /**
         * Gets the glTF alpha mode from the Babylon Material
         * @param babylonMaterial - Babylon Material
         * @returns - The Babylon alpha mode value
         */
        static _GetAlphaMode(babylonMaterial: Material): MaterialAlphaMode;
        /**
         * Converts a Babylon Standard Material to a glTF Material.
         * @param babylonStandardMaterial - BJS Standard Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param materials - array of glTF material interfaces.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         */
        static _ConvertStandardMaterial(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        /**
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material.
         * @param babylonPBRMetalRoughMaterial - BJS PBR Metallic Roughness Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param materials - array of glTF material interfaces.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         */
        static _ConvertPBRMetallicRoughnessMaterial(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        /**
         * Converts an image typed array buffer to a base64 image.
         * @param buffer - typed array buffer.
         * @param width - width of the image.
         * @param height - height of the image.
         * @param mimeType - mimetype of the image.
         * @returns - base64 image string.
         */
        private static _CreateBase64FromCanvas(buffer, width, height, mimeType);
        /**
         * Generates a white texture based on the specified width and height.
         * @param width - width of the texture in pixels.
         * @param height - height of the texture in pixels.
         * @param scene - babylonjs scene.
         * @returns - white texture.
         */
        private static _CreateWhiteTexture(width, height, scene);
        /**
         * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null.
         * @param texture1 - first texture to resize.
         * @param texture2 - second texture to resize.
         * @param scene - babylonjs scene.
         * @returns resized textures or null.
         */
        private static _ResizeTexturesToSameDimensions(texture1, texture2, scene);
        /**
         * Convert Specular Glossiness Textures to Metallic Roughness.
         * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
         * @link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
         * @param diffuseTexture - texture used to store diffuse information.
         * @param specularGlossinessTexture - texture used to store specular and glossiness information.
         * @param factors - specular glossiness material factors.
         * @param mimeType - the mime type to use for the texture.
         * @returns pbr metallic roughness interface or null.
         */
        private static _ConvertSpecularGlossinessTexturesToMetallicRoughness(diffuseTexture, specularGlossinessTexture, factors, mimeType);
        /**
         * Converts specular glossiness material properties to metallic roughness.
         * @param specularGlossiness - interface with specular glossiness material properties.
         * @returns - interface with metallic roughness material properties.
         */
        private static _ConvertSpecularGlossinessToMetallicRoughness(specularGlossiness);
        /**
         * Calculates the surface reflectance, independent of lighting conditions.
         * @param color - Color source to calculate brightness from.
         * @returns number representing the perceived brightness, or zero if color is undefined.
         */
        private static _GetPerceivedBrightness(color);
        /**
         * Returns the maximum color component value.
         * @param color
         * @returns maximum color component value, or zero if color is null or undefined.
         */
        private static _GetMaxComponent(color);
        /**
         * Convert a PBRMaterial (Metallic/Roughness) to Metallic Roughness factors.
         * @param babylonPBRMaterial - BJS PBR Metallic Roughness Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param glTFPbrMetallicRoughness - glTF PBR Metallic Roughness interface.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         * @returns - glTF PBR Metallic Roughness factors.
         */
        private static _ConvertMetalRoughFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
        /**
         * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors.
         * @param babylonPBRMaterial - BJS PBR Metallic Roughness Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param glTFPbrMetallicRoughness - glTF PBR Metallic Roughness interface.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         * @returns - glTF PBR Metallic Roughness factors.
         */
        private static _ConvertSpecGlossFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
        /**
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material.
         * @param babylonPBRMaterial - BJS PBR Metallic Roughness Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param materials - array of glTF material interfaces.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         */
        static _ConvertPBRMaterial(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        /**
         * Extracts a texture from a Babylon texture into file data and glTF data.
         * @param babylonTexture - Babylon texture to extract.
         * @param mimeType - Mime Type of the babylonTexture.
         * @param images - Array of glTF images.
         * @param textures - Array of glTF textures.
         * @param imageData - map of image file name and data.
         * @return - glTF texture info, or null if the texture format is not supported.
         */
        private static _ExportTexture(babylonTexture, mimeType, images, textures, imageData);
        /**
         * Builds a texture from base64 string.
         * @param base64Texture - base64 texture string.
         * @param textureName - Name to use for the texture.
         * @param mimeType - image mime type for the texture.
         * @param images - array of images.
         * @param textures - array of textures.
         * @param imageData - map of image data.
         * @returns - glTF texture info, or null if the texture format is not supported.
         */
        private static _GetTextureInfoFromBase64(base64Texture, textureName, mimeType, images, textures, imageData);
    }
}
