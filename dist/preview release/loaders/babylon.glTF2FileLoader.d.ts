
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
    interface IGLTFLoaderExtension {
        /**
         * The name of this extension.
         */
        readonly name: string;
        /**
         * Whether this extension is enabled.
         */
        enabled: boolean;
    }
    enum GLTFLoaderState {
        Loading = 0,
        Ready = 1,
        Complete = 2,
    }
    interface IGLTFLoader extends IDisposable {
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        animationStartMode: GLTFLoaderAnimationStartMode;
        compileMaterials: boolean;
        useClipPlane: boolean;
        compileShadowGenerators: boolean;
        onMeshLoadedObservable: Observable<AbstractMesh>;
        onTextureLoadedObservable: Observable<BaseTexture>;
        onMaterialLoadedObservable: Observable<Material>;
        onCompleteObservable: Observable<IGLTFLoader>;
        onDisposeObservable: Observable<IGLTFLoader>;
        onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        state: Nullable<GLTFLoaderState>;
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
        }>;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<void>;
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
        readonly onMeshLoadedObservable: Observable<AbstractMesh>;
        private _onMeshLoadedObserver;
        onMeshLoaded: (mesh: AbstractMesh) => void;
        /**
         * Raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        readonly onTextureLoadedObservable: Observable<BaseTexture>;
        private _onTextureLoadedObserver;
        onTextureLoaded: (Texture: BaseTexture) => void;
        /**
         * Raised when the loader creates a material after parsing the glTF properties of the material.
         */
        readonly onMaterialLoadedObservable: Observable<Material>;
        private _onMaterialLoadedObserver;
        onMaterialLoaded: (Material: Material) => void;
        /**
         * Raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after onSuccess.
         */
        readonly onCompleteObservable: Observable<GLTFFileLoader>;
        private _onCompleteObserver;
        onComplete: () => void;
        /**
        * Raised when the loader is disposed.
        */
        readonly onDisposeObservable: Observable<GLTFFileLoader>;
        private _onDisposeObserver;
        onDispose: () => void;
        /**
         * Raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        readonly onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        private _onExtensionLoadedObserver;
        onExtensionLoaded: (extension: IGLTFLoaderExtension) => void;
        /**
         * The loader state or null if not active.
         */
        readonly loaderState: Nullable<GLTFLoaderState>;
        private _loader;
        name: string;
        extensions: ISceneLoaderPluginExtensions;
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
        }>;
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void>;
        loadAssetContainerAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<AssetContainer>;
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
    interface TypedArray extends ArrayBufferView {
        [index: number]: number;
    }
    interface IArrayItem {
        _index: number;
    }
    class ArrayItem {
        static Assign(values?: IArrayItem[]): void;
    }
}



