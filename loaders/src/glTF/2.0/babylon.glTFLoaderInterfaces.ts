/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
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
    export interface ILoaderAccessor extends IAccessor, IArrayItem {
        /** @hidden */
        _data?: Promise<ArrayBufferView>;

        /** @hidden */
        _babylonVertexBuffer?: Promise<VertexBuffer>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderAnimationChannel extends IAnimationChannel, IArrayItem {
    }

    /** @hidden */
    export interface _ILoaderAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderAnimationSampler extends IAnimationSampler, IArrayItem {
        /** @hidden */
        _data?: Promise<_ILoaderAnimationSamplerData>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderAnimation extends IAnimation, IArrayItem {
        channels: ILoaderAnimationChannel[];
        samplers: ILoaderAnimationSampler[];

        /** @hidden */
        _babylonAnimationGroup?: AnimationGroup;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderBuffer extends IBuffer, IArrayItem {
        /** @hidden */
        _data?: Promise<ArrayBufferView>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderBufferView extends IBufferView, IArrayItem {
        /** @hidden */
        _data?: Promise<ArrayBufferView>;

        /** @hidden */
        _babylonBuffer?: Promise<Buffer>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderCamera extends ICamera, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderImage extends IImage, IArrayItem {
        /** @hidden */
        _data?: Promise<ArrayBufferView>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderMaterialNormalTextureInfo extends IMaterialNormalTextureInfo, ILoaderTextureInfo {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderMaterialOcclusionTextureInfo extends IMaterialOcclusionTextureInfo, ILoaderTextureInfo {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderMaterialPbrMetallicRoughness extends IMaterialPbrMetallicRoughness {
        baseColorTexture?: ILoaderTextureInfo;
        metallicRoughnessTexture?: ILoaderTextureInfo;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderMaterial extends IMaterial, IArrayItem {
        pbrMetallicRoughness?: ILoaderMaterialPbrMetallicRoughness;
        normalTexture?: ILoaderMaterialNormalTextureInfo;
        occlusionTexture?: ILoaderMaterialOcclusionTextureInfo;
        emissiveTexture?: ILoaderTextureInfo;

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
    export interface ILoaderMesh extends IMesh, IArrayItem {
        primitives: ILoaderMeshPrimitive[];
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderMeshPrimitive extends IMeshPrimitive, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderNode extends INode, IArrayItem {
        /**
         * The parent glTF node.
         */
        parent?: ILoaderNode;

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
    export interface _ILoaderSamplerData {
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderSampler extends ISampler, IArrayItem {
        /** @hidden */
        _data?: _ILoaderSamplerData;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderScene extends IScene, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderSkin extends ISkin, IArrayItem {
        /** @hidden */
        _babylonSkeleton?: Skeleton;

        /** @hidden */
        _promise?: Promise<void>;
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderTexture extends ITexture, IArrayItem {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderTextureInfo extends ITextureInfo {
    }

    /**
     * Loader interface with additional members.
     */
    export interface ILoaderGLTF extends IGLTF {
        accessors?: ILoaderAccessor[];
        animations?: ILoaderAnimation[];
        buffers?: ILoaderBuffer[];
        bufferViews?: ILoaderBufferView[];
        cameras?: ILoaderCamera[];
        images?: ILoaderImage[];
        materials?: ILoaderMaterial[];
        meshes?: ILoaderMesh[];
        nodes?: ILoaderNode[];
        samplers?: ILoaderSampler[];
        scenes?: ILoaderScene[];
        skins?: ILoaderSkin[];
        textures?: ILoaderTexture[];
    }
}
