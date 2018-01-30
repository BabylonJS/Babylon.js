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

declare module BABYLON.GLTF2 {
    const enum AccessorComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        UNSIGNED_INT = 5125,
        FLOAT = 5126,
    }
    const enum AccessorType {
        SCALAR = "SCALAR",
        VEC2 = "VEC2",
        VEC3 = "VEC3",
        VEC4 = "VEC4",
        MAT2 = "MAT2",
        MAT3 = "MAT3",
        MAT4 = "MAT4",
    }
    const enum AnimationChannelTargetPath {
        TRANSLATION = "translation",
        ROTATION = "rotation",
        SCALE = "scale",
        WEIGHTS = "weights",
    }
    const enum AnimationInterpolation {
        LINEAR = "LINEAR",
        STEP = "STEP",
        CUBICSPLINE = "CUBICSPLINE",
    }
    const enum CameraType {
        PERSPECTIVE = "perspective",
        ORTHOGRAPHIC = "orthographic",
    }
    const enum ImageMimeType {
        JPEG = "image/jpeg",
        PNG = "image/png",
    }
    const enum MaterialAlphaMode {
        OPAQUE = "OPAQUE",
        MASK = "MASK",
        BLEND = "BLEND",
    }
    const enum MeshPrimitiveMode {
        POINTS = 0,
        LINES = 1,
        LINE_LOOP = 2,
        LINE_STRIP = 3,
        TRIANGLES = 4,
        TRIANGLE_STRIP = 5,
        TRIANGLE_FAN = 6,
    }
    const enum TextureMagFilter {
        NEAREST = 9728,
        LINEAR = 9729,
    }
    const enum TextureMinFilter {
        NEAREST = 9728,
        LINEAR = 9729,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987,
    }
    const enum TextureWrapMode {
        CLAMP_TO_EDGE = 33071,
        MIRRORED_REPEAT = 33648,
        REPEAT = 10497,
    }
    interface IProperty {
        extensions?: {
            [key: string]: any;
        };
        extras?: any;
    }
    interface IChildRootProperty extends IProperty {
        name?: string;
    }
    interface IAccessorSparseIndices extends IProperty {
        bufferView: number;
        byteOffset?: number;
        componentType: AccessorComponentType;
    }
    interface IAccessorSparseValues extends IProperty {
        bufferView: number;
        byteOffset?: number;
    }
    interface IAccessorSparse extends IProperty {
        count: number;
        indices: IAccessorSparseIndices;
        values: IAccessorSparseValues;
    }
    interface IAccessor extends IChildRootProperty {
        bufferView?: number;
        byteOffset?: number;
        componentType: AccessorComponentType;
        normalized?: boolean;
        count: number;
        type: AccessorType;
        max?: number[];
        min?: number[];
        sparse?: IAccessorSparse;
    }
    interface IAnimationChannel extends IProperty {
        sampler: number;
        target: IAnimationChannelTarget;
    }
    interface IAnimationChannelTarget extends IProperty {
        node: number;
        path: AnimationChannelTargetPath;
    }
    interface IAnimationSampler extends IProperty {
        input: number;
        interpolation?: AnimationInterpolation;
        output: number;
    }
    interface IAnimation extends IChildRootProperty {
        channels: IAnimationChannel[];
        samplers: IAnimationSampler[];
    }
    interface IAsset extends IChildRootProperty {
        copyright?: string;
        generator?: string;
        version: string;
        minVersion?: string;
    }
    interface IBuffer extends IChildRootProperty {
        uri?: string;
        byteLength: number;
    }
    interface IBufferView extends IChildRootProperty {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
        byteStride?: number;
    }
    interface ICameraOrthographic extends IProperty {
        xmag: number;
        ymag: number;
        zfar: number;
        znear: number;
    }
    interface ICameraPerspective extends IProperty {
        aspectRatio: number;
        yfov: number;
        zfar: number;
        znear: number;
    }
    interface ICamera extends IChildRootProperty {
        orthographic?: ICameraOrthographic;
        perspective?: ICameraPerspective;
        type: CameraType;
    }
    interface IImage extends IChildRootProperty {
        uri?: string;
        mimeType?: ImageMimeType;
        bufferView?: number;
    }
    interface IMaterialNormalTextureInfo extends ITextureInfo {
        scale?: number;
    }
    interface IMaterialOcclusionTextureInfo extends ITextureInfo {
        strength?: number;
    }
    interface IMaterialPbrMetallicRoughness {
        baseColorFactor?: number[];
        baseColorTexture?: ITextureInfo;
        metallicFactor?: number;
        roughnessFactor?: number;
        metallicRoughnessTexture?: ITextureInfo;
    }
    interface IMaterial extends IChildRootProperty {
        pbrMetallicRoughness?: IMaterialPbrMetallicRoughness;
        normalTexture?: IMaterialNormalTextureInfo;
        occlusionTexture?: IMaterialOcclusionTextureInfo;
        emissiveTexture?: ITextureInfo;
        emissiveFactor?: number[];
        alphaMode?: MaterialAlphaMode;
        alphaCutoff?: number;
        doubleSided?: boolean;
    }
    interface IMeshPrimitive extends IProperty {
        attributes: {
            [name: string]: number;
        };
        indices?: number;
        material?: number;
        mode?: MeshPrimitiveMode;
        targets?: {
            [name: string]: number;
        }[];
    }
    interface IMesh extends IChildRootProperty {
        primitives: IMeshPrimitive[];
        weights?: number[];
    }
    interface INode extends IChildRootProperty {
        camera?: number;
        children?: number[];
        skin?: number;
        matrix?: number[];
        mesh?: number;
        rotation?: number[];
        scale?: number[];
        translation?: number[];
        weights?: number[];
    }
    interface ISampler extends IChildRootProperty {
        magFilter?: TextureMagFilter;
        minFilter?: TextureMinFilter;
        wrapS?: TextureWrapMode;
        wrapT?: TextureWrapMode;
    }
    interface IScene extends IChildRootProperty {
        nodes: number[];
    }
    interface ISkin extends IChildRootProperty {
        inverseBindMatrices?: number;
        skeleton?: number;
        joints: number[];
    }
    interface ITexture extends IChildRootProperty {
        sampler?: number;
        source: number;
    }
    interface ITextureInfo {
        index: number;
        texCoord?: number;
    }
    interface IGLTF extends IProperty {
        accessors?: IAccessor[];
        animations?: IAnimation[];
        asset: IAsset;
        buffers?: IBuffer[];
        bufferViews?: IBufferView[];
        cameras?: ICamera[];
        extensionsUsed?: string[];
        extensionsRequired?: string[];
        images?: IImage[];
        materials?: IMaterial[];
        meshes?: IMesh[];
        nodes?: INode[];
        samplers?: ISampler[];
        scene?: number;
        scenes?: IScene[];
        skins?: ISkin[];
        textures?: ITexture[];
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
         * @param bufferviewIndex
         * @param name
         * @param type
         * @param componentType
         * @param count
         * @param min
         * @param max
         * @returns - accessor for glTF
         */
        private createAccessor(bufferviewIndex, name, type, componentType, count, byteOffset?, min?, max?);
        /**
         * Calculates the minimum and maximum values of an array of floats, based on stride
         * @param buff - Data to check for min and max values.
         * @param vertexStart - Start offset to calculate min and max values.
         * @param vertexCount - Number of vertices to check for min and max values.
         * @param stride - Offset between consecutive attributes.
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
         * @returns - min number array and max number array.
         */
        private calculateMinMax(buff, vertexStart, vertexCount, stride, useRightHandedSystem);
        /**
         * Writes mesh attribute data to a data buffer.
         * Returns the bytelength of the data.
         * @param vertexBufferKind - Indicates what kind of vertex data is being passed in.
         * @param meshAttributeArray - Array containing the attribute data.
         * @param strideSize - Represents the offset between consecutive attributes
         * @param byteOffset - The offset to start counting bytes from.
         * @param dataBuffer - The buffer to write the binary data to.
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
         * @returns - Byte length of the attribute data.
         */
        private writeAttributeData(vertexBufferKind, meshAttributeArray, strideSize, vertexBufferOffset, byteOffset, dataBuffer, useRightHandedSystem);
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
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
         */
        private setNodeTransformation(node, babylonMesh, useRightHandedSystem);
        /**
         *
         * @param babylonTexture - Babylon texture to extract.
         * @param mimeType - Mime Type of the babylonTexture.
         * @return - glTF texture, or null if the texture format is not supported.
         */
        private exportTexture(babylonTexture, mimeType?);
        /**
         * Creates a bufferview based on the vertices type for the Babylon mesh
         * @param kind - Indicates the type of vertices data.
         * @param babylonMesh - The Babylon mesh to get the vertices data from.
         * @param byteOffset - The offset from the buffer to start indexing from.
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
         * @param dataBuffer - The buffer to write the bufferview data to.
         * @returns bytelength of the bufferview data.
         */
        private createBufferViewKind(kind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh - glTF Mesh object to store the primitive attribute information.
         * @param babylonMesh - Babylon mesh to get the primitive attribute data from.
         * @param byteOffset - The offset in bytes of the buffer data.
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
         * @param dataBuffer - Buffer to write the attribute data to.
         * @returns - bytelength of the primitive attributes plus the passed in byteOffset.
         */
        private setPrimitiveAttributes(mesh, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
        /**
         * Creates a glTF scene based on the array of meshes.
         * Returns the the total byte offset.
         * @param babylonScene - Babylon scene to get the mesh data from.
         * @param byteOffset - Offset to start from in bytes.
         * @param dataBuffer - Buffer to write geometry data to.
         * @returns bytelength + byteoffset
         */
        private createScene(babylonScene, byteOffset, dataBuffer);
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
        private static readonly dielectricSpecular;
        /**
         * Epsilon value, used as a small tolerance value for a numeric value.
         */
        private static readonly epsilon;
        /**
         * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material.
         * @param babylonStandardMaterial
         * @returns - glTF Metallic Roughness Material representation
         */
        static ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness;
        /**
         * Converts Specular Glossiness to Metallic Roughness.  This is based on the algorithm used in the Babylon glTF 3ds Max Exporter.
         * {@link https://github.com/BabylonJS/Exporters/blob/master/3ds%20Max/Max2Babylon/Exporter/BabylonExporter.GLTFExporter.Material.cs}
         * @param  babylonSpecularGlossiness - Babylon specular glossiness parameters
         * @returns - Babylon metallic roughness values
         */
        private static _ConvertToMetallicRoughness(babylonSpecularGlossiness);
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
        static GetAlphaMode(babylonMaterial: Material): MaterialAlphaMode;
    }
}
