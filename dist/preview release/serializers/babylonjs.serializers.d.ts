declare module BABYLON {
    /**
     * Class for generating OBJ data from a Babylon scene.
     */
    export class OBJExport {
        /**
         * Exports the geometry of a Mesh array in .OBJ file format (text)
         * @param mesh defines the list of meshes to serialize
         * @param materials defines if materials should be exported
         * @param matlibname defines the name of the associated mtl file
         * @param globalposition defines if the exported positions are globals or local to the exported mesh
         * @returns the OBJ content
         */
        static OBJ(mesh: Mesh[], materials?: boolean, matlibname?: string, globalposition?: boolean): string;
        /**
         * Exports the material(s) of a mesh in .MTL file format (text)
         * @param mesh defines the mesh to extract the material from
         * @returns the mtl content
         */
        static MTL(mesh: Mesh): string;
    }
}
declare module BABYLON {
    /** @hidden */
    export var __IGLTFExporterExtension: number;
    /**
     * Interface for extending the exporter
     * @hidden
     */
    export interface IGLTFExporterExtension {
        /**
         * The name of this extension
         */
        readonly name: string;
        /**
         * Defines whether this extension is enabled
         */
        enabled: boolean;
        /**
         * Defines whether this extension is required
         */
        required: boolean;
    }
}
declare module BABYLON.GLTF2.Exporter {
    /** @hidden */
    export var __IGLTFExporterExtensionV2: number;
    /**
     * Interface for a glTF exporter extension
     * @hidden
     */
    export interface IGLTFExporterExtensionV2 extends IGLTFExporterExtension, IDisposable {
        /**
         * Define this method to modify the default behavior before exporting a texture
         * @param context The context when loading the asset
         * @param babylonTexture The Babylon.js texture
         * @param mimeType The mime-type of the generated image
         * @returns A promise that resolves with the exported texture
         */
        preExportTextureAsync?(context: string, babylonTexture: Nullable<Texture>, mimeType: ImageMimeType): Promise<Texture>;
        /**
         * Define this method to get notified when a texture info is created
         * @param context The context when loading the asset
         * @param textureInfo The glTF texture info
         * @param babylonTexture The Babylon.js texture
         */
        postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: BaseTexture): void;
        /**
         * Define this method to modify the default behavior when exporting texture info
         * @param context The context when loading the asset
         * @param meshPrimitive glTF mesh primitive
         * @param babylonSubMesh Babylon submesh
         * @param binaryWriter glTF serializer binary writer instance
         * @returns nullable IMeshPrimitive promise
         */
        postExportMeshPrimitiveAsync?(context: string, meshPrimitive: Nullable<IMeshPrimitive>, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Promise<IMeshPrimitive>;
        /**
         * Define this method to modify the default behavior when exporting a node
         * @param context The context when exporting the node
         * @param node glTF node
         * @param babylonNode BabylonJS node
         * @returns nullable INode promise
         */
        postExportNodeAsync?(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap?: {
            [key: number]: number;
        }): Promise<Nullable<INode>>;
        /**
         * Define this method to modify the default behavior when exporting a material
         * @param material glTF material
         * @param babylonMaterial BabylonJS material
         * @returns nullable IMaterial promise
         */
        postExportMaterialAsync?(context: string, node: Nullable<IMaterial>, babylonMaterial: Material): Promise<IMaterial>;
        /**
         * Define this method to return additional textures to export from a material
         * @param material glTF material
         * @param babylonMaterial BabylonJS material
         * @returns List of textures
         */
        postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[];
        /** Gets a boolean indicating that this extension was used */
        wasUsed: boolean;
        /** Gets a boolean indicating that this extension is required for the file to work */
        required: boolean;
        /**
         * Called after the exporter state changes to EXPORTING
         */
        onExporting?(): void;
    }
}
declare module BABYLON.GLTF2.Exporter {
    /**
     * Utility methods for working with glTF material conversion properties.  This class should only be used internally
     * @hidden
     */
    export class _GLTFMaterialExporter {
        /**
         * Represents the dielectric specular values for R, G and B
         */
        private static readonly _DielectricSpecular;
        /**
         * Allows the maximum specular power to be defined for material calculations
         */
        private static readonly _MaxSpecularPower;
        /**
         * Mapping to store textures
         */
        private _textureMap;
        /**
         * Numeric tolerance value
         */
        private static readonly _Epsilon;
        /**
         * Reference to the glTF Exporter
         */
        private _exporter;
        constructor(exporter: _Exporter);
        /**
         * Specifies if two colors are approximately equal in value
         * @param color1 first color to compare to
         * @param color2 second color to compare to
         * @param epsilon threshold value
         */
        private static FuzzyEquals;
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
        _convertMaterialsToGLTFAsync(babylonMaterials: Material[], mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<void>;
        /**
         * Makes a copy of the glTF material without the texture parameters
         * @param originalMaterial original glTF material
         * @returns glTF material without texture parameters
         */
        _stripTexturesFromMaterial(originalMaterial: IMaterial): IMaterial;
        /**
         * Specifies if the material has any texture parameters present
         * @param material glTF Material
         * @returns boolean specifying if texture parameters are present
         */
        _hasTexturesPresent(material: IMaterial): boolean;
        /**
         * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material
         * @param babylonStandardMaterial
         * @returns glTF Metallic Roughness Material representation
         */
        _convertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness;
        /**
         * Computes the metallic factor
         * @param diffuse diffused value
         * @param specular specular value
         * @param oneMinusSpecularStrength one minus the specular strength
         * @returns metallic value
         */
        static _SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number;
        /**
         * Sets the glTF alpha mode to a glTF material from the Babylon Material
         * @param glTFMaterial glTF material
         * @param babylonMaterial Babylon material
         */
        private static _SetAlphaMode;
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
        _convertStandardMaterialAsync(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<IMaterial>;
        private _finishMaterial;
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
        _convertPBRMetallicRoughnessMaterialAsync(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<IMaterial>;
        /**
         * Converts an image typed array buffer to a base64 image
         * @param buffer typed array buffer
         * @param width width of the image
         * @param height height of the image
         * @param mimeType mimetype of the image
         * @returns base64 image string
         */
        private _createBase64FromCanvasAsync;
        /**
         * Generates a white texture based on the specified width and height
         * @param width width of the texture in pixels
         * @param height height of the texture in pixels
         * @param scene babylonjs scene
         * @returns white texture
         */
        private _createWhiteTexture;
        /**
         * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null
         * @param texture1 first texture to resize
         * @param texture2 second texture to resize
         * @param scene babylonjs scene
         * @returns resized textures or null
         */
        private _resizeTexturesToSameDimensions;
        /**
         * Converts an array of pixels to a Float32Array
         * Throws an error if the pixel format is not supported
         * @param pixels - array buffer containing pixel values
         * @returns Float32 of pixels
         */
        private _convertPixelArrayToFloat32;
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
        private _convertSpecularGlossinessTexturesToMetallicRoughnessAsync;
        /**
         * Converts specular glossiness material properties to metallic roughness
         * @param specularGlossiness interface with specular glossiness material properties
         * @returns interface with metallic roughness material properties
         */
        private _convertSpecularGlossinessToMetallicRoughness;
        /**
         * Calculates the surface reflectance, independent of lighting conditions
         * @param color Color source to calculate brightness from
         * @returns number representing the perceived brightness, or zero if color is undefined
         */
        private _getPerceivedBrightness;
        /**
         * Returns the maximum color component value
         * @param color
         * @returns maximum color component value, or zero if color is null or undefined
         */
        private _getMaxComponent;
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
        private _convertMetalRoughFactorsToMetallicRoughnessAsync;
        private _getGLTFTextureSampler;
        private _getGLTFTextureWrapMode;
        private _getGLTFTextureWrapModesSampler;
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
        private _convertSpecGlossFactorsToMetallicRoughnessAsync;
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
        _convertPBRMaterialAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<IMaterial>;
        private setMetallicRoughnessPbrMaterial;
        private getPixelsFromTexture;
        /**
         * Extracts a texture from a Babylon texture into file data and glTF data
         * @param babylonTexture Babylon texture to extract
         * @param mimeType Mime Type of the babylonTexture
         * @return glTF texture info, or null if the texture format is not supported
         */
        _exportTextureAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>>;
        _exportTextureInfoAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>>;
        /**
         * Builds a texture from base64 string
         * @param base64Texture base64 texture string
         * @param baseTextureName Name to use for the texture
         * @param mimeType image mime type for the texture
         * @param images array of images
         * @param textures array of textures
         * @param imageData map of image data
         * @returns glTF texture info, or null if the texture format is not supported
         */
        private _getTextureInfoFromBase64;
    }
}
declare module BABYLON {
    /**
     * Class for holding and downloading glTF file data
     */
    export class GLTFData {
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
declare module BABYLON {
    /**
     * Holds a collection of exporter options and parameters
     */
    export interface IExportOptions {
        /**
         * Function which indicates whether a babylon node should be exported or not
         * @param node source Babylon node. It is used to check whether it should be exported to glTF or not
         * @returns boolean, which indicates whether the node should be exported (true) or not (false)
         */
        shouldExportNode?(node: Node): boolean;
        /**
         * Function used to extract the part of node's metadata that will be exported into glTF node extras
         * @param metadata source metadata to read from
         * @returns the data to store to glTF node extras
         */
        metadataSelector?(metadata: any): any;
        /**
         * The sample rate to bake animation curves
         */
        animationSampleRate?: number;
        /**
         * Begin serialization without waiting for the scene to be ready
         */
        exportWithoutWaitingForScene?: boolean;
        /**
         * Indicates if coordinate system swapping root nodes should be included in export
         */
        includeCoordinateSystemConversionNodes?: boolean;
    }
    /**
     * Class for generating glTF data from a Babylon scene.
     */
    export class GLTF2Export {
        /**
         * Exports the geometry of the scene to .gltf file format asynchronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating the glTF file
         * @param options Exporter options
         * @returns Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values
         */
        static GLTFAsync(scene: Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData>;
        private static _PreExportAsync;
        private static _PostExportAsync;
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
declare module BABYLON.GLTF2.Exporter {
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
        static _CreateBufferView(bufferIndex: number, byteOffset: number, byteLength: number, byteStride?: number, name?: string): IBufferView;
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
        static _CreateAccessor(bufferviewIndex: number, name: string, type: AccessorType, componentType: AccessorComponentType, count: number, byteOffset: Nullable<number>, min: Nullable<number[]>, max: Nullable<number[]>): IAccessor;
        /**
         * Calculates the minimum and maximum values of an array of position floats
         * @param positions Positions array of a mesh
         * @param vertexStart Starting vertex offset to calculate min and max values
         * @param vertexCount Number of vertices to check for min and max values
         * @returns min number array and max number array
         */
        static _CalculateMinMaxPositions(positions: FloatArray, vertexStart: number, vertexCount: number, convertToRightHandedSystem: boolean): {
            min: number[];
            max: number[];
        };
        /**
         * Converts a new right-handed Vector3
         * @param vector vector3 array
         * @returns right-handed Vector3
         */
        static _GetRightHandedPositionVector3(vector: Vector3): Vector3;
        /**
         * Converts a Vector3 to right-handed
         * @param vector Vector3 to convert to right-handed
         */
        static _GetRightHandedPositionVector3FromRef(vector: Vector3): void;
        /**
         * Converts a three element number array to right-handed
         * @param vector number array to convert to right-handed
         */
        static _GetRightHandedPositionArray3FromRef(vector: number[]): void;
        /**
         * Converts a new right-handed Vector3
         * @param vector vector3 array
         * @returns right-handed Vector3
         */
        static _GetRightHandedNormalVector3(vector: Vector3): Vector3;
        /**
         * Converts a Vector3 to right-handed
         * @param vector Vector3 to convert to right-handed
         */
        static _GetRightHandedNormalVector3FromRef(vector: Vector3): void;
        /**
         * Converts a three element number array to right-handed
         * @param vector number array to convert to right-handed
         */
        static _GetRightHandedNormalArray3FromRef(vector: number[]): void;
        /**
         * Converts a Vector4 to right-handed
         * @param vector Vector4 to convert to right-handed
         */
        static _GetRightHandedVector4FromRef(vector: Vector4): void;
        /**
         * Converts a Vector4 to right-handed
         * @param vector Vector4 to convert to right-handed
         */
        static _GetRightHandedArray4FromRef(vector: number[]): void;
        /**
         * Converts a Quaternion to right-handed
         * @param quaternion Source quaternion to convert to right-handed
         */
        static _GetRightHandedQuaternionFromRef(quaternion: Quaternion): void;
        /**
         * Converts a Quaternion to right-handed
         * @param quaternion Source quaternion to convert to right-handed
         */
        static _GetRightHandedQuaternionArrayFromRef(quaternion: number[]): void;
        static _NormalizeTangentFromRef(tangent: Vector4): void;
    }
}
declare module BABYLON.GLTF2.Exporter {
    /**
     * Converts Babylon Scene into glTF 2.0.
     * @hidden
     */
    export class _Exporter {
        /**
         * Stores the glTF to export
         */
        _glTF: IGLTF;
        /**
         * Stores all generated buffer views, which represents views into the main glTF buffer data
         */
        _bufferViews: IBufferView[];
        /**
         * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF
         */
        _accessors: IAccessor[];
        /**
         * Stores all the generated nodes, which contains transform and/or mesh information per node
         */
        _nodes: INode[];
        /**
         * Stores all the generated glTF scenes, which stores multiple node hierarchies
         */
        private _scenes;
        /**
         * Stores all the generated mesh information, each containing a set of primitives to render in glTF
         */
        private _meshes;
        /**
         * Stores all the generated material information, which represents the appearance of each primitive
         */
        _materials: IMaterial[];
        _materialMap: {
            [materialID: number]: number;
        };
        /**
         * Stores all the generated texture information, which is referenced by glTF materials
         */
        _textures: ITexture[];
        /**
         * Stores all the generated image information, which is referenced by glTF textures
         */
        _images: IImage[];
        /**
         * Stores all the texture samplers
         */
        _samplers: ISampler[];
        /**
         * Stores all the generated animation samplers, which is referenced by glTF animations
         */
        /**
         * Stores the animations for glTF models
         */
        private _animations;
        /**
         * Stores the total amount of bytes stored in the glTF buffer
         */
        private _totalByteLength;
        /**
         * Stores a reference to the Babylon scene containing the source geometry and material information
         */
        _babylonScene: Scene;
        /**
         * Stores a map of the image data, where the key is the file name and the value
         * is the image data
         */
        _imageData: {
            [fileName: string]: {
                data: Uint8Array;
                mimeType: ImageMimeType;
            };
        };
        /**
         * Stores a map of the unique id of a node to its index in the node array
         */
        _nodeMap: {
            [key: number]: number;
        };
        /**
         * Specifies if the source Babylon scene was left handed, and needed conversion.
         */
        _convertToRightHandedSystem: boolean;
        /**
         * Specifies if a Babylon node should be converted to right-handed on export
         */
        _convertToRightHandedSystemMap: {
            [nodeId: number]: boolean;
        };
        _includeCoordinateSystemConversionNodes: boolean;
        /**
         * Baked animation sample rate
         */
        private _animationSampleRate;
        private _options;
        private _localEngine;
        _glTFMaterialExporter: _GLTFMaterialExporter;
        private _extensions;
        private static _ExtensionNames;
        private static _ExtensionFactories;
        private _applyExtension;
        private _applyExtensions;
        _extensionsPreExportTextureAsync(context: string, babylonTexture: Nullable<Texture>, mimeType: ImageMimeType): Promise<Nullable<BaseTexture>>;
        _extensionsPostExportMeshPrimitiveAsync(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Promise<Nullable<IMeshPrimitive>>;
        _extensionsPostExportNodeAsync(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap?: {
            [key: number]: number;
        }): Promise<Nullable<INode>>;
        _extensionsPostExportMaterialAsync(context: string, material: Nullable<IMaterial>, babylonMaterial: Material): Promise<Nullable<IMaterial>>;
        _extensionsPostExportMaterialAdditionalTextures(context: string, material: IMaterial, babylonMaterial: Material): BaseTexture[];
        _extensionsPostExportTextures(context: string, textureInfo: ITextureInfo, babylonTexture: BaseTexture): void;
        private _forEachExtensions;
        private _extensionsOnExporting;
        /**
         * Load glTF serializer extensions
         */
        private _loadExtensions;
        /**
         * Creates a glTF Exporter instance, which can accept optional exporter options
         * @param babylonScene Babylon scene object
         * @param options Options to modify the behavior of the exporter
         */
        constructor(babylonScene: Scene, options?: IExportOptions);
        dispose(): void;
        /**
         * Registers a glTF exporter extension
         * @param name Name of the extension to export
         * @param factory The factory function that creates the exporter extension
         */
        static RegisterExtension(name: string, factory: (exporter: _Exporter) => IGLTFExporterExtensionV2): void;
        /**
         * Un-registers an exporter extension
         * @param name The name fo the exporter extension
         * @returns A boolean indicating whether the extension has been un-registered
         */
        static UnregisterExtension(name: string): boolean;
        /**
         * Lazy load a local engine
         */
        _getLocalEngine(): Engine;
        private reorderIndicesBasedOnPrimitiveMode;
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
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private reorderVertexAttributeDataBasedOnPrimitiveMode;
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
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private reorderTriangleFillMode;
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
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private reorderTriangleStripDrawMode;
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
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private reorderTriangleFanMode;
        /**
         * Writes the vertex attribute data to binary
         * @param vertices The vertices to write to the binary writer
         * @param byteOffset The offset into the binary writer to overwrite binary data
         * @param vertexAttributeKind The vertex attribute type
         * @param meshAttributeArray The vertex attribute data
         * @param binaryWriter The writer containing the binary data
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private writeVertexAttributeData;
        /**
         * Writes mesh attribute data to a data buffer
         * Returns the bytelength of the data
         * @param vertexBufferKind Indicates what kind of vertex data is being passed in
         * @param meshAttributeArray Array containing the attribute data
         * @param binaryWriter The buffer to write the binary data to
         * @param indices Used to specify the order of the vertex data
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        writeAttributeData(vertexBufferKind: string, meshAttributeArray: FloatArray, byteStride: number, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean): void;
        /**
         * Generates glTF json data
         * @param shouldUseGlb Indicates whether the json should be written for a glb file
         * @param glTFPrefix Text to use when prefixing a glTF file
         * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
         * @returns json data as string
         */
        private generateJSON;
        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix Text to use when prefixing a glTF file
         * @param dispose Dispose the exporter
         * @returns GLTFData with glTF file data
         */
        _generateGLTFAsync(glTFPrefix: string, dispose?: boolean): Promise<GLTFData>;
        /**
         * Creates a binary buffer for glTF
         * @returns array buffer for binary data
         */
        private _generateBinaryAsync;
        /**
         * Pads the number to a multiple of 4
         * @param num number to pad
         * @returns padded number
         */
        private _getPadding;
        /**
         * @hidden
         */
        _generateGLBAsync(glTFPrefix: string, dispose?: boolean): Promise<GLTFData>;
        /**
         * Sets the TRS for each node
         * @param node glTF Node for storing the transformation data
         * @param babylonTransformNode Babylon mesh used as the source for the transformation data
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private setNodeTransformation;
        private getVertexBufferFromMesh;
        /**
         * Creates a bufferview based on the vertices type for the Babylon mesh
         * @param kind Indicates the type of vertices data
         * @param babylonTransformNode The Babylon mesh to get the vertices data from
         * @param binaryWriter The buffer to write the bufferview data to
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private createBufferViewKind;
        /**
         * The primitive mode of the Babylon mesh
         * @param babylonMesh The BabylonJS mesh
         */
        private getMeshPrimitiveMode;
        /**
         * Sets the primitive mode of the glTF mesh primitive
         * @param meshPrimitive glTF mesh primitive
         * @param primitiveMode The primitive mode
         */
        private setPrimitiveMode;
        /**
         * Sets the vertex attribute accessor based of the glTF mesh primitive
         * @param meshPrimitive glTF mesh primitive
         * @param attributeKind vertex attribute
         * @returns boolean specifying if uv coordinates are present
         */
        private setAttributeKind;
        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh glTF Mesh object to store the primitive attribute information
         * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
         * @param binaryWriter Buffer to write the attribute data to
         * @param convertToRightHandedSystem Converts the values to right-handed
         */
        private setPrimitiveAttributesAsync;
        /**
         * Check if the node is used to convert its descendants from a right handed coordinate system to the Babylon scene's coordinate system.
         * @param node The node to check
         * @returns True if the node is used to convert its descendants from right-handed to left-handed. False otherwise
         */
        private isBabylonCoordinateSystemConvertingNode;
        /**
         * Creates a glTF scene based on the array of meshes
         * Returns the the total byte offset
         * @param babylonScene Babylon scene to get the mesh data from
         * @param binaryWriter Buffer to write binary data to
         */
        private createSceneAsync;
        /**
         * Creates a mapping of Node unique id to node index and handles animations
         * @param babylonScene Babylon Scene
         * @param nodes Babylon transform nodes
         * @param binaryWriter Buffer to write binary data to
         * @returns Node mapping of unique id to index
         */
        private createNodeMapAndAnimationsAsync;
        /**
         * Creates a glTF node from a Babylon mesh
         * @param babylonMesh Source Babylon mesh
         * @param binaryWriter Buffer for storing geometry data
         * @param convertToRightHandedSystem Converts the values to right-handed
         * @param nodeMap Node mapping of unique id to glTF node index
         * @returns glTF node
         */
        private createNodeAsync;
    }
    /**
     * @hidden
     *
     * Stores glTF binary data.  If the array buffer byte length is exceeded, it doubles in size dynamically
     */
    export class _BinaryWriter {
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
        private resizeBuffer;
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
declare module BABYLON.GLTF2.Exporter {
    /**
     * @hidden
     * Interface to store animation data.
     */
    export interface _IAnimationData {
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
    export interface _IAnimationInfo {
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
    export class _GLTFAnimation {
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
        private static _DeduceAnimationInfo;
        /**
         * @ignore
         * Create node animations from the transform node animations
         * @param babylonNode
         * @param runtimeGLTFAnimation
         * @param idleGLTFAnimations
         * @param nodeMap
         * @param nodes
         * @param binaryWriter
         * @param bufferViews
         * @param accessors
         * @param convertToRightHandedSystem
         * @param animationSampleRate
         */
        static _CreateNodeAnimationFromNodeAnimations(babylonNode: Node, runtimeGLTFAnimation: IAnimation, idleGLTFAnimations: IAnimation[], nodeMap: {
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
         * @param convertToRightHandedSystemMap
         * @param animationSampleRate
         */
        static _CreateNodeAnimationFromAnimationGroups(babylonScene: Scene, glTFAnimations: IAnimation[], nodeMap: {
            [key: number]: number;
        }, nodes: INode[], binaryWriter: _BinaryWriter, bufferViews: IBufferView[], accessors: IAccessor[], convertToRightHandedSystemMap: {
            [nodeId: number]: boolean;
        }, animationSampleRate: number): void;
        private static AddAnimation;
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
        private static _CreateBakedAnimation;
        private static _ConvertFactorToVector3OrQuaternion;
        private static _SetInterpolatedValue;
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
        private static _CreateLinearOrStepAnimation;
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
        private static _CreateCubicSplineAnimation;
        private static _GetBasePositionRotationOrScale;
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
        private static _AddKeyframeValue;
        /**
         * Determine the interpolation based on the key frames
         * @param keyFrames
         * @param animationChannelTargetPath
         * @param useQuaternion
         */
        private static _DeduceInterpolation;
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
        private static AddSplineTangent;
        /**
         * Get the minimum and maximum key frames' frame values
         * @param keyFrames animation key frames
         * @returns the minimum and maximum key frame value
         */
        private static calculateMinMaxKeyFrames;
    }
}
declare module BABYLON.GLTF2.Exporter {
    /** @hidden */
    export var textureTransformPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON.GLTF2.Exporter.Extensions {
    /**
     * @hidden
     */
    export class KHR_texture_transform implements IGLTFExporterExtensionV2 {
        private _recordedTextures;
        /** Name of this extension */
        readonly name: string;
        /** Defines whether this extension is enabled */
        enabled: boolean;
        /** Defines whether this extension is required */
        required: boolean;
        /** Reference to the glTF exporter */
        private _wasUsed;
        constructor(exporter: _Exporter);
        dispose(): void;
        /** @hidden */
        get wasUsed(): boolean;
        postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: Texture): void;
        preExportTextureAsync(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Promise<Texture>;
        /**
         * Transform the babylon texture by the offset, rotation and scale parameters using a procedural texture
         * @param babylonTexture
         * @param offset
         * @param rotation
         * @param scale
         * @param scene
         */
        private _textureTransformTextureAsync;
    }
}
declare module BABYLON.GLTF2.Exporter.Extensions {
    /**
     * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md)
     */
    export class KHR_lights_punctual implements IGLTFExporterExtensionV2 {
        /** The name of this extension. */
        readonly name: string;
        /** Defines whether this extension is enabled. */
        enabled: boolean;
        /** Defines whether this extension is required */
        required: boolean;
        /** Reference to the glTF exporter */
        private _exporter;
        private _lights;
        /** @hidden */
        constructor(exporter: _Exporter);
        /** @hidden */
        dispose(): void;
        /** @hidden */
        get wasUsed(): boolean;
        /** @hidden */
        onExporting(): void;
        /**
         * Define this method to modify the default behavior when exporting a node
         * @param context The context when exporting the node
         * @param node glTF node
         * @param babylonNode BabylonJS node
         * @param nodeMap Node mapping of unique id to glTF node index
         * @returns nullable INode promise
         */
        postExportNodeAsync(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap?: {
            [key: number]: number;
        }): Promise<Nullable<INode>>;
    }
}
declare module BABYLON.GLTF2.Exporter.Extensions {
    /**
     * @hidden
     */
    export class KHR_materials_sheen implements IGLTFExporterExtensionV2 {
        /** Name of this extension */
        readonly name: string;
        /** Defines whether this extension is enabled */
        enabled: boolean;
        /** Defines whether this extension is required */
        required: boolean;
        /** Reference to the glTF exporter */
        private _textureInfos;
        private _exportedTextures;
        private _wasUsed;
        constructor(exporter: _Exporter);
        dispose(): void;
        /** @hidden */
        get wasUsed(): boolean;
        private _getTextureIndex;
        postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: Texture): void;
        postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[];
        postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial>;
    }
}
declare module BABYLON.GLTF2.Exporter.Extensions {
    /**
     * @hidden
     */
    export class KHR_materials_unlit implements IGLTFExporterExtensionV2 {
        /** Name of this extension */
        readonly name: string;
        /** Defines whether this extension is enabled */
        enabled: boolean;
        /** Defines whether this extension is required */
        required: boolean;
        private _wasUsed;
        constructor(exporter: _Exporter);
        /** @hidden */
        get wasUsed(): boolean;
        dispose(): void;
        postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial>;
    }
}
declare module BABYLON {
    /**
    * Class for generating STL data from a Babylon scene.
    */
    export class STLExport {
        /**
        * Exports the geometry of a Mesh array in .STL file format (ASCII)
        * @param meshes list defines the mesh to serialize
        * @param download triggers the automatic download of the file.
        * @param fileName changes the downloads fileName.
        * @param binary changes the STL to a binary type.
        * @param isLittleEndian toggle for binary type exporter.
        * @returns the STL as UTF8 string
        */
        static CreateSTL(meshes: Mesh[], download?: boolean, fileName?: string, binary?: boolean, isLittleEndian?: boolean): any;
    }
}