declare module BABYLON.GLTF2 {
    interface ILoaderAccessor extends IAccessor, IArrayItem {
        _data?: Promise<TypedArray>;
    }
    interface ILoaderAnimationChannel extends IAnimationChannel, IArrayItem {
        _babylonAnimationGroup: AnimationGroup;
    }
    interface ILoaderAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }
    interface ILoaderAnimationSampler extends IAnimationSampler, IArrayItem {
        _data: Promise<ILoaderAnimationSamplerData>;
    }
    interface ILoaderAnimation extends IAnimation, IArrayItem {
        channels: ILoaderAnimationChannel[];
        samplers: ILoaderAnimationSampler[];
        _babylonAnimationGroup: Nullable<AnimationGroup>;
    }
    interface ILoaderBuffer extends IBuffer, IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }
    interface ILoaderBufferView extends IBufferView, IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }
    interface ILoaderCamera extends ICamera, IArrayItem {
    }
    interface ILoaderImage extends IImage, IArrayItem {
        _objectURL?: Promise<string>;
    }
    interface ILoaderMaterial extends IMaterial, IArrayItem {
        _babylonMaterial?: Material;
        _babylonMeshes?: AbstractMesh[];
        _loaded?: Promise<void>;
    }
    interface ILoaderMesh extends IMesh, IArrayItem {
        primitives: ILoaderMeshPrimitive[];
    }
    interface ILoaderMeshPrimitive extends IMeshPrimitive, IArrayItem {
    }
    interface ILoaderNode extends INode, IArrayItem {
        _parent: ILoaderNode;
        _babylonMesh?: Mesh;
        _primitiveBabylonMeshes?: Mesh[];
        _babylonAnimationTargets?: Node[];
        _numMorphTargets?: number;
    }
    interface ILoaderSamplerData {
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }
    interface ILoaderSampler extends ISampler, IArrayItem {
        _data?: ILoaderSamplerData;
    }
    interface ILoaderScene extends IScene, IArrayItem {
    }
    interface ILoaderSkin extends ISkin, IArrayItem {
        _babylonSkeleton: Nullable<Skeleton>;
        _loaded?: Promise<void>;
    }
    interface ILoaderTexture extends ITexture, IArrayItem {
    }
    interface ILoaderGLTF extends IGLTF {
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


declare module BABYLON.GLTF2 {
    class GLTFLoader implements IGLTFLoader {
        _gltf: ILoaderGLTF;
        _babylonScene: Scene;
        _completePromises: Promise<void>[];
        private _disposed;
        private _state;
        private _extensions;
        private _rootUrl;
        private _rootBabylonMesh;
        private _defaultSampler;
        private _progressCallback?;
        private _requests;
        private static _Names;
        private static _Factories;
        static _Register(name: string, factory: (loader: GLTFLoader) => GLTFLoaderExtension): void;
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        animationStartMode: GLTFLoaderAnimationStartMode;
        compileMaterials: boolean;
        useClipPlane: boolean;
        compileShadowGenerators: boolean;
        readonly onDisposeObservable: Observable<IGLTFLoader>;
        readonly onMeshLoadedObservable: Observable<AbstractMesh>;
        readonly onTextureLoadedObservable: Observable<BaseTexture>;
        readonly onMaterialLoadedObservable: Observable<Material>;
        readonly onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        readonly onCompleteObservable: Observable<IGLTFLoader>;
        readonly state: Nullable<GLTFLoaderState>;
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
        }>;
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void>;
        private _loadAsync(nodes, scene, data, rootUrl, onProgress?);
        private _loadExtensions();
        private _loadData(data);
        private _setupData();
        private _createRootNode();
        private _loadNodesAsync(nodes);
        _loadSceneAsync(context: string, scene: ILoaderScene): Promise<void>;
        private _getMeshes();
        private _getSkeletons();
        private _startAnimations();
        _loadNodeAsync(context: string, node: ILoaderNode): Promise<void>;
        private _loadMeshAsync(context, node, mesh);
        private _loadPrimitiveAsync(context, node, mesh, primitive);
        private _loadVertexDataAsync(context, primitive, babylonMesh);
        private _createMorphTargets(context, node, mesh, primitive, babylonMesh);
        private _loadMorphTargetsAsync(context, primitive, babylonMesh, babylonVertexData);
        private _loadMorphTargetVertexDataAsync(context, babylonVertexData, attributes, babylonMorphTarget);
        private static _ConvertToFloat32Array(context, accessor, data);
        private static _ConvertVec3ToVec4(context, data);
        private static _LoadTransform(node, babylonNode);
        private _loadSkinAsync(context, node, mesh, skin);
        private _loadSkinInverseBindMatricesDataAsync(context, skin);
        private _createBone(node, skin, parent, localMatrix, baseMatrix, index);
        private _loadBones(context, skin, inverseBindMatricesData);
        private _loadBone(node, skin, inverseBindMatricesData, babylonBones);
        private _getNodeMatrix(node);
        private _loadAnimationsAsync();
        private _loadAnimationAsync(context, animation);
        private _loadAnimationChannelAsync(context, animationContext, animation, channel, babylonAnimationGroup);
        private _loadAnimationSamplerAsync(context, sampler);
        private _loadBufferAsync(context, buffer);
        _loadBufferViewAsync(context: string, bufferView: ILoaderBufferView): Promise<ArrayBufferView>;
        private _loadAccessorAsync(context, accessor);
        private _buildArrayBuffer<T>(typedArray, data, byteOffset, count, numComponents, byteStride?);
        private _getDefaultMaterial();
        private _loadMaterialMetallicRoughnessPropertiesAsync(context, material);
        _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh): Promise<void>;
        _createMaterial(material: ILoaderMaterial): PBRMaterial;
        _loadMaterialBasePropertiesAsync(context: string, material: ILoaderMaterial): Promise<void>;
        _loadMaterialAlphaProperties(context: string, material: ILoaderMaterial): void;
        _loadTextureAsync(context: string, textureInfo: ITextureInfo, assign: (texture: Texture) => void): Promise<void>;
        private _loadSampler(context, sampler);
        private _loadImageAsync(context, image);
        _loadUriAsync(context: string, uri: string): Promise<ArrayBufferView>;
        private _onProgress();
        static _GetProperty<T>(context: string, array: ArrayLike<T> | undefined, index: number | undefined): T;
        private static _GetTextureWrapMode(context, mode);
        private static _GetTextureSamplingMode(context, magFilter?, minFilter?);
        private static _GetNumComponents(context, type);
        private static _ValidateUri(uri);
        private _compileMaterialsAsync();
        private _compileShadowGeneratorsAsync();
        private _clear();
        _applyExtensions<T>(actionAsync: (extension: GLTFLoaderExtension) => Nullable<Promise<T>>): Nullable<Promise<T>>;
    }
}


