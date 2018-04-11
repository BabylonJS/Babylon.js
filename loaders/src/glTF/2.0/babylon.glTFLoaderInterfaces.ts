/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
    /** @ignore */
    export interface _ILoaderAccessor extends IAccessor, _IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonVertexBuffer?: Promise<VertexBuffer>;
    }

    /** @ignore */
    export interface _ILoaderAnimationChannel extends IAnimationChannel, _IArrayItem {
    }

    /** @ignore */
    export interface _ILoaderAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }

    /** @ignore */
    export interface _ILoaderAnimationSampler extends IAnimationSampler, _IArrayItem {
        _data: Promise<_ILoaderAnimationSamplerData>;
    }

    /** @ignore */
    export interface _ILoaderAnimation extends IAnimation, _IArrayItem {
        channels: _ILoaderAnimationChannel[];
        samplers: _ILoaderAnimationSampler[];

        _babylonAnimationGroup?: AnimationGroup;
    }

    /** @ignore */
    export interface _ILoaderBuffer extends IBuffer, _IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }

    /** @ignore */
    export interface _ILoaderBufferView extends IBufferView, _IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonBuffer?: Promise<Buffer>;
    }

    /** @ignore */
    export interface _ILoaderCamera extends ICamera, _IArrayItem {
    }

    /** @ignore */
    export interface _ILoaderImage extends IImage, _IArrayItem {
        _objectURL?: Promise<string>;
    }

    /** @ignore */
    export interface _ILoaderMaterial extends IMaterial, _IArrayItem {
        _babylonData?: {
            [drawMode: number]: {
                material: Material;
                meshes: AbstractMesh[];
                loaded: Promise<void>;
            }
        };
    }

    /** @ignore */
    export interface _ILoaderMesh extends IMesh, _IArrayItem {
        primitives: _ILoaderMeshPrimitive[];
    }

    /** @ignore */
    export interface _ILoaderMeshPrimitive extends IMeshPrimitive, _IArrayItem {
    }

    /** @ignore */
    export interface _ILoaderNode extends INode, _IArrayItem {
        _parent: _ILoaderNode;
        _babylonMesh?: Mesh;
        _primitiveBabylonMeshes?: Mesh[];
        _babylonAnimationTargets?: Node[];
        _numMorphTargets?: number;
    }

    /** @ignore */
    export interface _ILoaderSamplerData {
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }

    /** @ignore */
    export interface _ILoaderSampler extends ISampler, _IArrayItem {
        _data?: _ILoaderSamplerData;
    }

    /** @ignore */
    export interface _ILoaderScene extends IScene, _IArrayItem {
    }

    /** @ignore */
    export interface _ILoaderSkin extends ISkin, _IArrayItem {
        _babylonSkeleton?: Skeleton;
        _loaded?: Promise<void>;
    }

    /** @ignore */
    export interface _ILoaderTexture extends ITexture, _IArrayItem {
    }

    /** @ignore */
    export interface _ILoaderGLTF extends IGLTF {
        accessors?: _ILoaderAccessor[];
        animations?: _ILoaderAnimation[];
        buffers?: _ILoaderBuffer[];
        bufferViews?: _ILoaderBufferView[];
        cameras?: _ILoaderCamera[];
        images?: _ILoaderImage[];
        materials?: _ILoaderMaterial[];
        meshes?: _ILoaderMesh[];
        nodes?: _ILoaderNode[];
        samplers?: _ILoaderSampler[];
        scenes?: _ILoaderScene[];
        skins?: _ILoaderSkin[];
        textures?: _ILoaderTexture[];
    }
}
