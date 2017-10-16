/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /**
    * Enums
    */
    export enum EComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        UNSIGNED_INT = 5125,
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

    export enum ETextureMagFilter {
        NEAREST = 9728,
        LINEAR = 9729,
    }

    export enum ETextureMinFilter {
        NEAREST = 9728,
        LINEAR = 9729,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987
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
        extensions?: { [key: string]: any };
        extras?: any;
    }

    export interface IGLTFChildRootProperty extends IGLTFProperty {
        name?: string;
    }

    export interface IGLTFAccessorSparseIndices extends IGLTFProperty {
        bufferView: number;
        byteOffset?: number;
        componentType: EComponentType;
    }

    export interface IGLTFAccessorSparseValues extends IGLTFProperty {
        bufferView: number;
        byteOffset?: number;
    }

    export interface IGLTFAccessorSparse extends IGLTFProperty {
        count: number;
        indices: IGLTFAccessorSparseIndices;
        values: IGLTFAccessorSparseValues;
    }

    export interface IGLTFAccessor extends IGLTFChildRootProperty {
        bufferView?: number;
        byteOffset?: number;
        componentType: EComponentType;
        normalized?: boolean;
        count: number;
        type: string;
        max: number[];
        min: number[];
        sparse?: IGLTFAccessorSparse;

        // Runtime values
        index?: number;
    }

    export interface IGLTFAnimationChannel extends IGLTFProperty {
        sampler: number;
        target: IGLTFAnimationChannelTarget;
    }

    export interface IGLTFAnimationChannelTarget extends IGLTFProperty {
        node: number;
        path: string;
    }

    export interface IGLTFAnimationSampler extends IGLTFProperty {
        input: number;
        interpolation?: string;
        output: number;
    }

    export interface IGLTFAnimation extends IGLTFChildRootProperty {
        channels: IGLTFAnimationChannel[];
        samplers: IGLTFAnimationSampler[];

        // Runtime values
        index?: number;
        targets?: any[];
    }

    export interface IGLTFAsset extends IGLTFChildRootProperty {
        copyright?: string;
        generator?: string;
        version: string;
        minVersion?: string;
    }

    export interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri?: string;
        byteLength: number;

        // Runtime values
        index?: number;
        loadedData?: ArrayBufferView;
        loadedObservable?: Observable<IGLTFBuffer>;
    }

    export interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
        byteStride?: number;

        // Runtime values
        index?: number;
    }

    export interface IGLTFCameraOrthographic extends IGLTFProperty {
        xmag: number;
        ymag: number;
        zfar: number;
        znear: number;
    }

    export interface IGLTFCameraPerspective extends IGLTFProperty {
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

        // Runtime values
        index?: number;
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
        alphaMode?: string;
        alphaCutoff: number;
        doubleSided?: boolean;

        // Runtime values
        index?: number;
        babylonMaterial?: Material;
    }

    export interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: { [name: string]: number };
        indices?: number;
        material?: number;
        mode?: EMeshPrimitiveMode;
        targets?: { [name: string]: number }[];

        // Runtime values
        vertexData: VertexData;
        targetsVertexData: VertexData[];
    }

    export interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
        weights?: number[];

        // Runtime values
        index?: number;
    }

    export interface IGLTFNode extends IGLTFChildRootProperty {
        camera?: number;
        children?: number[];
        skin?: number;
        matrix?: number[];
        mesh?: number;
        rotation?: number[];
        scale?: number[];
        translation?: number[];
        weights?: number[];

        // Runtime values
        index?: number;
        parent?: IGLTFNode;
        babylonMesh?: Mesh;
        babylonBones?: { [skin: number]: Bone };
        babylonAnimationTargets?: Node[];
    }

    export interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: ETextureMagFilter;
        minFilter?: ETextureMinFilter;
        wrapS?: ETextureWrapMode;
        wrapT?: ETextureWrapMode;
    }

    export interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: number[];

        // Runtime values
        index?: number;
    }

    export interface IGLTFSkin extends IGLTFChildRootProperty {
        inverseBindMatrices?: number;
        skeleton?: number;
        joints: number[];

        // Runtime values
        index?: number;
        babylonSkeleton?: Skeleton;
    }

    export interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler?: number;
        source: number;

        // Runtime values
        index?: number;
        url?: string;
        dataReadyObservable?: Observable<IGLTFTexture>;
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
}
