
declare module BABYLON {
    /**
     * Mode that determines the coordinate system to use.
     */
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
    /**
     * Mode that determines what animations will start.
     */
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
    /**
     * Interface that contains the data for the glTF asset.
     */
    interface IGLTFLoaderData {
        /**
         * JSON that represents the glTF.
         */
        json: Object;
        /**
         * The BIN chunk of a binary glTF
         */
        bin: Nullable<ArrayBufferView>;
    }
    /**
     * Interface for extending the loader.
     */
    interface IGLTFLoaderExtension {
        /**
         * The name of this extension.
         */
        readonly name: string;
        /**
         * Defines whether this extension is enabled.
         */
        enabled: boolean;
    }
    /**
     * Loader state.
     */
    enum GLTFLoaderState {
        /**
         * The asset is loading.
         */
        LOADING = 0,
        /**
         * The asset is ready for rendering.
         */
        READY = 1,
        /**
         * The asset is completely loaded.
         */
        COMPLETE = 2,
    }
    /**
     * Loader interface.
     */
    interface IGLTFLoader extends IDisposable {
        /**
         * Mode that determines the coordinate system to use.
         */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
         * Mode that determines what animations will start.
         */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
         * Defines if the loader should compile materials.
         */
        compileMaterials: boolean;
        /**
         * Defines if the loader should also compile materials with clip planes.
         */
        useClipPlane: boolean;
        /**
         * Defines if the loader should compile shadow generators.
         */
        compileShadowGenerators: boolean;
        /**
         * Defines if the Alpha blended materials are only applied as coverage.
         * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
         * If true, no extra effects are applied to transparent pixels.
         */
        transparencyAsCoverage: boolean;
        /** @hidden */
        _normalizeAnimationGroupsToBeginAtZero: boolean;
        /**
         * Function called before loading a url referenced by the asset.
         */
        preprocessUrlAsync: (url: string) => Promise<string>;
        /**
         * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        onMeshLoadedObservable: Observable<AbstractMesh>;
        /**
         * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        onTextureLoadedObservable: Observable<BaseTexture>;
        /**
         * Observable raised when the loader creates a material after parsing the glTF properties of the material.
         */
        onMaterialLoadedObservable: Observable<Material>;
        /**
         * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
         */
        onCameraLoadedObservable: Observable<Camera>;
        /**
         * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
         */
        onCompleteObservable: Observable<IGLTFLoader>;
        /**
         * Observable raised after the loader is disposed.
         */
        onDisposeObservable: Observable<IGLTFLoader>;
        /**
         * Observable raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        /**
         * Loader state or null if the loader is not active.
         */
        state: Nullable<GLTFLoaderState>;
        /**
         * Imports meshes from the given data and adds them to the scene.
         */
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
            animationGroups: AnimationGroup[];
        }>;
        /**
         * Loads all objects from the given data and adds them to the scene.
         */
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<void>;
    }
    /**
     * File loader for loading glTF files into a scene.
     */
    class GLTFFileLoader implements IDisposable, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
        /**
         * Factory function that creates a glTF 1.0 loader
         */
        static CreateGLTFLoaderV1: () => IGLTFLoader;
        /**
         * Factory function that creates a glTF 2.0 loader
         */
        static CreateGLTFLoaderV2: () => IGLTFLoader;
        /**
         * Raised when the asset has been parsed
         */
        onParsedObservable: Observable<IGLTFLoaderData>;
        private _onParsedObserver;
        /**
         * Raised when the asset has been parsed
         */
        onParsed: (loaderData: IGLTFLoaderData) => void;
        /**
         * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
         * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
         * Defaults to true.
         */
        static IncrementalLoading: boolean;
        /**
         * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
         * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
         */
        static HomogeneousCoordinates: boolean;
        /**
         * The coordinate system mode. Defaults to AUTO.
         */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
        * The animation start mode. Defaults to FIRST.
        */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
         * Defines if the loader should compile materials before raising the success callback. Defaults to false.
         */
        compileMaterials: boolean;
        /**
         * Defines if the loader should also compile materials with clip planes. Defaults to false.
         */
        useClipPlane: boolean;
        /**
         * Defines if the loader should compile shadow generators before raising the success callback. Defaults to false.
         */
        compileShadowGenerators: boolean;
        /**
         * Defines if the Alpha blended materials are only applied as coverage.
         * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
         * If true, no extra effects are applied to transparent pixels.
         */
        transparencyAsCoverage: boolean;
        /** @hidden */
        _normalizeAnimationGroupsToBeginAtZero: boolean;
        /**
         * Function called before loading a url referenced by the asset.
         */
        preprocessUrlAsync: (url: string) => Promise<string>;
        /**
         * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        readonly onMeshLoadedObservable: Observable<AbstractMesh>;
        private _onMeshLoadedObserver;
        /**
         * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        onMeshLoaded: (mesh: AbstractMesh) => void;
        /**
         * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        readonly onTextureLoadedObservable: Observable<BaseTexture>;
        private _onTextureLoadedObserver;
        /**
         * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        onTextureLoaded: (texture: BaseTexture) => void;
        /**
         * Observable raised when the loader creates a material after parsing the glTF properties of the material.
         */
        readonly onMaterialLoadedObservable: Observable<Material>;
        private _onMaterialLoadedObserver;
        /**
         * Callback raised when the loader creates a material after parsing the glTF properties of the material.
         */
        onMaterialLoaded: (material: Material) => void;
        /**
         * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
         */
        readonly onCameraLoadedObservable: Observable<Camera>;
        private _onCameraLoadedObserver;
        /**
         * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
         */
        onCameraLoaded: (camera: Camera) => void;
        /**
         * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
         */
        readonly onCompleteObservable: Observable<GLTFFileLoader>;
        private _onCompleteObserver;
        /**
         * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
         */
        onComplete: () => void;
        /**
         * Observable raised after the loader is disposed.
         */
        readonly onDisposeObservable: Observable<GLTFFileLoader>;
        private _onDisposeObserver;
        /**
         * Callback raised after the loader is disposed.
         */
        onDispose: () => void;
        /**
         * Observable raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        readonly onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        private _onExtensionLoadedObserver;
        /**
         * Callback raised after a loader extension is created.
         */
        onExtensionLoaded: (extension: IGLTFLoaderExtension) => void;
        /**
         * Returns a promise that resolves when the asset is completely loaded.
         * @returns a promise that resolves when the asset is completely loaded.
         */
        whenCompleteAsync(): Promise<void>;
        /**
         * The loader state or null if the loader is not active.
         */
        readonly loaderState: Nullable<GLTFLoaderState>;
        private _loader;
        /**
         * Name of the loader ("gltf")
         */
        name: string;
        /**
         * Supported file extensions of the loader (.gltf, .glb)
         */
        extensions: ISceneLoaderPluginExtensions;
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        dispose(): void;
        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
            animationGroups: AnimationGroup[];
        }>;
        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise which completes when objects have been loaded to the scene
         */
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void>;
        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @returns The loaded asset container
         */
        loadAssetContainerAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<AssetContainer>;
        /**
         * If the data string can be loaded directly.
         * @param data string contianing the file data
         * @returns if the data can be loaded directly
         */
        canDirectLoad(data: string): boolean;
        /**
         * Rewrites a url by combining a root url and response url.
         */
        rewriteRootURL: (rootUrl: string, responseURL?: string) => string;
        /**
         * Instantiates a glTF file loader plugin.
         * @returns the created plugin
         */
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
    /** @hidden */
    interface _IArrayItem {
        _index: number;
    }
    /** @hidden */
    class _ArrayItem {
        /** @hidden */
        static Assign(values?: _IArrayItem[]): void;
    }
}



