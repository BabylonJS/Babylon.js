/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    interface IGLTFLoaderData {
        json: Object;
        bin: ArrayBufferView;
    }
    interface IGLTFLoader {
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onsuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onerror: () => void) => void;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onsuccess: () => void, onerror: () => void) => void;
    }
    class GLTFFileLoader implements ISceneLoaderPluginAsync {
        static GLTFLoaderV1: IGLTFLoader;
        static GLTFLoaderV2: IGLTFLoader;
        static HomogeneousCoordinates: boolean;
        static IncrementalLoading: boolean;
        extensions: ISceneLoaderPluginExtensions;
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError: () => void): void;
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: () => void, onError: () => void): void;
        private static _parse(data);
        private _getLoader(loaderData);
        private static _parseBinary(data);
        private static _parseV1(binaryReader);
        private static _parseV2(binaryReader);
        private static _parseVersion(version);
        private static _compareVersion(a, b);
        private static _decodeBufferToText(view);
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    /**
    * Enums
    */
    enum EComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        UNSIGNED_INT = 5125,
        FLOAT = 5126,
    }
    enum EMeshPrimitiveMode {
        POINTS = 0,
        LINES = 1,
        LINE_LOOP = 2,
        LINE_STRIP = 3,
        TRIANGLES = 4,
        TRIANGLE_STRIP = 5,
        TRIANGLE_FAN = 6,
    }
    enum ETextureMagFilter {
        NEAREST = 9728,
        LINEAR = 9729,
    }
    enum ETextureMinFilter {
        NEAREST = 9728,
        LINEAR = 9729,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987,
    }
    enum ETextureWrapMode {
        CLAMP_TO_EDGE = 33071,
        MIRRORED_REPEAT = 33648,
        REPEAT = 10497,
    }
    /**
    * Interfaces
    */
    interface IGLTFProperty {
        extensions?: Object;
        extras?: any;
    }
    interface IGLTFChildRootProperty extends IGLTFProperty {
        name?: string;
    }
    interface IGLTFAccessorSparseIndices extends IGLTFProperty {
        bufferView: number;
        byteOffset?: number;
        componentType: EComponentType;
    }
    interface IGLTFAccessorSparseValues extends IGLTFProperty {
        bufferView: number;
        byteOffset?: number;
    }
    interface IGLTFAccessorSparse extends IGLTFProperty {
        count: number;
        indices: IGLTFAccessorSparseIndices;
        values: IGLTFAccessorSparseValues;
    }
    interface IGLTFAccessor extends IGLTFChildRootProperty {
        bufferView?: number;
        byteOffset?: number;
        componentType: EComponentType;
        normalized?: boolean;
        count: number;
        type: string;
        max: number[];
        min: number[];
        sparse?: IGLTFAccessorSparse;
    }
    interface IGLTFAnimationChannel extends IGLTFProperty {
        sampler: number;
        target: IGLTFAnimationChannelTarget;
    }
    interface IGLTFAnimationChannelTarget extends IGLTFProperty {
        node: number;
        path: string;
    }
    interface IGLTFAnimationSampler extends IGLTFProperty {
        input: number;
        interpolation?: string;
        output: number;
    }
    interface IGLTFAnimation extends IGLTFChildRootProperty {
        channels: IGLTFAnimationChannel[];
        samplers: IGLTFAnimationSampler[];
    }
    interface IGLTFAssetProfile extends IGLTFProperty {
        api?: string;
        version?: string;
    }
    interface IGLTFAsset extends IGLTFChildRootProperty {
        copyright?: string;
        generator?: string;
        profile?: IGLTFAssetProfile;
        version: string;
    }
    interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri?: string;
        byteLength: number;
        loadedBufferView: ArrayBufferView;
    }
    interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
        byteStride?: number;
    }
    interface IGLTFCameraOrthographic extends IGLTFProperty {
        xmag: number;
        ymag: number;
        zfar: number;
        znear: number;
    }
    interface IGLTFCameraPerspective extends IGLTFProperty {
        aspectRatio: number;
        yfov: number;
        zfar: number;
        znear: number;
    }
    interface IGLTFCamera extends IGLTFChildRootProperty {
        orthographic?: IGLTFCameraOrthographic;
        perspective?: IGLTFCameraPerspective;
        type: string;
    }
    interface IGLTFImage extends IGLTFChildRootProperty {
        uri?: string;
        mimeType?: string;
        bufferView?: number;
    }
    interface IGLTFMaterialNormalTextureInfo extends IGLTFTextureInfo {
        scale: number;
    }
    interface IGLTFMaterialOcclusionTextureInfo extends IGLTFTextureInfo {
        strength: number;
    }
    interface IGLTFMaterialPbrMetallicRoughness {
        baseColorFactor: number[];
        baseColorTexture: IGLTFTextureInfo;
        metallicFactor: number;
        roughnessFactor: number;
        metallicRoughnessTexture: IGLTFTextureInfo;
    }
    interface IGLTFMaterial extends IGLTFChildRootProperty {
        pbrMetallicRoughness?: IGLTFMaterialPbrMetallicRoughness;
        normalTexture?: IGLTFMaterialNormalTextureInfo;
        occlusionTexture?: IGLTFMaterialOcclusionTextureInfo;
        emissiveTexture?: IGLTFTextureInfo;
        emissiveFactor?: number[];
        alphaMode?: string;
        alphaCutoff: number;
        doubleSided?: boolean;
        babylonMaterial?: PBRMaterial;
    }
    interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: {
            [name: string]: number;
        };
        indices?: number;
        material?: number;
        mode?: EMeshPrimitiveMode;
        targets?: [{
            [name: string]: number;
        }];
    }
    interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
        weights?: number[];
    }
    interface IGLTFNode extends IGLTFChildRootProperty {
        camera?: number;
        children?: number[];
        skin?: number;
        matrix?: number[];
        mesh?: number;
        rotation?: number[];
        scale?: number[];
        translation?: number[];
        weights?: number[];
        babylonNode?: Node;
    }
    interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: ETextureMagFilter;
        minFilter?: ETextureMinFilter;
        wrapS?: ETextureWrapMode;
        wrapT?: ETextureWrapMode;
    }
    interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: number[];
    }
    interface IGLTFSkin extends IGLTFChildRootProperty {
        inverseBindMatrices?: number;
        skeleton?: number;
        joints: number[];
        babylonSkeleton?: Skeleton;
    }
    interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler?: number;
        source: number;
        babylonTextures: Texture[];
        blobURL: string;
    }
    interface IGLTFTextureInfo {
        index: number;
        texCoord?: number;
    }
    interface IGLTF extends IGLTFProperty {
        accessors?: IGLTFAccessor[];
        animations?: IGLTFAnimation[];
        asset: IGLTFAsset;
        buffers?: IGLTFBuffer[];
        bufferViews?: IGLTFBufferView[];
        cameras?: IGLTFCamera[];
        extensionsUsed?: string[];
        extensionsRequired?: string[];
        glExtensionsUsed?: string[];
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
    interface IGLTFRuntime {
        gltf: IGLTF;
        babylonScene: Scene;
        rootUrl: string;
        importOnlyMeshes: boolean;
        importMeshesNames?: string[];
        defaultMaterial?: PBRMaterial;
    }
    /**
    * Bones
    */
    interface INodeToRoot {
        bone: Bone;
        node: IGLTFNode;
        index: number;
    }
    interface IJointNode {
        node: IGLTFNode;
        index: number;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    /**
    * glTF File Loader Plugin
    */
    class GLTFLoader implements IGLTFLoader {
        static Extensions: {
            [name: string]: GLTFLoaderExtension;
        };
        static RegisterExtension(extension: GLTFLoaderExtension): void;
        static LoadMaterial(runtime: IGLTFRuntime, index: number): IGLTFMaterial;
        static LoadMetallicRoughnessMaterialPropertiesAsync(runtime: IGLTFRuntime, material: IGLTFMaterial, onSuccess: () => void, onError: () => void): void;
        static LoadCommonMaterialPropertiesAsync(runtime: IGLTFRuntime, material: IGLTFMaterial, onSuccess: () => void, onError: () => void): void;
        static LoadAlphaProperties(runtime: IGLTFRuntime, material: IGLTFMaterial): void;
        static LoadTextureAsync(runtime: IGLTFRuntime, textureInfo: IGLTFTextureInfo, onSuccess: (babylonTexture: Texture) => void, onError: () => void): void;
        private static _createTextureAsync(runtime, texture, texCoord, url, onSuccess, onError);
        /**
        * Import meshes
        */
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError?: () => void): void;
        /**
        * Load scene
        */
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onError: () => void): void;
        private static _loadBuffersAsync(runtime, onSuccess, onError);
        private static _loadBufferAsync(runtime, index, onSuccess, onError);
        private static _loadMaterialsAsync(runtime, onSuccess, onError);
        private static _createRuntime(scene, data, rootUrl, importOnlyMeshes);
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    /**
    * Utils functions for GLTF
    */
    class GLTFUtils {
        /**
        * If the uri is a base64 string
        * @param uri: the uri to test
        */
        static IsBase64(uri: string): boolean;
        /**
        * Decode the base64 uri
        * @param uri: the uri to decode
        */
        static DecodeBase64(uri: string): ArrayBuffer;
        /**
        * Returns the wrap mode of the texture
        * @param mode: the mode value
        */
        static GetWrapMode(mode: number): number;
        /**
         * Returns the byte stride giving an accessor
         * @param accessor: the GLTF accessor objet
         */
        static GetByteStrideFromType(accessor: IGLTFAccessor): number;
        /**
         * Returns the texture filter mode giving a mode value
         * @param mode: the filter mode value
         */
        static GetTextureFilterMode(mode: number): ETextureMinFilter;
        static GetBufferFromBufferView(runtime: IGLTFRuntime, bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType): ArrayBufferView;
        /**
         * Returns a buffer from its accessor
         * @param runtime: the GLTF runtime
         * @param accessor: the GLTF accessor
         */
        static GetBufferFromAccessor(runtime: IGLTFRuntime, accessor: IGLTFAccessor): any;
        /**
         * Decodes a buffer view into a string
         * @param view: the buffer view
         */
        static DecodeBufferToText(view: ArrayBufferView): string;
        /**
         * Returns the default material of gltf.
         * @param scene: the Babylon.js scene
         */
        static GetDefaultMaterial(runtime: IGLTFRuntime): PBRMaterial;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    abstract class GLTFLoaderExtension {
        private _name;
        constructor(name: string);
        readonly name: string;
        protected postCreateRuntime(runtime: IGLTFRuntime): void;
        protected loadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): boolean;
        static PostCreateRuntime(runtime: IGLTFRuntime): void;
        static LoadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): void;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    class GLTFMaterialsPbrSpecularGlossinessExtension extends GLTFLoaderExtension {
        constructor();
        protected loadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): boolean;
    }
}
