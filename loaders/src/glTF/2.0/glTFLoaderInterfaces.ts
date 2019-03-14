import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { Bone } from "babylonjs/Bones/bone";
import { Skeleton } from "babylonjs/Bones/skeleton";
import { Material } from "babylonjs/Materials/material";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Buffer, VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Mesh } from "babylonjs/Meshes/mesh";

import * as IGLTF2 from "babylonjs-gltf2interface";

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
export interface IMaterialNormalTextureInfo extends IGLTF2.IMaterialNormalTextureInfo, ITextureInfo {
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialOcclusionTextureInfo extends IGLTF2.IMaterialOcclusionTextureInfo, ITextureInfo {
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
    _data?: {
        [babylonDrawMode: number]: {
            babylonMaterial: Material;
            babylonMeshes: AbstractMesh[];
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
    /** @hidden */
    _instanceData?: {
        babylonSourceMesh: Mesh;
        promise: Promise<any>;
    };
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
    _babylonTransformNode?: TransformNode;

    /** @hidden */
    _primitiveBabylonMeshes?: AbstractMesh[];

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
    _data?: {
        babylonSkeleton: Skeleton;
        promise: Promise<void>;
    };
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
