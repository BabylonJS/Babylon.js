import { VertexBuffer, Buffer, AnimationGroup, Material, AbstractMesh, Mesh, Bone, Skeleton } from "babylonjs";
import * as IGLTF2 from "babylonjs-gltf2interface";

/** @hidden */
export var __IGLTFLoaderInterfacesV2 = 0; // I am here to allow dts to be created

/**
 * Loader interface with an index field.
 */
export interface IArrayItem {
    /**
     * The index of this item in the array.
     */
    index: number;
}

/**
 * Loader interface with additional members.
 */
export interface IAccessor extends IGLTF2.IAccessor, IArrayItem {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;

    /** @hidden */
    _babylonVertexBuffer?: Promise<VertexBuffer>;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimationChannel extends IGLTF2.IAnimationChannel, IArrayItem {
}

/** @hidden */
export interface _IAnimationSamplerData {
    input: Float32Array;
    interpolation: IGLTF2.AnimationSamplerInterpolation;
    output: Float32Array;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimationSampler extends IGLTF2.IAnimationSampler, IArrayItem {
    /** @hidden */
    _data?: Promise<_IAnimationSamplerData>;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimation extends IGLTF2.IAnimation, IArrayItem {
    channels: IAnimationChannel[];
    samplers: IAnimationSampler[];

    /** @hidden */
    _babylonAnimationGroup?: AnimationGroup;
}

/**
 * Loader interface with additional members.
 */
export interface IBuffer extends IGLTF2.IBuffer, IArrayItem {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;
}

/**
 * Loader interface with additional members.
 */
export interface IBufferView extends IGLTF2.IBufferView, IArrayItem {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;

    /** @hidden */
    _babylonBuffer?: Promise<Buffer>;
}

/**
 * Loader interface with additional members.
 */
export interface ICamera extends IGLTF2.ICamera, IArrayItem {
}

/**
 * Loader interface with additional members.
 */
export interface IImage extends IGLTF2.IImage, IArrayItem {
    /** @hidden */
    _data?: Promise<ArrayBufferView>;
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialNormalTextureInfo extends IGLTF2.IMaterialNormalTextureInfo, IGLTF2.ITextureInfo {
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialOcclusionTextureInfo extends IGLTF2.IMaterialOcclusionTextureInfo, IGLTF2.ITextureInfo {
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialPbrMetallicRoughness extends IGLTF2.IMaterialPbrMetallicRoughness {
    baseColorTexture?: ITextureInfo;
    metallicRoughnessTexture?: ITextureInfo;
}

/**
 * Loader interface with additional members.
 */
export interface IMaterial extends IGLTF2.IMaterial, IArrayItem {
    pbrMetallicRoughness?: IMaterialPbrMetallicRoughness;
    normalTexture?: IMaterialNormalTextureInfo;
    occlusionTexture?: IMaterialOcclusionTextureInfo;
    emissiveTexture?: ITextureInfo;

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
export interface IMesh extends IGLTF2.IMesh, IArrayItem {
    primitives: IMeshPrimitive[];
}

/**
 * Loader interface with additional members.
 */
export interface IMeshPrimitive extends IGLTF2.IMeshPrimitive, IArrayItem {
}

/**
 * Loader interface with additional members.
 */
export interface INode extends IGLTF2.INode, IArrayItem {
    /**
     * The parent glTF node.
     */
    parent?: INode;

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
export interface _ISamplerData {
    noMipMaps: boolean;
    samplingMode: number;
    wrapU: number;
    wrapV: number;
}

/**
 * Loader interface with additional members.
 */
export interface ISampler extends IGLTF2.ISampler, IArrayItem {
    /** @hidden */
    _data?: _ISamplerData;
}

/**
 * Loader interface with additional members.
 */
export interface IScene extends IGLTF2.IScene, IArrayItem {
}

/**
 * Loader interface with additional members.
 */
export interface ISkin extends IGLTF2.ISkin, IArrayItem {
    /** @hidden */
    _babylonSkeleton?: Skeleton;

    /** @hidden */
    _promise?: Promise<void>;
}

/**
 * Loader interface with additional members.
 */
export interface ITexture extends IGLTF2.ITexture, IArrayItem {
}

/**
 * Loader interface with additional members.
 */
export interface ITextureInfo extends IGLTF2.ITextureInfo {
}

/**
 * Loader interface with additional members.
 */
export interface IGLTF extends IGLTF2.IGLTF {
    accessors?: IAccessor[];
    animations?: IAnimation[];
    buffers?: IBuffer[];
    bufferViews?: IBufferView[];
    cameras?: ICamera[];
    images?: IImage[];
    materials?: IMaterial[];
    meshes?: IMesh[];
    nodes?: INode[];
    samplers?: ISampler[];
    scenes?: IScene[];
    skins?: ISkin[];
    textures?: ITexture[];
}