declare module BABYLON.GLTF2 {
    /** @hidden */
    interface _ILoaderAccessor extends IAccessor, _IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonVertexBuffer?: Promise<VertexBuffer>;
    }
    /** @hidden */
    interface _ILoaderAnimationChannel extends IAnimationChannel, _IArrayItem {
    }
    /** @hidden */
    interface _ILoaderAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }
    /** @hidden */
    interface _ILoaderAnimationSampler extends IAnimationSampler, _IArrayItem {
        _data: Promise<_ILoaderAnimationSamplerData>;
    }
    /** @hidden */
    interface _ILoaderAnimation extends IAnimation, _IArrayItem {
        channels: _ILoaderAnimationChannel[];
        samplers: _ILoaderAnimationSampler[];
        _babylonAnimationGroup?: AnimationGroup;
    }
    /** @hidden */
    interface _ILoaderBuffer extends IBuffer, _IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }
    /** @hidden */
    interface _ILoaderBufferView extends IBufferView, _IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonBuffer?: Promise<Buffer>;
    }
    /** @hidden */
    interface _ILoaderCamera extends ICamera, _IArrayItem {
    }
    /** @hidden */
    interface _ILoaderImage extends IImage, _IArrayItem {
        _objectURL?: Promise<string>;
    }
    /** @hidden */
    interface _ILoaderMaterial extends IMaterial, _IArrayItem {
        _babylonData?: {
            [drawMode: number]: {
                material: Material;
                meshes: AbstractMesh[];
                loaded: Promise<void>;
            };
        };
    }
    /** @hidden */
    interface _ILoaderMesh extends IMesh, _IArrayItem {
        primitives: _ILoaderMeshPrimitive[];
    }
    /** @hidden */
    interface _ILoaderMeshPrimitive extends IMeshPrimitive, _IArrayItem {
    }
    /** @hidden */
    interface _ILoaderNode extends INode, _IArrayItem {
        _parent: _ILoaderNode;
        _babylonMesh?: Mesh;
        _primitiveBabylonMeshes?: Mesh[];
        _babylonBones?: Bone[];
        _numMorphTargets?: number;
    }
    /** @hidden */
    interface _ILoaderSamplerData {
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }
    /** @hidden */
    interface _ILoaderSampler extends ISampler, _IArrayItem {
        _data?: _ILoaderSamplerData;
    }
    /** @hidden */
    interface _ILoaderScene extends IScene, _IArrayItem {
    }
    /** @hidden */
    interface _ILoaderSkin extends ISkin, _IArrayItem {
        _babylonSkeleton?: Skeleton;
        _loaded?: Promise<void>;
    }
    /** @hidden */
    interface _ILoaderTexture extends ITexture, _IArrayItem {
    }
    /** @hidden */
    interface _ILoaderGLTF extends IGLTF {
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


/**
 * Defines the module used to import/export glTF 2.0 assets
 */
declare module BABYLON.GLTF2 {
    /**
     * Loader for loading a glTF 2.0 asset
     */
    class GLTFLoader implements IGLTFLoader {
        /** @hidden */
        _gltf: _ILoaderGLTF;
        /** @hidden */
        _babylonScene: Scene;
        /** @hidden */
        _completePromises: Promise<void>[];
        private _disposed;
        private _state;
        private _extensions;
        private _rootUrl;
        private _rootBabylonMesh;
        private _defaultSampler;
        private _defaultBabylonMaterials;
        private _progressCallback?;
        private _requests;
        private static _ExtensionNames;
        private static _ExtensionFactories;
        /** @hidden */
        static _Register(name: string, factory: (loader: GLTFLoader) => GLTFLoaderExtension): void;
        /**
         * Mode that determines the coordinate system to use.
         */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
         * Mode that determines what animations will start.
         */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
         * Defines if the loader should compile materials.
         */
        compileMaterials: boolean;
        /**
         * Defines if the loader should also compile materials with clip planes.
         */
        useClipPlane: boolean;
        /**
         * Defines if the loader should compile shadow generators.
         */
        compileShadowGenerators: boolean;
        /**
         * Defines if the Alpha blended materials are only applied as coverage.
         * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
         * If true, no extra effects are applied to transparent pixels.
         */
        transparencyAsCoverage: boolean;
        /** @hidden */
        _normalizeAnimationGroupsToBeginAtZero: boolean;
        /**
         * Function called before loading a url referenced by the asset.
         */
        preprocessUrlAsync: (url: string) => Promise<string>;
        /**
         * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        readonly onMeshLoadedObservable: Observable<AbstractMesh>;
        /**
         * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        readonly onTextureLoadedObservable: Observable<BaseTexture>;
        /**
         * Observable raised when the loader creates a material after parsing the glTF properties of the material.
         */
        readonly onMaterialLoadedObservable: Observable<Material>;
        /**
         * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
         */
        readonly onCameraLoadedObservable: Observable<Camera>;
        /**
         * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
         */
        readonly onCompleteObservable: Observable<IGLTFLoader>;
        /**
         * Observable raised after the loader is disposed.
         */
        readonly onDisposeObservable: Observable<IGLTFLoader>;
        /**
         * Observable raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        readonly onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        /**
         * Loader state or null if the loader is not active.
         */
        readonly state: Nullable<GLTFLoaderState>;
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        dispose(): void;
        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
            animationGroups: AnimationGroup[];
        }>;
        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise which completes when objects have been loaded to the scene
         */
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void>;
        private _loadAsync(nodes, scene, data, rootUrl, onProgress?);
        private _loadData(data);
        private _setupData();
        private _loadExtensions();
        private _checkExtensions();
        private _createRootNode();
        private _loadNodesAsync(nodes);
        /** @hidden */
        _loadSceneAsync(context: string, scene: _ILoaderScene): Promise<void>;
        private _forEachPrimitive(node, callback);
        private _getMeshes();
        private _getSkeletons();
        private _getAnimationGroups();
        private _startAnimations();
        /** @hidden */
        _loadNodeAsync(context: string, node: _ILoaderNode): Promise<void>;
        private _loadMeshAsync(context, node, mesh, babylonMesh);
        private _loadPrimitiveAsync(context, node, mesh, primitive, babylonMesh);
        private _loadVertexDataAsync(context, primitive, babylonMesh);
        private _createMorphTargets(context, node, mesh, primitive, babylonMesh);
        private _loadMorphTargetsAsync(context, primitive, babylonMesh, babylonGeometry);
        private _loadMorphTargetVertexDataAsync(context, babylonGeometry, attributes, babylonMorphTarget);
        private static _LoadTransform(node, babylonNode);
        private _loadSkinAsync(context, node, mesh, skin);
        private _loadBones(context, skin);
        private _loadBone(node, skin, babylonBones);
        private _loadSkinInverseBindMatricesDataAsync(context, skin);
        private _updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
        private _getNodeMatrix(node);
        private _loadCamera(context, camera, babylonMesh);
        private _loadAnimationsAsync();
        private _loadAnimationAsync(context, animation);
        private _loadAnimationChannelAsync(context, animationContext, animation, channel, babylonAnimationGroup);
        private _loadAnimationSamplerAsync(context, sampler);
        private _loadBufferAsync(context, buffer);
        /** @hidden */
        _loadBufferViewAsync(context: string, bufferView: _ILoaderBufferView): Promise<ArrayBufferView>;
        private _loadIndicesAccessorAsync(context, accessor);
        private _loadFloatAccessorAsync(context, accessor);
        /** @hidden */
        _loadVertexBufferViewAsync(context: string, bufferView: _ILoaderBufferView, kind: string): Promise<Buffer>;
        private _loadVertexAccessorAsync(context, accessor, kind);
        private _getDefaultMaterial(drawMode);
        private _loadMaterialMetallicRoughnessPropertiesAsync(context, material, babylonMaterial);
        /** @hidden */
        _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Promise<void>;
        /** @hidden */
        _createMaterial(name: string, drawMode: number): PBRMaterial;
        /** @hidden */
        _loadMaterialBasePropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void>;
        /** @hidden */
        _loadMaterialAlphaProperties(context: string, material: _ILoaderMaterial, babylonMaterial: PBRMaterial): void;
        /** @hidden */
        _loadTextureAsync(context: string, textureInfo: ITextureInfo, assign: (texture: Texture) => void): Promise<void>;
        private _loadSampler(context, sampler);
        private _loadImageAsync(context, image);
        /** @hidden */
        _loadUriAsync(context: string, uri: string): Promise<ArrayBufferView>;
        private _onProgress();
        /** @hidden */
        static _GetProperty<T>(context: string, array: ArrayLike<T> | undefined, index: number | undefined): T;
        private static _GetTextureWrapMode(context, mode);
        private static _GetTextureSamplingMode(context, magFilter?, minFilter?);
        private static _GetTypedArray(context, componentType, bufferView, byteOffset, length);
        private static _GetNumComponents(context, type);
        private static _ValidateUri(uri);
        private static _GetDrawMode(context, mode);
        private _compileMaterialsAsync();
        private _compileShadowGeneratorsAsync();
        private _clear();
        /** @hidden */
        _applyExtensions<T>(actionAsync: (extension: GLTFLoaderExtension) => Nullable<Promise<T>>): Nullable<Promise<T>>;
    }
}


