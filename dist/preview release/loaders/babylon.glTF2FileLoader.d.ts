
declare module BABYLON {
    enum GLTFLoaderCoordinateSystemMode {
        AUTO = 0,
        PASS_THROUGH = 1,
        FORCE_RIGHT_HANDED = 2,
    }
    interface IGLTFLoaderData {
        json: Object;
        bin: ArrayBufferView;
    }
    interface IGLTFLoader {
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
    }
    class GLTFFileLoader implements ISceneLoaderPluginAsync {
        static CreateGLTFLoaderV1: (parent: GLTFFileLoader) => IGLTFLoader;
        static CreateGLTFLoaderV2: (parent: GLTFFileLoader) => IGLTFLoader;
        static HomogeneousCoordinates: boolean;
        static IncrementalLoading: boolean;
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        onTextureLoaded: (texture: BaseTexture) => void;
        onMaterialLoaded: (material: Material) => void;
        /**
         * Let the user decides if he needs to process the material (like precompilation) before affecting it to meshes
         */
        onBeforeMaterialReadyAsync: (material: Material, targetMesh: AbstractMesh, isLOD: boolean, callback: () => void) => void;
        /**
         * Raised when all LODs are complete (or if there is no LOD and model is complete)
         */
        onComplete: () => void;
        /**
         * Raised when first LOD complete (or if there is no LOD and model is complete)
         */
        onFirstLODComplete: () => void;
        name: string;
        extensions: ISceneLoaderPluginExtensions;
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        canDirectLoad(data: string): boolean;
        private static _parse(data, onError);
        private _getLoader(loaderData, onError);
        private static _parseBinary(data, onError);
        private static _parseV1(binaryReader, onError);
        private static _parseV2(binaryReader, onError);
        private static _parseVersion(version);
        private static _compareVersion(a, b);
        private static _decodeBufferToText(view);
    }
}


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
        targets?: any[];
    }
    interface IGLTFAsset extends IGLTFChildRootProperty {
        copyright?: string;
        generator?: string;
        version: string;
        minVersion?: string;
    }
    interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri?: string;
        byteLength: number;
        loadedData: ArrayBufferView;
        loadedObservable: Observable<IGLTFBuffer>;
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
        index?: number;
        babylonMaterial?: Material;
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
        index?: number;
        parent?: IGLTFNode;
        babylonMesh?: Mesh;
        babylonSkinToBones?: {
            [skin: number]: Bone;
        };
        babylonAnimationTargets?: Node[];
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
        index?: number;
        babylonSkeleton?: Skeleton;
    }
    interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler?: number;
        source: number;
        babylonTextures?: Texture[];
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
}


declare module BABYLON.GLTF2 {
    class GLTFLoader implements IGLTFLoader, IDisposable {
        private _parent;
        private _gltf;
        private _babylonScene;
        private _rootUrl;
        private _defaultMaterial;
        private _successCallback;
        private _progressCallback;
        private _errorCallback;
        private _renderReady;
        private _disposed;
        private _objectURLs;
        private _blockPendingTracking;
        private _nonBlockingData;
        private _renderReadyObservable;
        private _renderPendingCount;
        private _loaderPendingCount;
        static Extensions: {
            [name: string]: GLTFLoaderExtension;
        };
        static RegisterExtension(extension: GLTFLoaderExtension): void;
        readonly gltf: IGLTF;
        readonly babylonScene: Scene;
        executeWhenRenderReady(func: () => void): void;
        constructor(parent: GLTFFileLoader);
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        private _loadAsync(nodeNames, scene, data, rootUrl, onSuccess, onProgress, onError);
        private _onError(message);
        private _onProgress(event);
        private _onRenderReady();
        private _onLoaderComplete();
        private _onLoaderFirstLODComplete();
        private _loadData(data);
        private _addRightHandToLeftHandRootTransform();
        private _getMeshes();
        private _getSkeletons();
        private _getAnimationTargets();
        private _showMeshes();
        private _startAnimations();
        private _loadScene(nodeNames);
        private _loadSkin(node);
        private _updateBone(node, parentNode, skin, inverseBindMatrixData);
        private _createBone(node, skin);
        private _loadMesh(node);
        private _loadMeshData(node, mesh, babylonMesh);
        private _loadVertexDataAsync(primitive, onSuccess);
        private _createMorphTargets(node, mesh, primitive, babylonMesh);
        private _loadMorphTargetsData(mesh, primitive, vertexData, babylonMesh);
        private _loadTransform(node, babylonMesh);
        private _traverseNodes(indices, action, parentNode?);
        private _traverseNode(index, action, parentNode?);
        private _loadAnimations();
        private _loadAnimationChannel(animation, animationIndex, channelIndex);
        private _loadBufferAsync(index, onSuccess);
        private _buildInt8ArrayBuffer(buffer, byteOffset, byteLength, byteStride, bytePerComponent);
        private _buildUint8ArrayBuffer(buffer, byteOffset, byteLength, byteStride, bytePerComponent);
        private _buildInt16ArrayBuffer(buffer, byteOffset, byteLength, byteStride, bytePerComponent);
        private _buildUint16ArrayBuffer(buffer, byteOffset, byteLength, byteStride, bytePerComponent);
        private _buildUint32ArrayBuffer(buffer, byteOffset, byteLength, byteStride, bytePerComponent);
        private _buildFloat32ArrayBuffer(buffer, byteOffset, byteLength, byteStride, bytePerComponent);
        private _extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, stride, length);
        private _loadBufferViewAsync(bufferView, byteOffset, byteLength, bytePerComponent, componentType, onSuccess);
        private _loadAccessorAsync(accessor, onSuccess);
        private _getByteStrideFromType(accessor);
        blockPendingTracking: boolean;
        addPendingData(data: any): void;
        removePendingData(data: any): void;
        addLoaderNonBlockingPendingData(data: any): void;
        addLoaderPendingData(data: any): void;
        removeLoaderPendingData(data: any): void;
        private _getDefaultMaterial();
        private _loadMaterialMetallicRoughnessProperties(material);
        loadMaterial(material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): void;
        createPbrMaterial(material: IGLTFMaterial): void;
        loadMaterialBaseProperties(material: IGLTFMaterial): void;
        loadMaterialAlphaProperties(material: IGLTFMaterial, colorFactor?: number[]): void;
        loadTexture(textureInfo: IGLTFTextureInfo): Texture;
    }
}


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
        static ForEach(view: Uint16Array | Uint32Array | Float32Array, func: (nvalue: number, index: number) => void): void;
        static GetTextureWrapMode(mode: ETextureWrapMode): number;
        static GetTextureSamplingMode(magFilter: ETextureMagFilter, minFilter: ETextureMinFilter): number;
        /**
         * Decodes a buffer view into a string
         * @param view: the buffer view
         */
        static DecodeBufferToText(view: ArrayBufferView): string;
    }
}


declare module BABYLON.GLTF2 {
    abstract class GLTFLoaderExtension {
        enabled: boolean;
        readonly abstract name: string;
        protected loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        static _Extensions: GLTFLoaderExtension[];
        static LoadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private static _ApplyExtensions(action);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class MSFTLOD extends GLTFLoaderExtension {
        /**
         * Specify the minimal delay between LODs in ms (default = 250)
         */
        static MinimalLODDelay: number;
        readonly name: string;
        protected loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private loadMaterialLOD(loader, material, materialLODs, lod, assign);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHRMaterialsPbrSpecularGlossiness extends GLTFLoaderExtension {
        readonly name: string;
        protected loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private _loadSpecularGlossinessProperties(loader, material, properties);
    }
}
