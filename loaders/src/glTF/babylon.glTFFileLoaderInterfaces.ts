/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    /**
    * Enums
    */
    export enum EBinaryContentFormat {
        JSON = 0
    }

    export enum EBufferViewTarget {
        ARRAY_BUFFER = 34962,
        ELEMENT_ARRAY_BUFFER = 34963
    }

    export enum EComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        FLOAT = 5126
    }

    export enum EMeshPrimitiveMode {
        POINTS = 0,
        LINES = 1,
        LINE_LOOP = 2,
        LINE_STRIP = 3,
        TRIANGLES = 4,
        TRIANGLE_STRIP = 5,
        TRIANGLE_FAN = 6
    }

    export enum EParameterType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        INT = 5124,
        UNSIGNED_INT = 5125,
        FLOAT = 5126,
        FLOAT_VEC2 = 35664,
        FLOAT_VEC3 = 35665,
        FLOAT_VEC4 = 35666,
        INT_VEC2 = 35667,
        INT_VEC3 = 35668,
        INT_VEC4 = 35669,
        BOOL = 35670,
        BOOL_VEC2 = 35671,
        BOOL_VEC3 = 35672,
        BOOL_VEC4 = 35673,
        FLOAT_MAT2 = 35674,
        FLOAT_MAT3 = 35675,
        FLOAT_MAT4 = 35676,
        SAMPLER_2D = 35678
    }

    export enum ETextureMagFilter {
        NEAREST = 9728,
        LINEAR = 9728,
    }

    export enum ETextureMinFilter {
        NEAREST = 9728,
        LINEAR = 9728,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987
    }

    export enum ETextureFormat {
        ALPHA = 6406,
        RGB = 6407,
        RGBA = 6408,
        LUMINANCE = 6409,
        LUMINANCE_ALPHA = 6410
    }

    export enum ETextureTarget {
        TEXTURE_2D = 3553
    }

    export enum ETextureType {
        UNSIGNED_BYTE = 5121,
        UNSIGNED_SHORT_5_6_5 = 33635,
        UNSIGNED_SHORT_4_4_4_4 = 32819,
        UNSIGNED_SHORT_5_5_5_1 = 32820
    }

    export enum ETextureWrapMode {
        CLAMP_TO_EDGE = 33071,
        MIRRORED_REPEAT = 33648,
        REPEAT = 10497
    }

    /**
    * Interfaces
    */
    export interface IGLTFProperty {
        extensions?: Object;
        extras?: any;
    }

    export interface IGLTFChildRootProperty extends IGLTFProperty {
        name?: string;
    }

    export interface IGLTFAccessor extends IGLTFChildRootProperty {
        bufferView: number;
        byteOffset: number;
        byteStride?: number;
        componentType: EComponentType;
        normalized?: boolean;
        count: number;
        type: string;
        max: number[];
        min: number[];
    }

    export interface IGLTFAnimationChannel {
        sampler: number;
        target: IGLTFAnimationChannelTarget;
    }

    export interface IGLTFAnimationChannelTarget {
        id: number;
        path: string;
    }

    export interface IGLTFAnimationSampler {
        input: number;
        interpolation?: string;
        output: number;
    }

    export interface IGLTFAnimation extends IGLTFChildRootProperty {
        channels?: IGLTFAnimationChannel[];
        samplers?: IGLTFAnimationSampler[];
    }

    export interface IGLTFAssetProfile extends IGLTFProperty {
        api?: string;
        version?: string;
    }

    export interface IGLTFAsset extends IGLTFChildRootProperty {
        copyright?: string;
        generator?: string;
        profile?: IGLTFAssetProfile;
        version: string;
    }

    export interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri?: string;
        byteLength: number;

        // Loaded buffer (optimize)
        loadedBufferView: ArrayBufferView
    }

    export interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: number;
        byteOffset: number;
        byteLength: number;
        target?: EBufferViewTarget;
    }

    export interface IGLTFCameraOrthographic {
        xmag: number;
        ymag: number;
        zfar: number;
        znear: number;
    }

    export interface IGLTFCameraPerspective {
        aspectRatio: number;
        yfov: number;
        zfar: number;
        znear: number;
    }

    export interface IGLTFCamera extends IGLTFChildRootProperty {
        orthographic?: IGLTFCameraOrthographic;
        perspective?: IGLTFCameraPerspective;
        type: string;
    }

    export interface IGLTFImage extends IGLTFChildRootProperty {
        uri?: string;
        mimeType?: string;
        bufferView?: number;
    }

    export interface IGLTFMaterialNormalTextureInfo extends IGLTFTextureInfo {
        scale: number;
    }

    export interface IGLTFMaterialOcclusionTextureInfo extends IGLTFTextureInfo {
        strength: number;
    }

    export interface IGLTFMaterialPbrMetallicRoughness {
        baseColorFactor: number[];
        baseColorTexture: IGLTFTextureInfo;
        metallicFactor: number;
        roughnessFactor: number;
        metallicRoughnessTexture: IGLTFTextureInfo;
    }

    export interface IGLTFMaterial extends IGLTFChildRootProperty {
        pbrMetallicRoughness?: IGLTFMaterialPbrMetallicRoughness;
        normalTexture?: IGLTFMaterialNormalTextureInfo;
        occlusionTexture?: IGLTFMaterialOcclusionTextureInfo;
        emissiveTexture?: IGLTFTextureInfo;
        emissiveFactor?: number[];

        // Babylon.js values (optimize)
        babylonMaterial?: PBRMaterial;
    }

    export interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: { [name: string]: number };
        indices?: number;
        material?: number;
        mode?: EMeshPrimitiveMode;
    }

    export interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
    }

    export interface IGLTFNode extends IGLTFChildRootProperty {
        camera?: number;
        children?: number[];
        skeletons?: number[];
        skin?: number;
        jointName?: number;
        matrix: number[];
        mesh?: number;
        rotation?: number[];
        scale?: number[];
        translation?: number[];

        // Babylon.js values (optimize)
        babylonNode?: Node;
    }

    export interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: ETextureMagFilter;
        minFilter?: ETextureMinFilter;
        wrapS?: ETextureWrapMode;
        wrapT?: ETextureWrapMode;
    }

    export interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: number[];
    }

    export interface IGLTFSkin extends IGLTFChildRootProperty {
        bindShapeMatrix?: number[];
        inverseBindMatrices?: number;
        jointNames: number[];

        babylonSkeleton?: Skeleton;
    }

    export interface IGLTFTexture extends IGLTFChildRootProperty {
        format?: ETextureFormat;
        internalFormat?: ETextureFormat;
        sampler: number;
        source: number;
        target?: ETextureTarget;
        type?: ETextureType;

        // Babylon.js values (optimize)
        babylonTexture?: Texture;
    }

    export interface IGLTFTextureInfo {
        index: number;
        texCoord?: number;
    }

    export interface IGLTF extends IGLTFProperty {
        accessors?: IGLTFAccessor[];
        animations?: IGLTFAnimation[];
        asset: IGLTFAsset;
        buffers?: IGLTFBuffer[];
        bufferViews?: IGLTFBufferView[];
        cameras?: IGLTFCamera[];
        extensionsUsed?: string[];
        extensionsRequired?: string[];
        glExtensionsUsed?: string[];
        images?: IGLTFImage[];
        materials?: IGLTFMaterial[];
        meshes?: IGLTFMesh[];
        nodes?: IGLTFNode[];
        samplers?: IGLTFSampler[];
        scene?: number;
        scenes?: IGLTFScene[];
        skins?: IGLTFSkin[];
        textures?: IGLTFTexture[];
    }

    export interface IGLTFRuntime {
        gltf: IGLTF;

        babylonScene: Scene;
        rootUrl: string;

        importOnlyMeshes: boolean;
        importMeshesNames?: string[];

        dummyNodes: Node[];
    }

    /**
    * Bones
    */
    export interface INodeToRoot {
        bone: Bone;
        node: IGLTFNode;
        id: string;
    }

    export interface IJointNode {
        node: IGLTFNode;
        id: string;
    }
}
