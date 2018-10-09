import { VertexBuffer, Buffer, AnimationGroup, Material, AbstractMesh, Mesh, Bone, Skeleton } from "babylonjs";
import { AnimationSamplerInterpolation, ITexture, ITextureInfo, IGLTF, ISampler, IScene, ISkin, IMesh, IMeshPrimitive, INode, IAccessor, IAnimationChannel, IAnimationSampler, IAnimation, IBuffer, IBufferView, ICamera, IImage, IMaterialNormalTextureInfo, IMaterialOcclusionTextureInfo, IMaterialPbrMetallicRoughness, IMaterial } from "babylonjs-gltf2interface";

export var toto1 = 0;

/**
 * Loader interface with an index field.
 */
export interface IArrayItemV2 {
    /**
     * The index of this item in the array.
     */
    index: number;
}

/**
 * Loader interface with additional members.
 */
export interface IAccessorV2 extends IAccessor, IArrayItemV2 {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;

    /** @hidden */
    _babylonVertexBuffer?: Promise<VertexBuffer>;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimationChannelV2 extends IAnimationChannel, IArrayItemV2 {
}

/** @hidden */
export interface _IAnimationSamplerDataV2 {
    input: Float32Array;
    interpolation: AnimationSamplerInterpolation;
    output: Float32Array;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimationSamplerV2 extends IAnimationSampler, IArrayItemV2 {
    /** @hidden */
    _data?: Promise<_IAnimationSamplerDataV2>;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimationV2 extends IAnimation, IArrayItemV2 {
    channels: IAnimationChannelV2[];
    samplers: IAnimationSamplerV2[];

    /** @hidden */
    _babylonAnimationGroup?: AnimationGroup;
}

/**
 * Loader interface with additional members.
 */
export interface IBufferV2 extends IBuffer, IArrayItemV2 {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;
}

/**
 * Loader interface with additional members.
 */
export interface IBufferViewV2 extends IBufferView, IArrayItemV2 {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;

    /** @hidden */
    _babylonBuffer?: Promise<Buffer>;
}

/**
 * Loader interface with additional members.
 */
export interface ICameraV2 extends ICamera, IArrayItemV2 {
}

/**
 * Loader interface with additional members.
 */
export interface IImageV2 extends IImage, IArrayItemV2 {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialNormalTextureInfoV2 extends IMaterialNormalTextureInfo, ITextureInfo {
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialOcclusionTextureInfoV2 extends IMaterialOcclusionTextureInfo, ITextureInfo {
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialPbrMetallicRoughnessV2 extends IMaterialPbrMetallicRoughness {
    baseColorTexture?: ITextureInfoV2;
    metallicRoughnessTexture?: ITextureInfoV2;
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialV2 extends IMaterial, IArrayItemV2 {
    pbrMetallicRoughness?: IMaterialPbrMetallicRoughnessV2;
    normalTexture?: IMaterialNormalTextureInfoV2;
    occlusionTexture?: IMaterialOcclusionTextureInfoV2;
    emissiveTexture?: ITextureInfoV2;

    /** @hidden */
    _babylonData?: {
        [drawMode: number]: {
            material: Material;
            meshes: AbstractMesh[];
            promise: Promise<void>;
        }
    };
}

/**
 * Loader interface with additional members.
 */
export interface IMeshV2 extends IMesh, IArrayItemV2 {
    primitives: IMeshPrimitiveV2[];
}

/**
 * Loader interface with additional members.
 */
export interface IMeshPrimitiveV2 extends IMeshPrimitive, IArrayItemV2 {
}

/**
 * Loader interface with additional members.
 */
export interface INodeV2 extends INode, IArrayItemV2 {
    /**
     * The parent glTF node.
     */
    parent?: INodeV2;

    /** @hidden */
    _babylonMesh?: Mesh;

    /** @hidden */
    _primitiveBabylonMeshes?: Mesh[];

    /** @hidden */
    _babylonBones?: Bone[];

    /** @hidden */
    _numMorphTargets?: number;
}

/** @hidden */
export interface _ISamplerDataV2 {
    noMipMaps: boolean;
    samplingMode: number;
    wrapU: number;
    wrapV: number;
}

/**
 * Loader interface with additional members.
 */
export interface ISamplerV2 extends ISampler, IArrayItemV2 {
    /** @hidden */
    _data?: _ISamplerDataV2;
}

/**
 * Loader interface with additional members.
 */
export interface ISceneV2 extends IScene, IArrayItemV2 {
}

/**
 * Loader interface with additional members.
 */
export interface ISkinV2 extends ISkin, IArrayItemV2 {
    /** @hidden */
    _babylonSkeleton?: Skeleton;

    /** @hidden */
    _promise?: Promise<void>;
}

/**
 * Loader interface with additional members.
 */
export interface ITextureV2 extends ITexture, IArrayItemV2 {
}

/**
 * Loader interface with additional members.
 */
export interface ITextureInfoV2 extends ITextureInfo {
}

/**
 * Loader interface with additional members.
 */
export interface IGLTFV2 extends IGLTF {
    accessors?: IAccessorV2[];
    animations?: IAnimationV2[];
    buffers?: IBufferV2[];
    bufferViews?: IBufferViewV2[];
    cameras?: ICameraV2[];
    images?: IImageV2[];
    materials?: IMaterialV2[];
    meshes?: IMeshV2[];
    nodes?: INodeV2[];
    samplers?: ISamplerV2[];
    scenes?: ISceneV2[];
    skins?: ISkinV2[];
    textures?: ITextureV2[];
}
