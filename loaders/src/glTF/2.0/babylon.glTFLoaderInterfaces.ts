/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
    export interface ILoaderAccessor extends IAccessor, IArrayItem {
        _data?: Promise<TypedArray>;
    }

    export interface ILoaderAnimationChannel extends IAnimationChannel, IArrayItem {
        _babylonAnimationGroup: AnimationGroup;
    }

    export interface ILoaderAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }

    export interface ILoaderAnimationSampler extends IAnimationSampler, IArrayItem {
        _data: Promise<ILoaderAnimationSamplerData>;
    }

    export interface ILoaderAnimation extends IAnimation, IArrayItem {
        channels: ILoaderAnimationChannel[];
        samplers: ILoaderAnimationSampler[];

        _babylonAnimationGroup: Nullable<AnimationGroup>;
    }

    export interface ILoaderBuffer extends IBuffer, IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }

    export interface ILoaderBufferView extends IBufferView, IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }

    export interface ILoaderCamera extends ICamera, IArrayItem {
    }

    export interface ILoaderImage extends IImage, IArrayItem {
        _objectURL?: Promise<string>;
    }

    export interface ILoaderMaterial extends IMaterial, IArrayItem {
        _babylonMaterial?: Material;
        _babylonMeshes?: AbstractMesh[];
        _loaded?: Promise<void>;
    }

    export interface ILoaderMesh extends IMesh, IArrayItem {
        primitives: ILoaderMeshPrimitive[];
    }

    export interface ILoaderMeshPrimitive extends IMeshPrimitive, IArrayItem {
    }

    export interface ILoaderNode extends INode, IArrayItem {
        _parent: ILoaderNode;
        _babylonMesh?: Mesh;
        _primitiveBabylonMeshes?: Mesh[];
        _babylonAnimationTargets?: Node[];
        _numMorphTargets?: number;
    }

    export interface ILoaderSamplerData {
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }

    export interface ILoaderSampler extends ISampler, IArrayItem {
        _data?: ILoaderSamplerData;
    }

    export interface ILoaderScene extends IScene, IArrayItem {
    }

    export interface ILoaderSkin extends ISkin, IArrayItem {
        _babylonSkeleton: Nullable<Skeleton>;
        _loaded?: Promise<void>;
    }

    export interface ILoaderTexture extends ITexture, IArrayItem {
    }

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
