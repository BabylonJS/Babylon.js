/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

/**
 * GLTF2 module for babylon
 */
module BABYLON.GLTF2 {
    /**
     * Interface to access data and vertex buffer associated with a file
     */
    export interface ILoaderAccessor extends IAccessor, IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonVertexBuffer?: Promise<VertexBuffer>;
    }

    /**
     * Loader's animation channel
     */
    export interface ILoaderAnimationChannel extends IAnimationChannel, IArrayItem {
    }

    /**
     * Container for animation keyframe data
     */
    export interface ILoaderAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }

    /**
     * Keyframe data
     */
    export interface ILoaderAnimationSampler extends IAnimationSampler, IArrayItem {
        _data: Promise<ILoaderAnimationSamplerData>;
    }

    /**
     * Loader animation
     */
    export interface ILoaderAnimation extends IAnimation, IArrayItem {
        channels: ILoaderAnimationChannel[];
        samplers: ILoaderAnimationSampler[];

        _babylonAnimationGroup?: AnimationGroup;
    }

    /**
     * Loader buffer
     */
    export interface ILoaderBuffer extends IBuffer, IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }

    /**
     * Loader's buffer data
     */
    export interface ILoaderBufferView extends IBufferView, IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonBuffer?: Promise<Buffer>;
    }

    /**
     * Loader's loaded camera data
     */
    export interface ILoaderCamera extends ICamera, IArrayItem {
    }

    /**
     * Loaded image specified by url
     */
    export interface ILoaderImage extends IImage, IArrayItem {
        _objectURL?: Promise<string>;
    }

    /**
     * Loaded material data
     */
    export interface ILoaderMaterial extends IMaterial, IArrayItem {
        _babylonData?: {
            [drawMode: number]: {
                material: Material;
                meshes: AbstractMesh[];
                loaded: Promise<void>;
            }
        };
    }

    /**
     * Loader mesh data
     */
    export interface ILoaderMesh extends IMesh, IArrayItem {
        primitives: ILoaderMeshPrimitive[];
    }

    /**
     * Loader mesh data
     */
    export interface ILoaderMeshPrimitive extends IMeshPrimitive, IArrayItem {
    }

    /**
     * Node for traversing loader data
     */
    export interface ILoaderNode extends INode, IArrayItem {
        _parent: ILoaderNode;
        _babylonMesh?: Mesh;
        _primitiveBabylonMeshes?: Mesh[];
        _babylonAnimationTargets?: Node[];
        _numMorphTargets?: number;
    }

    /**
     * Sampler data
     */
    export interface ILoaderSamplerData {
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }

    /**
     * Sampler data
     */
    export interface ILoaderSampler extends ISampler, IArrayItem {
        _data?: ILoaderSamplerData;
    }

    /**
     * Loader's scene
     */
    export interface ILoaderScene extends IScene, IArrayItem {
    }

    /**
     * Loader's skeleton data
     */
    export interface ILoaderSkin extends ISkin, IArrayItem {
        _babylonSkeleton?: Skeleton;
        _loaded?: Promise<void>;
    }

    /**
     * Loader's texture
     */
    export interface ILoaderTexture extends ITexture, IArrayItem {
    }

    /**
     * Loaded GLTF data
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
