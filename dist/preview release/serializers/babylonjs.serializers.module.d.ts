/*BabylonJS serializers*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs
//   ../../../../Tools/Gulp/babylonjs-gltf2interface

declare module 'babylonjs-serializers' {
    export * from "babylonjs-serializers/src/OBJ";
    export * from "babylonjs-serializers/src/glTF";
}

declare module 'babylonjs-serializers/src/OBJ' {
    export * from "babylonjs-serializers/src/OBJ/objSerializer";
}

declare module 'babylonjs-serializers/src/glTF' {
    export * from "babylonjs-serializers/src/glTF/glTFFileExporter";
    export * from "babylonjs-serializers/src/glTF/2.0";
}

declare module 'babylonjs-serializers/src/OBJ/objSerializer' {
    import { Mesh } from "babylonjs";
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

declare module 'babylonjs-serializers/src/glTF/glTFFileExporter' {
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

declare module 'babylonjs-serializers/src/glTF/2.0' {
    export * from "babylonjs-serializers/src/glTF/2.0/glTFAnimation";
    export * from "babylonjs-serializers/src/glTF/2.0/glTFData";
    export * from "babylonjs-serializers/src/glTF/2.0/glTFExporter";
    export * from "babylonjs-serializers/src/glTF/2.0/glTFExporterExtension";
    export * from "babylonjs-serializers/src/glTF/2.0/glTFMaterialExporter";
    export * from "babylonjs-serializers/src/glTF/2.0/glTFSerializer";
    export * from "babylonjs-serializers/src/glTF/2.0/glTFUtilities";
    export * from "babylonjs-serializers/src/glTF/2.0/Extensions";
}

declare module 'babylonjs-serializers/src/glTF/2.0/glTFAnimation' {
    import { Animation, TransformNode, Nullable, Scene } from "babylonjs";
    import { AnimationSamplerInterpolation, AnimationChannelTargetPath, AccessorType, IAnimation, INode, IBufferView, IAccessor } from "babylonjs-gltf2interface";
    import { _BinaryWriter } from "babylonjs-serializers/src/glTF/2.0/glTFExporter";
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
    }
}

declare module 'babylonjs-serializers/src/glTF/2.0/glTFData' {
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

declare module 'babylonjs-serializers/src/glTF/2.0/glTFExporter' {
    import { Scene, Engine, Nullable, Texture, BaseTexture, SubMesh, FloatArray, Vector3, Vector4 } from "babylonjs";
    import { IBufferView, IAccessor, IMaterial, ITexture, IImage, ISampler, ImageMimeType, IMeshPrimitive } from "babylonjs-gltf2interface";
    import { IGLTFExporterExtensionV2 } from "babylonjs-serializers/src/glTF/2.0/glTFExporterExtension";
    import { _GLTFMaterialExporter } from "babylonjs-serializers/src/glTF/2.0/glTFMaterialExporter";
    import { IExportOptions } from "babylonjs-serializers/src/glTF/2.0/glTFSerializer";
    import { GLTFData } from "babylonjs-serializers/src/glTF/2.0/glTFData";
    /**
        * Converts Babylon Scene into glTF 2.0.
        * @hidden
        */
    export class _Exporter {
            /**
                * Stores all generated buffer views, which represents views into the main glTF buffer data
                */
            _bufferViews: IBufferView[];
            /**
                * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF
                */
            _accessors: IAccessor[];
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
                * Stores a map of the image data, where the key is the file name and the value
                * is the image data
                */
            _imageData: {
                    [fileName: string]: {
                            data: Uint8Array;
                            mimeType: ImageMimeType;
                    };
            };
            _glTFMaterialExporter: _GLTFMaterialExporter;
            _extensionsPreExportTextureAsync(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<BaseTexture>>;
            _extensionsPostExportMeshPrimitiveAsync(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Nullable<Promise<IMeshPrimitive>>;
            /**
                * Creates a glTF Exporter instance, which can accept optional exporter options
                * @param babylonScene Babylon scene object
                * @param options Options to modify the behavior of the exporter
                */
            constructor(babylonScene: Scene, options?: IExportOptions);
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
            _getLocalEngine(): Engine;
            /**
                * Writes mesh attribute data to a data buffer
                * Returns the bytelength of the data
                * @param vertexBufferKind Indicates what kind of vertex data is being passed in
                * @param meshAttributeArray Array containing the attribute data
                * @param binaryWriter The buffer to write the binary data to
                * @param indices Used to specify the order of the vertex data
                */
            writeAttributeData(vertexBufferKind: string, meshAttributeArray: FloatArray, byteStride: number, binaryWriter: _BinaryWriter): void;
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

declare module 'babylonjs-serializers/src/glTF/2.0/glTFExporterExtension' {
    import { IDisposable, Texture, Nullable, SubMesh } from "babylonjs";
    import { ImageMimeType, IMeshPrimitive } from "babylonjs-gltf2interface";
    import { _BinaryWriter } from "babylonjs-serializers/src/glTF/2.0/glTFExporter";
    import { IGLTFExporterExtension } from "babylonjs-serializers/src/glTF/glTFFileExporter";
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
                * @param babylonTexture The glTF texture info property
                * @param mimeType The mime-type of the generated image
                * @returns A promise that resolves with the exported glTF texture info when the export is complete, or null if not handled
                */
            preExportTextureAsync?(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<Texture>>;
            /**
                * Define this method to modify the default behavior when exporting texture info
                * @param context The context when loading the asset
                * @param meshPrimitive glTF mesh primitive
                * @param babylonSubMesh Babylon submesh
                * @param binaryWriter glTF serializer binary writer instance
                */
            postExportMeshPrimitiveAsync?(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Nullable<Promise<IMeshPrimitive>>;
    }
}

declare module 'babylonjs-serializers/src/glTF/2.0/glTFMaterialExporter' {
    import { Nullable, Material, StandardMaterial, PBRMetallicRoughnessMaterial, PBRMaterial, BaseTexture } from "babylonjs";
    import { ITextureInfo, ImageMimeType, IMaterial, IMaterialPbrMetallicRoughness, MaterialAlphaMode } from "babylonjs-gltf2interface";
    import { _Exporter } from "babylonjs-serializers/src/glTF/2.0/glTFExporter";
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
                * Gets the glTF alpha mode from the Babylon Material
                * @param babylonMaterial Babylon Material
                * @returns The Babylon alpha mode value
                */
            _getAlphaMode(babylonMaterial: Material): MaterialAlphaMode;
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
            _convertStandardMaterialAsync(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<void>;
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
            _convertPBRMetallicRoughnessMaterialAsync(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<void>;
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
            _convertPBRMaterialAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<void>;
            /**
                * Extracts a texture from a Babylon texture into file data and glTF data
                * @param babylonTexture Babylon texture to extract
                * @param mimeType Mime Type of the babylonTexture
                * @return glTF texture info, or null if the texture format is not supported
                */
            _exportTextureAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>>;
            _exportTextureInfoAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>>;
    }
}

declare module 'babylonjs-serializers/src/glTF/2.0/glTFSerializer' {
    import { TransformNode, Scene } from "babylonjs";
    import { GLTFData } from "babylonjs-serializers/src/glTF/2.0/glTFData";
    /**
        * Holds a collection of exporter options and parameters
        */
    export interface IExportOptions {
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
            static GLTFAsync(scene: Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData>;
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

declare module 'babylonjs-serializers/src/glTF/2.0/glTFUtilities' {
    import { Nullable, FloatArray, Vector3, Vector4, Quaternion } from "babylonjs";
    import { IBufferView, AccessorType, AccessorComponentType, IAccessor } from "babylonjs-gltf2interface";
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

declare module 'babylonjs-serializers/src/glTF/2.0/Extensions' {
    export * from "babylonjs-serializers/src/glTF/2.0/Extensions/KHR_texture_transform";
}

declare module 'babylonjs-serializers/src/glTF/2.0/Extensions/KHR_texture_transform' {
    import { Texture, Nullable, Vector2, Scene, BaseTexture } from "babylonjs";
    import { ImageMimeType } from "babylonjs-gltf2interface";
    import { IGLTFExporterExtensionV2 } from "babylonjs-serializers/src/glTF/2.0/glTFExporterExtension";
    import { _Exporter } from "babylonjs-serializers/src/glTF/2.0/glTFExporter";
    import "../shaders/textureTransform.fragment";
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
            preExportTextureAsync(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<Texture>>;
            /**
                * Transform the babylon texture by the offset, rotation and scale parameters using a procedural texture
                * @param babylonTexture
                * @param offset
                * @param rotation
                * @param scale
                * @param scene
                */
            textureTransformTextureAsync(babylonTexture: Texture, offset: Vector2, rotation: number, scale: Vector2, scene: Scene): Promise<BaseTexture>;
    }
}


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
declare module BABYLON.GLTF2.Exporter {
    /**
        * Converts Babylon Scene into glTF 2.0.
        * @hidden
        */
    export class _Exporter {
            /**
                * Stores all generated buffer views, which represents views into the main glTF buffer data
                */
            _bufferViews: IBufferView[];
            /**
                * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF
                */
            _accessors: IAccessor[];
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
                * Stores a map of the image data, where the key is the file name and the value
                * is the image data
                */
            _imageData: {
                    [fileName: string]: {
                            data: Uint8Array;
                            mimeType: ImageMimeType;
                    };
            };
            _glTFMaterialExporter: _GLTFMaterialExporter;
            _extensionsPreExportTextureAsync(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<BaseTexture>>;
            _extensionsPostExportMeshPrimitiveAsync(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Nullable<Promise<IMeshPrimitive>>;
            /**
                * Creates a glTF Exporter instance, which can accept optional exporter options
                * @param babylonScene Babylon scene object
                * @param options Options to modify the behavior of the exporter
                */
            constructor(babylonScene: Scene, options?: IExportOptions);
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
            _getLocalEngine(): Engine;
            /**
                * Writes mesh attribute data to a data buffer
                * Returns the bytelength of the data
                * @param vertexBufferKind Indicates what kind of vertex data is being passed in
                * @param meshAttributeArray Array containing the attribute data
                * @param binaryWriter The buffer to write the binary data to
                * @param indices Used to specify the order of the vertex data
                */
            writeAttributeData(vertexBufferKind: string, meshAttributeArray: FloatArray, byteStride: number, binaryWriter: _BinaryWriter): void;
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
                * @param babylonTexture The glTF texture info property
                * @param mimeType The mime-type of the generated image
                * @returns A promise that resolves with the exported glTF texture info when the export is complete, or null if not handled
                */
            preExportTextureAsync?(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<Texture>>;
            /**
                * Define this method to modify the default behavior when exporting texture info
                * @param context The context when loading the asset
                * @param meshPrimitive glTF mesh primitive
                * @param babylonSubMesh Babylon submesh
                * @param binaryWriter glTF serializer binary writer instance
                */
            postExportMeshPrimitiveAsync?(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Nullable<Promise<IMeshPrimitive>>;
    }
}
declare module BABYLON.GLTF2.Exporter {
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
                * Gets the glTF alpha mode from the Babylon Material
                * @param babylonMaterial Babylon Material
                * @returns The Babylon alpha mode value
                */
            _getAlphaMode(babylonMaterial: Material): MaterialAlphaMode;
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
            _convertStandardMaterialAsync(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<void>;
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
            _convertPBRMetallicRoughnessMaterialAsync(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<void>;
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
            _convertPBRMaterialAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<void>;
            /**
                * Extracts a texture from a Babylon texture into file data and glTF data
                * @param babylonTexture Babylon texture to extract
                * @param mimeType Mime Type of the babylonTexture
                * @return glTF texture info, or null if the texture format is not supported
                */
            _exportTextureAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>>;
            _exportTextureInfoAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>>;
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
            shouldExportTransformNode?(transformNode: TransformNode): boolean;
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
            static GLTFAsync(scene: Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData>;
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
declare module BABYLON.GLTF2.Exporter.Extensions {
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
            preExportTextureAsync(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<Texture>>;
            /**
                * Transform the babylon texture by the offset, rotation and scale parameters using a procedural texture
                * @param babylonTexture
                * @param offset
                * @param rotation
                * @param scale
                * @param scene
                */
            textureTransformTextureAsync(babylonTexture: Texture, offset: Vector2, rotation: number, scale: Vector2, scene: Scene): Promise<BaseTexture>;
    }
}