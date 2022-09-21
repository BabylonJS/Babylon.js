import type { AnimationGroup } from "core/Animations/animationGroup";
import type { Skeleton } from "core/Bones/skeleton";
import type { Material } from "core/Materials/material";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Buffer, VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Mesh } from "core/Meshes/mesh";
import type { Camera } from "core/Cameras/camera";
import type { Light } from "core/Lights/light";

import type * as GLTF2 from "babylonjs-gltf2interface";

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
export interface IAccessor extends GLTF2.IAccessor, IArrayItem {
    /** @internal */
    _data?: Promise<ArrayBufferView>;

    /** @internal */
    _babylonVertexBuffer?: { [kind: string]: Promise<VertexBuffer> };
}

/**
 * Loader interface with additional members.
 */
export interface IAnimationChannel extends GLTF2.IAnimationChannel, IArrayItem {}

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface _IAnimationSamplerData {
    input: Float32Array;
    interpolation: GLTF2.AnimationSamplerInterpolation;
    output: Float32Array;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimationSampler extends GLTF2.IAnimationSampler, IArrayItem {
    /** @internal */
    _data?: Promise<_IAnimationSamplerData>;
}

/**
 * Loader interface with additional members.
 */
export interface IAnimation extends GLTF2.IAnimation, IArrayItem {
    channels: IAnimationChannel[];
    samplers: IAnimationSampler[];

    /** @internal */
    _babylonAnimationGroup?: AnimationGroup;
}

/**
 * Loader interface with additional members.
 */
export interface IBuffer extends GLTF2.IBuffer, IArrayItem {
    /** @internal */
    _data?: Promise<ArrayBufferView>;
}

/**
 * Loader interface with additional members.
 */
export interface IBufferView extends GLTF2.IBufferView, IArrayItem {
    /** @internal */
    _data?: Promise<ArrayBufferView>;

    /** @internal */
    _babylonBuffer?: Promise<Buffer>;
}

/**
 * Loader interface with additional members.
 */
export interface IKHRLight extends GLTF2.IKHRLightsPunctual_Light {
    /** @internal */
    _babylonLight: Light;
}

/**
 * Loader interface with additional members.
 */
export interface ICamera extends GLTF2.ICamera, IArrayItem {
    /** @internal */
    _babylonCamera: Camera;
}

/**
 * Loader interface with additional members.
 */
export interface IImage extends GLTF2.IImage, IArrayItem {
    /** @internal */
    _data?: Promise<ArrayBufferView>;
}

/**
 * Loader interface with additional members.
 */
export interface IMaterialNormalTextureInfo extends GLTF2.IMaterialNormalTextureInfo, ITextureInfo {}

/**
 * Loader interface with additional members.
 */
export interface IMaterialOcclusionTextureInfo extends GLTF2.IMaterialOcclusionTextureInfo, ITextureInfo {}

/**
 * Loader interface with additional members.
 */
export interface IMaterialPbrMetallicRoughness extends GLTF2.IMaterialPbrMetallicRoughness {
    baseColorTexture?: ITextureInfo;
    metallicRoughnessTexture?: ITextureInfo;
}

/**
 * Loader interface with additional members.
 */
export interface IMaterial extends GLTF2.IMaterial, IArrayItem {
    pbrMetallicRoughness?: IMaterialPbrMetallicRoughness;
    normalTexture?: IMaterialNormalTextureInfo;
    occlusionTexture?: IMaterialOcclusionTextureInfo;
    emissiveTexture?: ITextureInfo;

    /** @internal */
    _data?: {
        [babylonDrawMode: number]: {
            babylonMaterial: Material;
            babylonMeshes: AbstractMesh[];
            promise: Promise<void>;
        };
    };
}

/**
 * Loader interface with additional members.
 */
export interface IMesh extends GLTF2.IMesh, IArrayItem {
    primitives: IMeshPrimitive[];
}

/**
 * Loader interface with additional members.
 */
export interface IMeshPrimitive extends GLTF2.IMeshPrimitive, IArrayItem {
    /** @internal */
    _instanceData?: {
        babylonSourceMesh: Mesh;
        promise: Promise<any>;
    };
}

/**
 * Loader interface with additional members.
 */
export interface INode extends GLTF2.INode, IArrayItem {
    /**
     * The parent glTF node.
     */
    parent?: INode;

    /** @internal */
    _babylonTransformNode?: TransformNode;

    /** @internal */
    _babylonTransformNodeForSkin?: TransformNode;

    /** @internal */
    _primitiveBabylonMeshes?: AbstractMesh[];

    /** @internal */
    _numMorphTargets?: number;
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface _ISamplerData {
    noMipMaps: boolean;
    samplingMode: number;
    wrapU: number;
    wrapV: number;
}

/**
 * Loader interface with additional members.
 */
export interface ISampler extends GLTF2.ISampler, IArrayItem {
    /** @internal */
    _data?: _ISamplerData;
}

/**
 * Loader interface with additional members.
 */
export interface IScene extends GLTF2.IScene, IArrayItem {}

/**
 * Loader interface with additional members.
 */
export interface ISkin extends GLTF2.ISkin, IArrayItem {
    /** @internal */
    _data?: {
        babylonSkeleton: Skeleton;
        promise: Promise<void>;
    };
}

/**
 * Loader interface with additional members.
 */
export interface ITexture extends GLTF2.ITexture, IArrayItem {
    /** @internal */
    _textureInfo: ITextureInfo;
}

/**
 * Loader interface with additional members.
 */
export interface ITextureInfo extends GLTF2.ITextureInfo {
    /** false or undefined if the texture holds color data (true if data are roughness, normal, ...) */
    nonColorData?: boolean;
}

/**
 * Loader interface with additional members.
 */
export interface IGLTF extends GLTF2.IGLTF {
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
