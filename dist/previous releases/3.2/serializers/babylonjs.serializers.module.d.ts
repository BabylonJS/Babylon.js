/// <reference types="babylonjs"/>
/// <reference types="babylonjs-gltf2interface"/>


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
    interface IExportOptions {
        /**
         * Function which indicates whether a babylon mesh should be exported or not
         * @param transformNode source Babylon transform node. It is used to check whether it should be exported to glTF or not
         * @returns boolean, which indicates whether the mesh should be exported (true) or not (false)
         */
        shouldExportTransformNode?(transformNode: TransformNode): boolean;
        /**
         * The sample rate to bake animation curves
         */
        animationSampleRate?: number;
    }
    /**
     * Class for generating glTF data from a Babylon scene.
     */
    class GLTF2Export {
        /**
         * Exports the geometry of the scene to .gltf file format synchronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating the glTF file
         * @param options Exporter options
         * @returns Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values
         */
        private static GLTF(scene, filePrefix, options?);
        /**
         * Exports the geometry of the scene to .gltf file format asynchronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating the glTF file
         * @param options Exporter options
         * @returns Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values
         */
        static GLTFAsync(scene: Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData>;
        /**
         * Exports the geometry of the scene to .glb file format synchronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating glb file
         * @param options Exporter options
         * @returns Returns an object with a .glb filename as key and data as value
         */
        private static GLB(scene, filePrefix, options?);
        /**
         * Exports the geometry of the scene to .glb file format asychronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating glb file
         * @param options Exporter options
         * @returns Returns an object with a .glb filename as key and data as value
         */
        static GLBAsync(scene: Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData>;
    }
}


/**
 * Module for the Babylon glTF 2.0 exporter.  Should ONLY be used internally
 * @hidden
 */
declare module BABYLON.GLTF2 {
    /**
     * Converts Babylon Scene into glTF 2.0.
     * @hidden
     */
    class _Exporter {
        /**
         * Stores all generated buffer views, which represents views into the main glTF buffer data
         */
        private bufferViews;
        /**
         * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF
         */
        private accessors;
        /**
         * Stores all the generated nodes, which contains transform and/or mesh information per node
         */
        private nodes;
        /**
         * Stores the glTF asset information, which represents the glTF version and this file generator
         */
        private asset;
        /**
         * Stores all the generated glTF scenes, which stores multiple node hierarchies
         */
        private scenes;
        /**
         * Stores all the generated mesh information, each containing a set of primitives to render in glTF
         */
        private meshes;
        /**
         * Stores all the generated material information, which represents the appearance of each primitive
         */
        private materials;
        /**
         * Stores all the generated texture information, which is referenced by glTF materials
         */
        private textures;
        /**
         * Stores all the generated image information, which is referenced by glTF textures
         */
        private images;
        /**
         * Stores all the texture samplers
         */
        private samplers;
        /**
         * Stores all the generated animation samplers, which is referenced by glTF animations
         */
        /**
         * Stores the animations for glTF models
         */
        private animations;
        /**
         * Stores the total amount of bytes stored in the glTF buffer
         */
        private totalByteLength;
        /**
         * Stores a reference to the Babylon scene containing the source geometry and material information
         */
        private babylonScene;
        /**
         * Stores a map of the image data, where the key is the file name and the value
         * is the image data
         */
        private imageData;
        /**
         * Stores a map of the unique id of a node to its index in the node array
         */
        private nodeMap;
        /**
         * Specifies if the Babylon scene should be converted to right-handed on export
         */
        private convertToRightHandedSystem;
        /**
         * Baked animation sample rate
         */
        private animationSampleRate;
        private shouldExportTransformNode;
        /**
         * Creates a glTF Exporter instance, which can accept optional exporter options
         * @param babylonScene Babylon scene object
         * @param options Options to modify the behavior of the exporter
         */
        constructor(babylonScene: Scene, options?: IExportOptions);
        private reorderIndicesBasedOnPrimitiveMode(submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter);
        /**
         * Reorders the vertex attribute data based on the primitive mode.  This is necessary when indices are not available and the winding order is
         * clock-wise during export to glTF
         * @param submesh BabylonJS submesh
         * @param primitiveMode Primitive mode of the mesh
         * @param sideOrientation the winding order of the submesh
         * @param vertexBufferKind The type of vertex attribute
         * @param meshAttributeArray The vertex attribute data
         * @param byteOffset The offset to the binary data
         * @param binaryWriter The binary data for the glTF file
         */
        private reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
        /**
         * Reorders the vertex attributes in the correct triangle mode order .  This is necessary when indices are not available and the winding order is
         * clock-wise during export to glTF
         * @param submesh BabylonJS submesh
         * @param primitiveMode Primitive mode of the mesh
         * @param sideOrientation the winding order of the submesh
         * @param vertexBufferKind The type of vertex attribute
         * @param meshAttributeArray The vertex attribute data
         * @param byteOffset The offset to the binary data
         * @param binaryWriter The binary data for the glTF file
         */
        private reorderTriangleFillMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
        /**
         * Reorders the vertex attributes in the correct triangle strip order.  This is necessary when indices are not available and the winding order is
         * clock-wise during export to glTF
         * @param submesh BabylonJS submesh
         * @param primitiveMode Primitive mode of the mesh
         * @param sideOrientation the winding order of the submesh
         * @param vertexBufferKind The type of vertex attribute
         * @param meshAttributeArray The vertex attribute data
         * @param byteOffset The offset to the binary data
         * @param binaryWriter The binary data for the glTF file
         */
        private reorderTriangleStripDrawMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
        /**
         * Reorders the vertex attributes in the correct triangle fan order.  This is necessary when indices are not available and the winding order is
         * clock-wise during export to glTF
         * @param submesh BabylonJS submesh
         * @param primitiveMode Primitive mode of the mesh
         * @param sideOrientation the winding order of the submesh
         * @param vertexBufferKind The type of vertex attribute
         * @param meshAttributeArray The vertex attribute data
         * @param byteOffset The offset to the binary data
         * @param binaryWriter The binary data for the glTF file
         */
        private reorderTriangleFanMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
        /**
         * Writes the vertex attribute data to binary
         * @param vertices The vertices to write to the binary writer
         * @param byteOffset The offset into the binary writer to overwrite binary data
         * @param vertexAttributeKind The vertex attribute type
         * @param meshAttributeArray The vertex attribute data
         * @param binaryWriter The writer containing the binary data
         */
        private writeVertexAttributeData(vertices, byteOffset, vertexAttributeKind, meshAttributeArray, binaryWriter);
        /**
         * Writes mesh attribute data to a data buffer
         * Returns the bytelength of the data
         * @param vertexBufferKind Indicates what kind of vertex data is being passed in
         * @param meshAttributeArray Array containing the attribute data
         * @param binaryWriter The buffer to write the binary data to
         * @param indices Used to specify the order of the vertex data
         */
        private writeAttributeData(vertexBufferKind, meshAttributeArray, byteStride, binaryWriter);
        /**
         * Generates glTF json data
         * @param shouldUseGlb Indicates whether the json should be written for a glb file
         * @param glTFPrefix Text to use when prefixing a glTF file
         * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
         * @returns json data as string
         */
        private generateJSON(shouldUseGlb, glTFPrefix?, prettyPrint?);
        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix Text to use when prefixing a glTF file
         * @returns GLTFData with glTF file data
         */
        _generateGLTF(glTFPrefix: string): GLTFData;
        /**
         * Creates a binary buffer for glTF
         * @returns array buffer for binary data
         */
        private generateBinary();
        /**
         * Pads the number to a multiple of 4
         * @param num number to pad
         * @returns padded number
         */
        private _getPadding(num);
        /**
         * Generates a glb file from the json and binary data
         * Returns an object with the glb file name as the key and data as the value
         * @param glTFPrefix
         * @returns object with glb filename as key and data as value
         */
        _generateGLB(glTFPrefix: string): GLTFData;
        /**
         * Sets the TRS for each node
         * @param node glTF Node for storing the transformation data
         * @param babylonTransformNode Babylon mesh used as the source for the transformation data
         */
        private setNodeTransformation(node, babylonTransformNode);
        private getVertexBufferFromMesh(attributeKind, bufferMesh);
        /**
         * Creates a bufferview based on the vertices type for the Babylon mesh
         * @param kind Indicates the type of vertices data
         * @param babylonTransformNode The Babylon mesh to get the vertices data from
         * @param binaryWriter The buffer to write the bufferview data to
         */
        private createBufferViewKind(kind, babylonTransformNode, binaryWriter, byteStride);
        /**
         * The primitive mode of the Babylon mesh
         * @param babylonMesh The BabylonJS mesh
         */
        private getMeshPrimitiveMode(babylonMesh);
        /**
         * Sets the primitive mode of the glTF mesh primitive
         * @param meshPrimitive glTF mesh primitive
         * @param primitiveMode The primitive mode
         */
        private setPrimitiveMode(meshPrimitive, primitiveMode);
        /**
         * Sets the vertex attribute accessor based of the glTF mesh primitive
         * @param meshPrimitive glTF mesh primitive
         * @param attributeKind vertex attribute
         * @returns boolean specifying if uv coordinates are present
         */
        private setAttributeKind(meshPrimitive, attributeKind);
        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh glTF Mesh object to store the primitive attribute information
         * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
         * @param binaryWriter Buffer to write the attribute data to
         */
        private setPrimitiveAttributes(mesh, babylonTransformNode, binaryWriter);
        /**
         * Creates a glTF scene based on the array of meshes
         * Returns the the total byte offset
         * @param babylonScene Babylon scene to get the mesh data from
         * @param binaryWriter Buffer to write binary data to
         */
        private createScene(babylonScene, binaryWriter);
        /**
         * Creates a mapping of Node unique id to node index and handles animations
         * @param babylonScene Babylon Scene
         * @param binaryWriter Buffer to write binary data to
         * @returns Node mapping of unique id to index
         */
        private createNodeMapAndAnimations(babylonScene, nodes, shouldExportTransformNode, binaryWriter);
        /**
         * Creates a glTF node from a Babylon mesh
         * @param babylonMesh Source Babylon mesh
         * @param binaryWriter Buffer for storing geometry data
         * @returns glTF node
         */
        private createNode(babylonTransformNode, binaryWriter);
    }
    /**
     * @hidden
     *
     * Stores glTF binary data.  If the array buffer byte length is exceeded, it doubles in size dynamically
     */
    class _BinaryWriter {
        /**
         * Array buffer which stores all binary data
         */
        private _arrayBuffer;
        /**
         * View of the array buffer
         */
        private _dataView;
        /**
         * byte offset of data in array buffer
         */
        private _byteOffset;
        /**
         * Initialize binary writer with an initial byte length
         * @param byteLength Initial byte length of the array buffer
         */
        constructor(byteLength: number);
        /**
         * Resize the array buffer to the specified byte length
         * @param byteLength
         */
        private resizeBuffer(byteLength);
        /**
         * Get an array buffer with the length of the byte offset
         * @returns ArrayBuffer resized to the byte offset
         */
        getArrayBuffer(): ArrayBuffer;
        /**
         * Get the byte offset of the array buffer
         * @returns byte offset
         */
        getByteOffset(): number;
        /**
         * Stores an UInt8 in the array buffer
         * @param entry
         * @param byteOffset If defined, specifies where to set the value as an offset.
         */
        setUInt8(entry: number, byteOffset?: number): void;
        /**
         * Gets an UInt32 in the array buffer
         * @param entry
         * @param byteOffset If defined, specifies where to set the value as an offset.
         */
        getUInt32(byteOffset: number): number;
        getVector3Float32FromRef(vector3: Vector3, byteOffset: number): void;
        setVector3Float32FromRef(vector3: Vector3, byteOffset: number): void;
        getVector4Float32FromRef(vector4: Vector4, byteOffset: number): void;
        setVector4Float32FromRef(vector4: Vector4, byteOffset: number): void;
        /**
         * Stores a Float32 in the array buffer
         * @param entry
         */
        setFloat32(entry: number, byteOffset?: number): void;
        /**
         * Stores an UInt32 in the array buffer
         * @param entry
         * @param byteOffset If defined, specifies where to set the value as an offset.
         */
        setUInt32(entry: number, byteOffset?: number): void;
    }
}


declare module BABYLON {
    /**
     * Class for holding and downloading glTF file data
     */
    class GLTFData {
        /**
         * Object which contains the file name as the key and its data as the value
         */
        glTFFiles: {
            [fileName: string]: string | Blob;
        };
        /**
         * Initializes the glTF file object
         */
        constructor();
        /**
         * Downloads the glTF data as files based on their names and data
         */
        downloadFiles(): void;
    }
}


declare module BABYLON.GLTF2 {
    /**
     * Utility methods for working with glTF material conversion properties.  This class should only be used internally
     * @hidden
     */
    class _GLTFMaterial {
        /**
         * Represents the dielectric specular values for R, G and B
         */
        private static readonly _dielectricSpecular;
        /**
         * Allows the maximum specular power to be defined for material calculations
         */
        private static _maxSpecularPower;
        /**
         * Numeric tolerance value
         */
        private static _epsilon;
        /**
         * Specifies if two colors are approximately equal in value
         * @param color1 first color to compare to
         * @param color2 second color to compare to
         * @param epsilon threshold value
         */
        private static FuzzyEquals(color1, color2, epsilon);
        /**
         * Gets the materials from a Babylon scene and converts them to glTF materials
         * @param scene babylonjs scene
         * @param mimeType texture mime type
         * @param images array of images
         * @param textures array of textures
         * @param materials array of materials
         * @param imageData mapping of texture names to base64 textures
         * @param hasTextureCoords specifies if texture coordinates are present on the material
         */
        static _ConvertMaterialsToGLTF(babylonMaterials: Material[], mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        /**
         * Makes a copy of the glTF material without the texture parameters
         * @param originalMaterial original glTF material
         * @returns glTF material without texture parameters
         */
        static _StripTexturesFromMaterial(originalMaterial: IMaterial): IMaterial;
        /**
         * Specifies if the material has any texture parameters present
         * @param material glTF Material
         * @returns boolean specifying if texture parameters are present
         */
        static _HasTexturesPresent(material: IMaterial): boolean;
        /**
         * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material
         * @param babylonStandardMaterial
         * @returns glTF Metallic Roughness Material representation
         */
        static _ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness;
        /**
         * Computes the metallic factor
         * @param diffuse diffused value
         * @param specular specular value
         * @param oneMinusSpecularStrength one minus the specular strength
         * @returns metallic value
         */
        static _SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number;
        /**
         * Gets the glTF alpha mode from the Babylon Material
         * @param babylonMaterial Babylon Material
         * @returns The Babylon alpha mode value
         */
        static _GetAlphaMode(babylonMaterial: Material): Nullable<MaterialAlphaMode>;
        /**
         * Converts a Babylon Standard Material to a glTF Material
         * @param babylonStandardMaterial BJS Standard Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param materials array of glTF material interfaces
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         */
        static _ConvertStandardMaterial(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        /**
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
         * @param babylonPBRMetalRoughMaterial BJS PBR Metallic Roughness Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param materials array of glTF material interfaces
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         */
        static _ConvertPBRMetallicRoughnessMaterial(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        /**
         * Converts an image typed array buffer to a base64 image
         * @param buffer typed array buffer
         * @param width width of the image
         * @param height height of the image
         * @param mimeType mimetype of the image
         * @returns base64 image string
         */
        private static _CreateBase64FromCanvas(buffer, width, height, mimeType);
        /**
         * Generates a white texture based on the specified width and height
         * @param width width of the texture in pixels
         * @param height height of the texture in pixels
         * @param scene babylonjs scene
         * @returns white texture
         */
        private static _CreateWhiteTexture(width, height, scene);
        /**
         * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null
         * @param texture1 first texture to resize
         * @param texture2 second texture to resize
         * @param scene babylonjs scene
         * @returns resized textures or null
         */
        private static _ResizeTexturesToSameDimensions(texture1, texture2, scene);
        /**
         * Convert Specular Glossiness Textures to Metallic Roughness
         * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
         * @link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
         * @param diffuseTexture texture used to store diffuse information
         * @param specularGlossinessTexture texture used to store specular and glossiness information
         * @param factors specular glossiness material factors
         * @param mimeType the mime type to use for the texture
         * @returns pbr metallic roughness interface or null
         */
        private static _ConvertSpecularGlossinessTexturesToMetallicRoughness(diffuseTexture, specularGlossinessTexture, factors, mimeType);
        /**
         * Converts specular glossiness material properties to metallic roughness
         * @param specularGlossiness interface with specular glossiness material properties
         * @returns interface with metallic roughness material properties
         */
        private static _ConvertSpecularGlossinessToMetallicRoughness(specularGlossiness);
        /**
         * Calculates the surface reflectance, independent of lighting conditions
         * @param color Color source to calculate brightness from
         * @returns number representing the perceived brightness, or zero if color is undefined
         */
        private static _GetPerceivedBrightness(color);
        /**
         * Returns the maximum color component value
         * @param color
         * @returns maximum color component value, or zero if color is null or undefined
         */
        private static _GetMaxComponent(color);
        /**
         * Convert a PBRMaterial (Metallic/Roughness) to Metallic Roughness factors
         * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         * @returns glTF PBR Metallic Roughness factors
         */
        private static _ConvertMetalRoughFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, samplers, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
        private static _GetGLTFTextureSampler(texture);
        private static _GetGLTFTextureWrapMode(wrapMode);
        private static _GetGLTFTextureWrapModesSampler(texture);
        /**
         * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors
         * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         * @returns glTF PBR Metallic Roughness factors
         */
        private static _ConvertSpecGlossFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, samplers, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
        /**
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
         * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param materials array of glTF material interfaces
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         */
        static _ConvertPBRMaterial(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        }, hasTextureCoords: boolean): void;
        private static GetPixelsFromTexture(babylonTexture);
        /**
         * Extracts a texture from a Babylon texture into file data and glTF data
         * @param babylonTexture Babylon texture to extract
         * @param mimeType Mime Type of the babylonTexture
         * @param images Array of glTF images
         * @param textures Array of glTF textures
         * @param imageData map of image file name and data
         * @return glTF texture info, or null if the texture format is not supported
         */
        private static _ExportTexture(babylonTexture, mimeType, images, textures, samplers, imageData);
        /**
         * Builds a texture from base64 string
         * @param base64Texture base64 texture string
         * @param textureName Name to use for the texture
         * @param mimeType image mime type for the texture
         * @param images array of images
         * @param textures array of textures
         * @param imageData map of image data
         * @returns glTF texture info, or null if the texture format is not supported
         */
        private static _GetTextureInfoFromBase64(base64Texture, textureName, mimeType, images, textures, texCoordIndex, samplerIndex, imageData);
    }
}


declare module BABYLON.GLTF2 {
    /**
     * @hidden
     * Interface to store animation data.
     */
    interface _IAnimationData {
        /**
         * Keyframe data.
         */
        inputs: number[];
        /**
         * Value data.
         */
        outputs: number[][];
        /**
         * Animation interpolation data.
         */
        samplerInterpolation: AnimationSamplerInterpolation;
        /**
         * Minimum keyframe value.
         */
        inputsMin: number;
        /**
         * Maximum keyframe value.
         */
        inputsMax: number;
    }
    /**
     * @hidden
     */
    interface _IAnimationInfo {
        /**
         * The target channel for the animation
         */
        animationChannelTargetPath: AnimationChannelTargetPath;
        /**
         * The glTF accessor type for the data.
         */
        dataAccessorType: AccessorType.VEC3 | AccessorType.VEC4;
        /**
         * Specifies if quaternions should be used.
         */
        useQuaternion: boolean;
    }
    /**
     * @hidden
     * Utility class for generating glTF animation data from BabylonJS.
     */
    class _GLTFAnimation {
        /**
         * @ignore
         *
         * Creates glTF channel animation from BabylonJS animation.
         * @param babylonTransformNode - BabylonJS mesh.
         * @param animation - animation.
         * @param animationChannelTargetPath - The target animation channel.
         * @param convertToRightHandedSystem - Specifies if the values should be converted to right-handed.
         * @param useQuaternion - Specifies if quaternions are used.
         * @returns nullable IAnimationData
         */
        static _CreateNodeAnimation(babylonTransformNode: TransformNode, animation: Animation, animationChannelTargetPath: AnimationChannelTargetPath, convertToRightHandedSystem: boolean, useQuaternion: boolean, animationSampleRate: number): Nullable<_IAnimationData>;
        private static _DeduceAnimationInfo(animation);
        /**
         * @ignore
         * Create node animations from the transform node animations
         * @param babylonTransformNode
         * @param runtimeGLTFAnimation
         * @param idleGLTFAnimations
         * @param nodeMap
         * @param nodes
         * @param binaryWriter
         * @param bufferViews
         * @param accessors
         * @param convertToRightHandedSystem
         */
        static _CreateNodeAnimationFromTransformNodeAnimations(babylonTransformNode: TransformNode, runtimeGLTFAnimation: IAnimation, idleGLTFAnimations: IAnimation[], nodeMap: {
            [key: number]: number;
        }, nodes: INode[], binaryWriter: _BinaryWriter, bufferViews: IBufferView[], accessors: IAccessor[], convertToRightHandedSystem: boolean, animationSampleRate: number): void;
        /**
         * @ignore
         * Create node animations from the animation groups
         * @param babylonScene
         * @param glTFAnimations
         * @param nodeMap
         * @param nodes
         * @param binaryWriter
         * @param bufferViews
         * @param accessors
         * @param convertToRightHandedSystem
         */
        static _CreateNodeAnimationFromAnimationGroups(babylonScene: Scene, glTFAnimations: IAnimation[], nodeMap: {
            [key: number]: number;
        }, nodes: INode[], binaryWriter: _BinaryWriter, bufferViews: IBufferView[], accessors: IAccessor[], convertToRightHandedSystem: boolean, animationSampleRate: number): void;
        private static AddAnimation(name, glTFAnimation, babylonTransformNode, animation, dataAccessorType, animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, useQuaternion, animationSampleRate);
        /**
         * Create a baked animation
         * @param babylonTransformNode BabylonJS mesh
         * @param animation BabylonJS animation corresponding to the BabylonJS mesh
         * @param animationChannelTargetPath animation target channel
         * @param minFrame minimum animation frame
         * @param maxFrame maximum animation frame
         * @param fps frames per second of the animation
         * @param inputs input key frames of the animation
         * @param outputs output key frame data of the animation
         * @param convertToRightHandedSystem converts the values to right-handed
         * @param useQuaternion specifies if quaternions should be used
         */
        private static _CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minFrame, maxFrame, fps, sampleRate, inputs, outputs, minMaxFrames, convertToRightHandedSystem, useQuaternion);
        private static _ConvertFactorToVector3OrQuaternion(factor, babylonTransformNode, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
        private static _SetInterpolatedValue(babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion);
        /**
         * Creates linear animation from the animation key frames
         * @param babylonTransformNode BabylonJS mesh
         * @param animation BabylonJS animation
         * @param animationChannelTargetPath The target animation channel
         * @param frameDelta The difference between the last and first frame of the animation
         * @param inputs Array to store the key frame times
         * @param outputs Array to store the key frame data
         * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
         * @param useQuaternion Specifies if quaternions are used in the animation
         */
        private static _CreateLinearOrStepAnimation(babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
        /**
         * Creates cubic spline animation from the animation key frames
         * @param babylonTransformNode BabylonJS mesh
         * @param animation BabylonJS animation
         * @param animationChannelTargetPath The target animation channel
         * @param frameDelta The difference between the last and first frame of the animation
         * @param inputs Array to store the key frame times
         * @param outputs Array to store the key frame data
         * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
         * @param useQuaternion Specifies if quaternions are used in the animation
         */
        private static _CreateCubicSplineAnimation(babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
        private static _GetBasePositionRotationOrScale(babylonTransformNode, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
        /**
         * Adds a key frame value
         * @param keyFrame
         * @param animation
         * @param outputs
         * @param animationChannelTargetPath
         * @param basePositionRotationOrScale
         * @param convertToRightHandedSystem
         * @param useQuaternion
         */
        private static _AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, convertToRightHandedSystem, useQuaternion);
        /**
         * Determine the interpolation based on the key frames
         * @param keyFrames
         * @param animationChannelTargetPath
         * @param useQuaternion
         */
        private static _DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion);
        /**
         * Adds an input tangent or output tangent to the output data
         * If an input tangent or output tangent is missing, it uses the zero vector or zero quaternion
         * @param tangentType Specifies which type of tangent to handle (inTangent or outTangent)
         * @param outputs The animation data by keyframe
         * @param animationChannelTargetPath The target animation channel
         * @param interpolation The interpolation type
         * @param keyFrame The key frame with the animation data
         * @param frameDelta Time difference between two frames used to scale the tangent by the frame delta
         * @param useQuaternion Specifies if quaternions are used
         * @param convertToRightHandedSystem Specifies if the values should be converted to right-handed
         */
        private static AddSplineTangent(babylonTransformNode, tangentType, outputs, animationChannelTargetPath, interpolation, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem);
        /**
         * Get the minimum and maximum key frames' frame values
         * @param keyFrames animation key frames
         * @returns the minimum and maximum key frame value
         */
        private static calculateMinMaxKeyFrames(keyFrames);
    }
}


declare module BABYLON.GLTF2 {
    /**
     * @hidden
     */
    class _GLTFUtilities {
        /**
         * Creates a buffer view based on the supplied arguments
         * @param bufferIndex index value of the specified buffer
         * @param byteOffset byte offset value
         * @param byteLength byte length of the bufferView
         * @param byteStride byte distance between conequential elements
         * @param name name of the buffer view
         * @returns bufferView for glTF
         */
        static CreateBufferView(bufferIndex: number, byteOffset: number, byteLength: number, byteStride?: number, name?: string): IBufferView;
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
        static CreateAccessor(bufferviewIndex: number, name: string, type: AccessorType, componentType: AccessorComponentType, count: number, byteOffset: Nullable<number>, min: Nullable<number[]>, max: Nullable<number[]>): IAccessor;
        /**
         * Calculates the minimum and maximum values of an array of position floats
         * @param positions Positions array of a mesh
         * @param vertexStart Starting vertex offset to calculate min and max values
         * @param vertexCount Number of vertices to check for min and max values
         * @returns min number array and max number array
         */
        static CalculateMinMaxPositions(positions: FloatArray, vertexStart: number, vertexCount: number, convertToRightHandedSystem: boolean): {
            min: number[];
            max: number[];
        };
        /**
         * Converts a new right-handed Vector3
         * @param vector vector3 array
         * @returns right-handed Vector3
         */
        static GetRightHandedPositionVector3(vector: Vector3): Vector3;
        /**
         * Converts a Vector3 to right-handed
         * @param vector Vector3 to convert to right-handed
         */
        static GetRightHandedPositionVector3FromRef(vector: Vector3): void;
        /**
         * Converts a three element number array to right-handed
         * @param vector number array to convert to right-handed
         */
        static GetRightHandedPositionArray3FromRef(vector: number[]): void;
        /**
         * Converts a new right-handed Vector3
         * @param vector vector3 array
         * @returns right-handed Vector3
         */
        static GetRightHandedNormalVector3(vector: Vector3): Vector3;
        /**
         * Converts a Vector3 to right-handed
         * @param vector Vector3 to convert to right-handed
         */
        static GetRightHandedNormalVector3FromRef(vector: Vector3): void;
        /**
         * Converts a three element number array to right-handed
         * @param vector number array to convert to right-handed
         */
        static GetRightHandedNormalArray3FromRef(vector: number[]): void;
        /**
         * Converts a Vector4 to right-handed
         * @param vector Vector4 to convert to right-handed
         */
        static GetRightHandedVector4FromRef(vector: Vector4): void;
        /**
         * Converts a Vector4 to right-handed
         * @param vector Vector4 to convert to right-handed
         */
        static GetRightHandedArray4FromRef(vector: number[]): void;
        /**
         * Converts a Quaternion to right-handed
         * @param quaternion Source quaternion to convert to right-handed
         */
        static GetRightHandedQuaternionFromRef(quaternion: Quaternion): void;
        /**
         * Converts a Quaternion to right-handed
         * @param quaternion Source quaternion to convert to right-handed
         */
        static GetRightHandedQuaternionArrayFromRef(quaternion: number[]): void;
    }
}