declare module BABYLON.GLTF2 {
    abstract class GLTFLoaderExtension implements IGLTFLoaderExtension {
        enabled: boolean;
        readonly abstract name: string;
        protected _loader: GLTFLoader;
        constructor(loader: GLTFLoader);
        /** Override this method to modify the default behavior for loading scenes. */
        protected _loadSceneAsync(context: string, node: ILoaderScene): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading nodes. */
        protected _loadNodeAsync(context: string, node: ILoaderNode): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading mesh primitive vertex data. */
        protected _loadVertexDataAsync(context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<VertexData>>;
        /** Override this method to modify the default behavior for loading materials. */
        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading uris. */
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
        /** Helper method called by a loader extension to load an glTF extension. */
        protected _loadExtensionAsync<TProperty, TResult = void>(context: string, property: IProperty, actionAsync: (context: string, extension: TProperty) => Promise<TResult>): Nullable<Promise<TResult>>;
        /** Helper method called by the loader to allow extensions to override loading scenes. */
        static _LoadSceneAsync(loader: GLTFLoader, context: string, scene: ILoaderScene): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading nodes. */
        static _LoadNodeAsync(loader: GLTFLoader, context: string, node: ILoaderNode): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading mesh primitive vertex data. */
        static _LoadVertexDataAsync(loader: GLTFLoader, context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<VertexData>>;
        /** Helper method called by the loader to allow extensions to override loading materials. */
        static _LoadMaterialAsync(loader: GLTFLoader, context: string, material: ILoaderMaterial, babylonMesh: Mesh): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading uris. */
        static _LoadUriAsync(loader: GLTFLoader, context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
    }
}


declare module BABYLON.GLTF2.Extensions {
    class MSFT_lod extends GLTFLoaderExtension {
        readonly name: string;
        /**
         * Maximum number of LODs to load, starting from the lowest LOD.
         */
        maxLODsToLoad: number;
        private _loadingNodeLOD;
        private _loadNodeSignals;
        private _loadingMaterialLOD;
        private _loadMaterialSignals;
        protected _loadNodeAsync(context: string, node: ILoaderNode): Nullable<Promise<void>>;
        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh): Nullable<Promise<void>>;
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
        /**
         * Gets an array of LOD properties from lowest to highest.
         */
        private _getLODs<T>(context, property, array, ids);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHR_draco_mesh_compression extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadVertexDataAsync(context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<VertexData>>;
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHR_materials_pbrSpecularGlossiness extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh): Nullable<Promise<void>>;
        private _loadSpecularGlossinessPropertiesAsync(loader, context, material, properties);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHR_lights extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadSceneAsync(context: string, scene: ILoaderScene): Nullable<Promise<void>>;
        protected _loadNodeAsync(context: string, node: ILoaderNode): Nullable<Promise<void>>;
        private readonly _lights;
    }
}
