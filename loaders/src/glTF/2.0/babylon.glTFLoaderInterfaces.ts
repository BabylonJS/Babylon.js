﻿/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Loader {
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
        /** @hidden */
        _data?: Promise<ArrayBufferView>;

        /** @hidden */
        _babylonVertexBuffer?: Promise<VertexBuffer>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface IAnimationChannel extends GLTF2.IAnimationChannel, IArrayItem {
    }

    /** @hidden */
    export interface _IAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }

    /**
     * Loader interface with additional members.
     */
    export interface IAnimationSampler extends GLTF2.IAnimationSampler, IArrayItem {
        /** @hidden */
        _data?: Promise<_IAnimationSamplerData>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface IAnimation extends GLTF2.IAnimation, IArrayItem {
        channels: IAnimationChannel[];
        samplers: IAnimationSampler[];

        /** @hidden */
        _babylonAnimationGroup?: AnimationGroup;
    }

    /**
     * Loader interface with additional members.
     */
    export interface IBuffer extends GLTF2.IBuffer, IArrayItem {
        /** @hidden */
        _data?: Promise<ArrayBufferView>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface IBufferView extends GLTF2.IBufferView, IArrayItem {
        /** @hidden */
        _data?: Promise<ArrayBufferView>;

        /** @hidden */
        _babylonBuffer?: Promise<Buffer>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ICamera extends GLTF2.ICamera, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface IImage extends GLTF2.IImage, IArrayItem {
        /** @hidden */
        _data?: Promise<ArrayBufferView>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface IMaterialNormalTextureInfo extends GLTF2.IMaterialNormalTextureInfo, ITextureInfo {
    }

    /**
     * Loader interface with additional members.
     */
    export interface IMaterialOcclusionTextureInfo extends GLTF2.IMaterialOcclusionTextureInfo, ITextureInfo {
    }

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
    export interface IMesh extends GLTF2.IMesh, IArrayItem {
        primitives: IMeshPrimitive[];
    }

    /**
     * Loader interface with additional members.
     */
    export interface IMeshPrimitive extends GLTF2.IMeshPrimitive, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface INode extends GLTF2.INode, IArrayItem {
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
    export interface ISampler extends GLTF2.ISampler, IArrayItem {
        /** @hidden */
        _data?: _ISamplerData;
    }

    /**
     * Loader interface with additional members.
     */
    export interface IScene extends GLTF2.IScene, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ISkin extends GLTF2.ISkin, IArrayItem {
        /** @hidden */
        _babylonSkeleton?: Skeleton;

        /** @hidden */
        _promise?: Promise<void>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ITexture extends GLTF2.ITexture, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ITextureInfo extends GLTF2.ITextureInfo {
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
}
