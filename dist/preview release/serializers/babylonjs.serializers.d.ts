/*BabylonJS serializers*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs
//   ../../../../Tools/Gulp/babylonjs-gltf2interface
declare module BABYLON {
    /**
        * Class for generating OBJ data from a Babylon scene.
        */
    export class OBJExport {
            /**
                * Exports the geometry of a BABYLON.Mesh array in .OBJ file format (text)
                * @param mesh defines the list of meshes to serialize
                * @param materials defines if materials should be exported
                * @param matlibname defines the name of the associated mtl file
                * @param globalposition defines if the exported positions are globals or local to the exported mesh
                * @returns the OBJ content
                */
            static OBJ(mesh: BABYLON.Mesh[], materials?: boolean, matlibname?: string, globalposition?: boolean): string;
            /**
                * Exports the material(s) of a mesh in .MTL file format (text)
                * @param mesh defines the mesh to extract the material from
                * @returns the mtl content
                */
            static MTL(mesh: BABYLON.Mesh): string;
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
declare module BABYLON {
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
                * BABYLON.Animation interpolation data.
                */
            samplerInterpolation: BABYLON.GLTF2.AnimationSamplerInterpolation;
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
            animationChannelTargetPath: BABYLON.GLTF2.AnimationChannelTargetPath;
            /**
                * The glTF accessor type for the data.
                */
            dataAccessorType: BABYLON.GLTF2.AccessorType.VEC3 | BABYLON.GLTF2.AccessorType.VEC4;
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
            static _CreateNodeAnimation(babylonTransformNode: BABYLON.TransformNode, animation: BABYLON.Animation, animationChannelTargetPath: BABYLON.GLTF2.AnimationChannelTargetPath, convertToRightHandedSystem: boolean, useQuaternion: boolean, animationSampleRate: number): BABYLON.Nullable<_IAnimationData>;
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
            static _CreateNodeAnimationFromTransformNodeAnimations(babylonTransformNode: BABYLON.TransformNode, runtimeGLTFAnimation: BABYLON.GLTF2.IAnimation, idleGLTFAnimations: BABYLON.GLTF2.IAnimation[], nodeMap: {
                    [key: number]: number;
            }, nodes: BABYLON.GLTF2.INode[], binaryWriter: _BinaryWriter, bufferViews: BABYLON.GLTF2.IBufferView[], accessors: BABYLON.GLTF2.IAccessor[], convertToRightHandedSystem: boolean, animationSampleRate: number): void;
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
            static _CreateNodeAnimationFromAnimationGroups(babylonScene: BABYLON.Scene, glTFAnimations: BABYLON.GLTF2.IAnimation[], nodeMap: {
                    [key: number]: number;
            }, nodes: BABYLON.GLTF2.INode[], binaryWriter: _BinaryWriter, bufferViews: BABYLON.GLTF2.IBufferView[], accessors: BABYLON.GLTF2.IAccessor[], convertToRightHandedSystem: boolean, animationSampleRate: number): void;
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
        * Converts Babylon BABYLON.Scene into glTF 2.0.
        * @hidden
        */
    export class _Exporter {
            /**
                * Stores all generated buffer views, which represents views into the main glTF buffer data
                */
            _bufferViews: BABYLON.GLTF2.IBufferView[];
            /**
                * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF
                */
            _accessors: BABYLON.GLTF2.IAccessor[];
            /**
                * Stores all the generated material information, which represents the appearance of each primitive
                */
            _materials: BABYLON.GLTF2.IMaterial[];
            _materialMap: {
                    [materialID: number]: number;
            };
            /**
                * Stores all the generated texture information, which is referenced by glTF materials
                */
            _textures: BABYLON.GLTF2.ITexture[];
            /**
                * Stores all the generated image information, which is referenced by glTF textures
                */
            _images: BABYLON.GLTF2.IImage[];
            /**
                * Stores all the texture samplers
                */
            _samplers: BABYLON.GLTF2.ISampler[];
            /**
                * Stores a map of the image data, where the key is the file name and the value
                * is the image data
                */
            _imageData: {
                    [fileName: string]: {
                            data: Uint8Array;
                            mimeType: BABYLON.GLTF2.ImageMimeType;
                    };
            };
            _glTFMaterialExporter: _GLTFMaterialExporter;
            _extensionsPreExportTextureAsync(context: string, babylonTexture: BABYLON.Texture, mimeType: BABYLON.GLTF2.ImageMimeType): BABYLON.Nullable<Promise<BABYLON.BaseTexture>>;
            _extensionsPostExportMeshPrimitiveAsync(context: string, meshPrimitive: BABYLON.GLTF2.IMeshPrimitive, babylonSubMesh: BABYLON.SubMesh, binaryWriter: _BinaryWriter): BABYLON.Nullable<Promise<BABYLON.GLTF2.IMeshPrimitive>>;
            /**
                * Creates a glTF Exporter instance, which can accept optional exporter options
                * @param babylonScene Babylon scene object
                * @param options Options to modify the behavior of the exporter
                */
            constructor(babylonScene: BABYLON.Scene, options?: IExportOptions);
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
                * Lazy load a local engine with premultiplied alpha set to false
                */
            _getLocalEngine(): BABYLON.Engine;
            /**
                * Writes mesh attribute data to a data buffer
                * Returns the bytelength of the data
                * @param vertexBufferKind Indicates what kind of vertex data is being passed in
                * @param meshAttributeArray Array containing the attribute data
                * @param binaryWriter The buffer to write the binary data to
                * @param indices Used to specify the order of the vertex data
                */
            writeAttributeData(vertexBufferKind: string, meshAttributeArray: BABYLON.FloatArray, byteStride: number, binaryWriter: _BinaryWriter): void;
            /**
                * Generates data for .gltf and .bin files based on the glTF prefix string
                * @param glTFPrefix Text to use when prefixing a glTF file
                * @returns GLTFData with glTF file data
                */
            _generateGLTFAsync(glTFPrefix: string): Promise<GLTFData>;
            /**
                * Generates a glb file from the json and binary data
                * Returns an object with the glb file name as the key and data as the value
                * @param glTFPrefix
                * @returns object with glb filename as key and data as value
                */
            _generateGLBAsync(glTFPrefix: string): Promise<GLTFData>;
    }
    /**
        * @hidden
        *
        * Stores glTF binary data.  If the array buffer byte length is exceeded, it doubles in size dynamically
        */
    export class _BinaryWriter {
            /**
                * Initialize binary writer with an initial byte length
                * @param byteLength Initial byte length of the array buffer
                */
            constructor(byteLength: number);
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
            getVector3Float32FromRef(vector3: BABYLON.Vector3, byteOffset: number): void;
            setVector3Float32FromRef(vector3: BABYLON.Vector3, byteOffset: number): void;
            getVector4Float32FromRef(vector4: BABYLON.Vector4, byteOffset: number): void;
            setVector4Float32FromRef(vector4: BABYLON.Vector4, byteOffset: number): void;
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
    /** @hidden */
    export var __IGLTFExporterExtensionV2: number;
    /**
        * Interface for a glTF exporter extension
        * @hidden
        */
    export interface IGLTFExporterExtensionV2 extends IGLTFExporterExtension, BABYLON.IDisposable {
            /**
                * Define this method to modify the default behavior before exporting a texture
                * @param context The context when loading the asset
                * @param babylonTexture The glTF texture info property
                * @param mimeType The mime-type of the generated image
                * @returns A promise that resolves with the exported glTF texture info when the export is complete, or null if not handled
                */
            preExportTextureAsync?(context: string, babylonTexture: BABYLON.Texture, mimeType: BABYLON.GLTF2.ImageMimeType): BABYLON.Nullable<Promise<BABYLON.Texture>>;
            /**
                * Define this method to modify the default behavior when exporting texture info
                * @param context The context when loading the asset
                * @param meshPrimitive glTF mesh primitive
                * @param babylonSubMesh Babylon submesh
                * @param binaryWriter glTF serializer binary writer instance
                */
            postExportMeshPrimitiveAsync?(context: string, meshPrimitive: BABYLON.GLTF2.IMeshPrimitive, babylonSubMesh: BABYLON.SubMesh, binaryWriter: _BinaryWriter): BABYLON.Nullable<Promise<BABYLON.GLTF2.IMeshPrimitive>>;
    }
}
declare module BABYLON {
    /**
        * Utility methods for working with glTF material conversion properties.  This class should only be used internally
        * @hidden
        */
    export class _GLTFMaterialExporter {
            constructor(exporter: _Exporter);
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
            _convertMaterialsToGLTFAsync(babylonMaterials: BABYLON.Material[], mimeType: BABYLON.GLTF2.ImageMimeType, hasTextureCoords: boolean): Promise<void>;
            /**
                * Makes a copy of the glTF material without the texture parameters
                * @param originalMaterial original glTF material
                * @returns glTF material without texture parameters
                */
            _stripTexturesFromMaterial(originalMaterial: BABYLON.GLTF2.IMaterial): BABYLON.GLTF2.IMaterial;
            /**
                * Specifies if the material has any texture parameters present
                * @param material glTF BABYLON.Material
                * @returns boolean specifying if texture parameters are present
                */
            _hasTexturesPresent(material: BABYLON.GLTF2.IMaterial): boolean;
            /**
                * Converts a Babylon BABYLON.StandardMaterial to a glTF Metallic Roughness BABYLON.Material
                * @param babylonStandardMaterial
                * @returns glTF Metallic Roughness BABYLON.Material representation
                */
            _convertToGLTFPBRMetallicRoughness(babylonStandardMaterial: BABYLON.StandardMaterial): BABYLON.GLTF2.IMaterialPbrMetallicRoughness;
            /**
                * Computes the metallic factor
                * @param diffuse diffused value
                * @param specular specular value
                * @param oneMinusSpecularStrength one minus the specular strength
                * @returns metallic value
                */
            static _SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number;
            /**
                * Gets the glTF alpha mode from the Babylon BABYLON.Material
                * @param babylonMaterial Babylon BABYLON.Material
                * @returns The Babylon alpha mode value
                */
            _getAlphaMode(babylonMaterial: BABYLON.Material): BABYLON.GLTF2.MaterialAlphaMode;
            /**
                * Converts a Babylon Standard BABYLON.Material to a glTF BABYLON.Material
                * @param babylonStandardMaterial BJS Standard BABYLON.Material
                * @param mimeType mime type to use for the textures
                * @param images array of glTF image interfaces
                * @param textures array of glTF texture interfaces
                * @param materials array of glTF material interfaces
                * @param imageData map of image file name to data
                * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
                */
            _convertStandardMaterialAsync(babylonStandardMaterial: BABYLON.StandardMaterial, mimeType: BABYLON.GLTF2.ImageMimeType, hasTextureCoords: boolean): Promise<void>;
            /**
                * Converts a Babylon PBR Metallic Roughness BABYLON.Material to a glTF BABYLON.Material
                * @param babylonPBRMetalRoughMaterial BJS PBR Metallic Roughness BABYLON.Material
                * @param mimeType mime type to use for the textures
                * @param images array of glTF image interfaces
                * @param textures array of glTF texture interfaces
                * @param materials array of glTF material interfaces
                * @param imageData map of image file name to data
                * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
                */
            _convertPBRMetallicRoughnessMaterialAsync(babylonPBRMetalRoughMaterial: BABYLON.PBRMetallicRoughnessMaterial, mimeType: BABYLON.GLTF2.ImageMimeType, hasTextureCoords: boolean): Promise<void>;
            /**
                * Converts a Babylon PBR Metallic Roughness BABYLON.Material to a glTF BABYLON.Material
                * @param babylonPBRMaterial BJS PBR Metallic Roughness BABYLON.Material
                * @param mimeType mime type to use for the textures
                * @param images array of glTF image interfaces
                * @param textures array of glTF texture interfaces
                * @param materials array of glTF material interfaces
                * @param imageData map of image file name to data
                * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
                */
            _convertPBRMaterialAsync(babylonPBRMaterial: BABYLON.PBRMaterial, mimeType: BABYLON.GLTF2.ImageMimeType, hasTextureCoords: boolean): Promise<void>;
            /**
                * Extracts a texture from a Babylon texture into file data and glTF data
                * @param babylonTexture Babylon texture to extract
                * @param mimeType Mime Type of the babylonTexture
                * @return glTF texture info, or null if the texture format is not supported
                */
            _exportTextureAsync(babylonTexture: BABYLON.BaseTexture, mimeType: BABYLON.GLTF2.ImageMimeType): Promise<BABYLON.Nullable<BABYLON.GLTF2.ITextureInfo>>;
            _exportTextureInfoAsync(babylonTexture: BABYLON.BaseTexture, mimeType: BABYLON.GLTF2.ImageMimeType): Promise<BABYLON.Nullable<BABYLON.GLTF2.ITextureInfo>>;
    }
}
declare module BABYLON {
    /**
        * Holds a collection of exporter options and parameters
        */
    export interface IExportOptions {
            /**
                * Function which indicates whether a babylon mesh should be exported or not
                * @param transformNode source Babylon transform node. It is used to check whether it should be exported to glTF or not
                * @returns boolean, which indicates whether the mesh should be exported (true) or not (false)
                */
            shouldExportTransformNode?(transformNode: BABYLON.TransformNode): boolean;
            /**
                * The sample rate to bake animation curves
                */
            animationSampleRate?: number;
            /**
                * Begin serialization without waiting for the scene to be ready
                */
            exportWithoutWaitingForScene?: boolean;
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
            static GLTFAsync(scene: BABYLON.Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData>;
            /**
                * Exports the geometry of the scene to .glb file format asychronously
                * @param scene Babylon scene with scene hierarchy information
                * @param filePrefix File prefix to use when generating glb file
                * @param options Exporter options
                * @returns Returns an object with a .glb filename as key and data as value
                */
            static GLBAsync(scene: BABYLON.Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData>;
    }
}
declare module BABYLON {
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
            static _CreateBufferView(bufferIndex: number, byteOffset: number, byteLength: number, byteStride?: number, name?: string): BABYLON.GLTF2.IBufferView;
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
            static _CreateAccessor(bufferviewIndex: number, name: string, type: BABYLON.GLTF2.AccessorType, componentType: BABYLON.GLTF2.AccessorComponentType, count: number, byteOffset: BABYLON.Nullable<number>, min: BABYLON.Nullable<number[]>, max: BABYLON.Nullable<number[]>): BABYLON.GLTF2.IAccessor;
            /**
                * Calculates the minimum and maximum values of an array of position floats
                * @param positions Positions array of a mesh
                * @param vertexStart Starting vertex offset to calculate min and max values
                * @param vertexCount Number of vertices to check for min and max values
                * @returns min number array and max number array
                */
            static _CalculateMinMaxPositions(positions: BABYLON.FloatArray, vertexStart: number, vertexCount: number, convertToRightHandedSystem: boolean): {
                    min: number[];
                    max: number[];
            };
            /**
                * Converts a new right-handed BABYLON.Vector3
                * @param vector vector3 array
                * @returns right-handed BABYLON.Vector3
                */
            static _GetRightHandedPositionVector3(vector: BABYLON.Vector3): BABYLON.Vector3;
            /**
                * Converts a BABYLON.Vector3 to right-handed
                * @param vector BABYLON.Vector3 to convert to right-handed
                */
            static _GetRightHandedPositionVector3FromRef(vector: BABYLON.Vector3): void;
            /**
                * Converts a three element number array to right-handed
                * @param vector number array to convert to right-handed
                */
            static _GetRightHandedPositionArray3FromRef(vector: number[]): void;
            /**
                * Converts a new right-handed BABYLON.Vector3
                * @param vector vector3 array
                * @returns right-handed BABYLON.Vector3
                */
            static _GetRightHandedNormalVector3(vector: BABYLON.Vector3): BABYLON.Vector3;
            /**
                * Converts a BABYLON.Vector3 to right-handed
                * @param vector BABYLON.Vector3 to convert to right-handed
                */
            static _GetRightHandedNormalVector3FromRef(vector: BABYLON.Vector3): void;
            /**
                * Converts a three element number array to right-handed
                * @param vector number array to convert to right-handed
                */
            static _GetRightHandedNormalArray3FromRef(vector: number[]): void;
            /**
                * Converts a BABYLON.Vector4 to right-handed
                * @param vector BABYLON.Vector4 to convert to right-handed
                */
            static _GetRightHandedVector4FromRef(vector: BABYLON.Vector4): void;
            /**
                * Converts a BABYLON.Vector4 to right-handed
                * @param vector BABYLON.Vector4 to convert to right-handed
                */
            static _GetRightHandedArray4FromRef(vector: number[]): void;
            /**
                * Converts a BABYLON.Quaternion to right-handed
                * @param quaternion Source quaternion to convert to right-handed
                */
            static _GetRightHandedQuaternionFromRef(quaternion: BABYLON.Quaternion): void;
            /**
                * Converts a BABYLON.Quaternion to right-handed
                * @param quaternion Source quaternion to convert to right-handed
                */
            static _GetRightHandedQuaternionArrayFromRef(quaternion: number[]): void;
            static _NormalizeTangentFromRef(tangent: BABYLON.Vector4): void;
    }
}
declare module BABYLON {
    /**
        * @hidden
        */
    export class KHR_texture_transform implements IGLTFExporterExtensionV2 {
            /** Name of this extension */
            readonly name: string;
            /** Defines whether this extension is enabled */
            enabled: boolean;
            /** Defines whether this extension is required */
            required: boolean;
            constructor(exporter: _Exporter);
            dispose(): void;
            preExportTextureAsync(context: string, babylonTexture: BABYLON.Texture, mimeType: BABYLON.GLTF2.ImageMimeType): BABYLON.Nullable<Promise<BABYLON.Texture>>;
            /**
                * Transform the babylon texture by the offset, rotation and scale parameters using a procedural texture
                * @param babylonTexture
                * @param offset
                * @param rotation
                * @param scale
                * @param scene
                */
            textureTransformTextureAsync(babylonTexture: BABYLON.Texture, offset: BABYLON.Vector2, rotation: number, scale: BABYLON.Vector2, scene: BABYLON.Scene): Promise<BABYLON.BaseTexture>;
    }
}