declare module BABYLON.GLTF2 {
    /**
     * Abstract class that can be implemented to extend existing glTF loader behavior.
     */
    abstract class GLTFLoaderExtension implements IGLTFLoaderExtension, IDisposable {
        enabled: boolean;
        readonly abstract name: string;
        protected _loader: GLTFLoader;
        constructor(loader: GLTFLoader);
        dispose(): void;
        /** Override this method to modify the default behavior for loading scenes. */
        protected _loadSceneAsync(context: string, node: _ILoaderScene): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading nodes. */
        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading mesh primitive vertex data. */
        protected _loadVertexDataAsync(context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;
        /** Override this method to modify the default behavior for loading materials. */
        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading uris. */
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
        /** Helper method called by a loader extension to load an glTF extension. */
        protected _loadExtensionAsync<TProperty, TResult = void>(context: string, property: IProperty, actionAsync: (extensionContext: string, extension: TProperty) => Promise<TResult>): Nullable<Promise<TResult>>;
        /** Helper method called by the loader to allow extensions to override loading scenes. */
        static _LoadSceneAsync(loader: GLTFLoader, context: string, scene: _ILoaderScene): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading nodes. */
        static _LoadNodeAsync(loader: GLTFLoader, context: string, node: _ILoaderNode): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading mesh primitive vertex data. */
        static _LoadVertexDataAsync(loader: GLTFLoader, context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;
        /** Helper method called by the loader to allow extensions to override loading materials. */
        static _LoadMaterialAsync(loader: GLTFLoader, context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading uris. */
        static _LoadUriAsync(loader: GLTFLoader, context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
    }
}
/**
 * Defines the module of the glTF 2.0 loader extensions.
 */
declare module BABYLON.GLTF2.Extensions {
}


declare module BABYLON.GLTF2.Extensions {
    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
     */
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
        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>>;
        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
        /**
         * Gets an array of LOD properties from lowest to highest.
         */
        private _getLODs<T>(context, property, array, ids);
    }
}


declare module BABYLON.GLTF2.Extensions {
    /** @hidden */
    class MSFT_minecraftMesh extends GLTFLoaderExtension {
        readonly name: string;
        constructor(loader: GLTFLoader);
        private _onMaterialLoaded;
    }
}


declare module BABYLON.GLTF2.Extensions {
    /** @hidden */
    class MSFT_sRGBFactors extends GLTFLoaderExtension {
        readonly name: string;
        constructor(loader: GLTFLoader);
        private _onMaterialLoaded;
    }
}


declare module BABYLON.GLTF2.Extensions {
    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression)
     */
    class KHR_draco_mesh_compression extends GLTFLoaderExtension {
        readonly name: string;
        private _dracoCompression;
        constructor(loader: GLTFLoader);
        dispose(): void;
        protected _loadVertexDataAsync(context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;
    }
}


declare module BABYLON.GLTF2.Extensions {
    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness)
     */
    class KHR_materials_pbrSpecularGlossiness extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        private _loadSpecularGlossinessPropertiesAsync(context, material, properties, babylonMaterial);
    }
}


declare module BABYLON.GLTF2.Extensions {
    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)
     */
    class KHR_materials_unlit extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        private _loadUnlitPropertiesAsync(context, material, babylonMaterial);
    }
}


declare module BABYLON.GLTF2.Extensions {
    /**
     * [Specification](https://github.com/MiiBond/glTF/tree/khr_lights_v1/extensions/Khronos/KHR_lights) (Experimental)
     */
    class KHR_lights extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadSceneAsync(context: string, scene: _ILoaderScene): Nullable<Promise<void>>;
        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>>;
        private readonly _lights;
    }
}
