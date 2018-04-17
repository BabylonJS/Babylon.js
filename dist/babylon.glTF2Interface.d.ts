declare module "babylonjs-gltf2interface" {
    export = BABYLON.GLTF2;
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
    const enum AnimationSamplerInterpolation {
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
        interpolation?: AnimationSamplerInterpolation;
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
        aspectRatio?: number;
        yfov: number;
        zfar?: number;
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
