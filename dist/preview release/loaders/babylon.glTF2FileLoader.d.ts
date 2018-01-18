
declare module BABYLON {
    enum GLTFLoaderCoordinateSystemMode {
        /**
         * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
         */
        AUTO = 0,
        /**
         * Sets the useRightHandedSystem flag on the scene.
         */
        FORCE_RIGHT_HANDED = 1,
    }
    enum GLTFLoaderAnimationStartMode {
        /**
         * No animation will start.
         */
        NONE = 0,
        /**
         * The first animation will start.
         */
        FIRST = 1,
        /**
         * All animations will start.
         */
        ALL = 2,
    }
    interface IGLTFLoaderData {
        json: Object;
        bin: Nullable<ArrayBufferView>;
    }
    interface IGLTFLoader extends IDisposable {
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        animationStartMode: GLTFLoaderAnimationStartMode;
        compileMaterials: boolean;
        useClipPlane: boolean;
        compileShadowGenerators: boolean;
        onDisposeObservable: Observable<IGLTFLoader>;
        onMeshLoadedObservable: Observable<AbstractMesh>;
        onTextureLoadedObservable: Observable<BaseTexture>;
        onMaterialLoadedObservable: Observable<Material>;
        onCompleteObservable: Observable<IGLTFLoader>;
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void) => void;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: () => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void) => void;
    }
    class GLTFFileLoader implements IDisposable, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
        static CreateGLTFLoaderV1: () => IGLTFLoader;
        static CreateGLTFLoaderV2: () => IGLTFLoader;
        /**
         * Raised when the asset has been parsed.
         * The data.json property stores the glTF JSON.
         * The data.bin property stores the BIN chunk from a glTF binary or null if the input is not a glTF binary.
         */
        onParsedObservable: Observable<IGLTFLoaderData>;
        private _onParsedObserver;
        onParsed: (loaderData: IGLTFLoaderData) => void;
        static IncrementalLoading: boolean;
        static HomogeneousCoordinates: boolean;
        /**
         * The coordinate system mode (AUTO, FORCE_RIGHT_HANDED).
         */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
         * The animation start mode (NONE, FIRST, ALL).
         */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
         * Set to true to compile materials before raising the success callback.
         */
        compileMaterials: boolean;
        /**
         * Set to true to also compile materials with clip planes.
         */
        useClipPlane: boolean;
        /**
         * Set to true to compile shadow generators before raising the success callback.
         */
        compileShadowGenerators: boolean;
        /**
         * Raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        onMeshLoadedObservable: Observable<AbstractMesh>;
        private _onMeshLoadedObserver;
        onMeshLoaded: (mesh: AbstractMesh) => void;
        /**
         * Raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        onTextureLoadedObservable: Observable<BaseTexture>;
        private _onTextureLoadedObserver;
        onTextureLoaded: (Texture: BaseTexture) => void;
        /**
         * Raised when the loader creates a material after parsing the glTF properties of the material.
         */
        onMaterialLoadedObservable: Observable<Material>;
        private _onMaterialLoadedObserver;
        onMaterialLoaded: (Material: Material) => void;
        /**
         * Raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after onSuccess.
         */
        onCompleteObservable: Observable<GLTFFileLoader>;
        private _onCompleteObserver;
        onComplete: () => void;
        /**
        * Raised when the loader is disposed.
        */
        onDisposeObservable: Observable<GLTFFileLoader>;
        private _onDisposeObserver;
        onDispose: () => void;
        private _loader;
        name: string;
        extensions: ISceneLoaderPluginExtensions;
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void): void;
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess?: () => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void): void;
        loadAssetsAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: (assets: AssetContainer) => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void): void;
        canDirectLoad(data: string): boolean;
        rewriteRootURL: (rootUrl: string, responseURL?: string) => string;
        createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync;
        private _parse(data);
        private _getLoader(loaderData);
        private static _parseBinary(data);
        private static _parseV1(binaryReader);
        private static _parseV2(binaryReader);
        private static _parseVersion(version);
        private static _compareVersion(a, b);
        private static _decodeBufferToText(buffer);
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
        extensions?: {
            [key: string]: any;
        };
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
        index: number;
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
        index: number;
        babylonAnimationGroup: AnimationGroup;
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
        index: number;
        loadedData?: ArrayBufferView;
        loadedObservable?: Observable<IGLTFBuffer>;
    }
    interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
        byteStride?: number;
        index: number;
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
        index: number;
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
        index: number;
        babylonMaterial: Material;
    }
    interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: {
            [name: string]: number;
        };
        indices?: number;
        material?: number;
        mode?: EMeshPrimitiveMode;
        targets?: {
            [name: string]: number;
        }[];
        vertexData: VertexData;
        targetsVertexData: VertexData[];
    }
    interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
        weights?: number[];
        index: number;
        hasVertexAlpha: boolean;
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
        index: number;
        parent: IGLTFNode;
        babylonMesh: Mesh;
        babylonAnimationTargets?: Node[];
    }
    interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: ETextureMagFilter;
        minFilter?: ETextureMinFilter;
        wrapS?: ETextureWrapMode;
        wrapT?: ETextureWrapMode;
        index: number;
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }
    interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: number[];
        index: number;
    }
    interface IGLTFSkin extends IGLTFChildRootProperty {
        inverseBindMatrices?: number;
        skeleton?: number;
        joints: number[];
        index: number;
        babylonSkeleton: Skeleton;
    }
    interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler?: number;
        source: number;
        index: number;
        url?: string;
        dataReadyObservable?: Observable<IGLTFTexture>;
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
    class GLTFLoader implements IGLTFLoader {
        _gltf: IGLTF;
        _babylonScene: Scene;
        private _disposed;
        private _rootUrl;
        private _defaultMaterial;
        private _defaultSampler;
        private _rootNode;
        private _successCallback?;
        private _progressCallback?;
        private _errorCallback?;
        private _renderReady;
        private _requests;
        private _renderReadyObservable;
        private _renderPendingCount;
        private _loaderPendingCount;
        private _loaderTrackers;
        static Extensions: {
            [name: string]: GLTFLoaderExtension;
        };
        static RegisterExtension(extension: GLTFLoaderExtension): void;
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        animationStartMode: GLTFLoaderAnimationStartMode;
        compileMaterials: boolean;
        useClipPlane: boolean;
        compileShadowGenerators: boolean;
        onDisposeObservable: Observable<IGLTFLoader>;
        onMeshLoadedObservable: Observable<AbstractMesh>;
        onTextureLoadedObservable: Observable<BaseTexture>;
        onMaterialLoadedObservable: Observable<Material>;
        onCompleteObservable: Observable<IGLTFLoader>;
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void): void;
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: () => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void): void;
        private _loadAsync(nodeNames, scene, data, rootUrl, onSuccess?, onProgress?, onError?);
        private _onProgress();
        _executeWhenRenderReady(func: () => void): void;
        private _onRenderReady();
        private _onComplete();
        private _loadData(data);
        private _getMeshes();
        private _getSkeletons();
        private _startAnimations();
        private _loadDefaultScene(nodeNames);
        private _loadScene(context, scene, nodeNames);
        _loadNode(context: string, node: IGLTFNode): void;
        private _loadMesh(context, node, mesh);
        private _loadAllVertexDataAsync(context, mesh, onSuccess);
        /**
         * Converts a data bufferview into a Float4 Texture Coordinate Array, based on the accessor component type
         * @param {ArrayBufferView} data
         * @param {IGLTFAccessor} accessor
         */
        private _convertToFloat4TextureCoordArray(context, data, accessor);
        /**
         * Converts a data bufferview into a Float4 Color Array, based on the accessor component type
         * @param {ArrayBufferView} data
         * @param {IGLTFAccessor} accessor
         */
        private _convertToFloat4ColorArray(context, data, accessor);
        private _loadVertexDataAsync(context, mesh, primitive, onSuccess);
        private _createMorphTargets(context, node, mesh);
        private _loadMorphTargets(context, node, mesh);
        private _loadAllMorphTargetVertexDataAsync(context, node, mesh, onSuccess);
        private _loadMorphTargetVertexDataAsync(context, vertexData, attributes, onSuccess);
        private _loadTransform(node);
        private _loadSkinAsync(context, skin, onSuccess);
        private _createBone(node, skin, parent, localMatrix, baseMatrix, index);
        private _loadBones(context, skin, inverseBindMatrixData);
        private _loadBone(node, skin, inverseBindMatrixData, babylonBones);
        private _getNodeMatrix(node);
        private _traverseNodes(context, indices, action, parentNode);
        _traverseNode(context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): void;
        private _loadAnimations();
        private _loadAnimation(context, animation);
        private _loadAnimationChannel(animation, channelContext, channel, samplerContext, sampler);
        private _loadBufferAsync(context, buffer, onSuccess);
        private _loadBufferViewAsync(context, bufferView, onSuccess);
        private _loadAccessorAsync(context, accessor, onSuccess);
        private _buildArrayBuffer<T>(typedArray, data, byteOffset, count, numComponents, byteStride?);
        _addPendingData(data: any): void;
        _removePendingData(data: any): void;
        _addLoaderPendingData(data: any): void;
        _removeLoaderPendingData(data: any): void;
        _whenAction(action: () => void, onComplete: () => void): void;
        private _getDefaultMaterial();
        private _loadMaterialMetallicRoughnessProperties(context, material);
        _loadMaterial(context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): void;
        _createPbrMaterial(material: IGLTFMaterial): void;
        _loadMaterialBaseProperties(context: string, material: IGLTFMaterial): void;
        _loadMaterialAlphaProperties(context: string, material: IGLTFMaterial, colorFactor: number[]): void;
        _loadTexture(context: string, texture: IGLTFTexture, coordinatesIndex?: number): Texture;
        private _loadSampler(context, sampler);
        private _loadImageAsync(context, image, onSuccess);
        _loadUriAsync(context: string, uri: string, onSuccess: (data: ArrayBufferView) => void): void;
        _tryCatchOnError(handler: () => void): void;
        private static _AssignIndices(array?);
        static _GetProperty<T extends IGLTFProperty>(array?: ArrayLike<T>, index?: number): Nullable<T>;
        private static _GetTextureWrapMode(context, mode?);
        private static _GetTextureSamplingMode(context, magFilter?, minFilter?);
        private static _GetNumComponents(context, type);
        private _compileMaterialAsync(babylonMaterial, babylonMesh, onSuccess);
        private _compileMaterialsAsync(onSuccess);
        private _compileShadowGeneratorsAsync(onSuccess);
        private _abortRequests();
        private _releaseResources();
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
        static ValidateUri(uri: string): boolean;
    }
}


declare module BABYLON.GLTF2 {
    abstract class GLTFLoaderExtension {
        enabled: boolean;
        readonly abstract name: string;
        protected _traverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean;
        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean;
        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        protected _loadExtension<T>(context: string, property: IGLTFProperty, action: (context: string, extension: T, onComplete: () => void) => void): boolean;
        static _Extensions: GLTFLoaderExtension[];
        static TraverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean;
        static LoadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean;
        static LoadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private static _ApplyExtensions(action);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class MSFTLOD extends GLTFLoaderExtension {
        /**
         * Specify the minimal delay between LODs in ms (default = 250)
         */
        Delay: number;
        readonly name: string;
        protected _traverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean;
        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean;
        private _loadNodeLOD(loader, context, nodes, index, onComplete);
        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private _loadMaterialLOD(loader, context, materials, index, assign, onComplete);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHRMaterialsPbrSpecularGlossiness extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private _loadSpecularGlossinessProperties(loader, context, material, properties);
    }
}
