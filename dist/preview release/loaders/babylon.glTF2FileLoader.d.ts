
declare module BABYLON {
    /**
    * Coordinate system mode that will be used when loading from the gltf file
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
    * Animation mode that determines which animations should be started when a file is loaded
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
    * Loaded gltf data
    */
    interface IGLTFLoaderData {
        /**
        * Loaded json string converted to an object
        */
        json: Object;
        /**
        * Loaded ArrayBufferView
        */
        bin: Nullable<ArrayBufferView>;
    }
    /**
    * Gltf extension interface
    */
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
    /**
    * Loading state
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
    * GLTF loader interface
    */
    interface IGLTFLoader extends IDisposable {
        /**
        * Coordinate system that will be used when loading from the gltf file
        */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
        * Animation mode that determines which animations should be started when a file is loaded
        */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
        * If the materials in the file should automatically be compiled
        */
        compileMaterials: boolean;
        /**
        * If a clip plane should be usede when loading meshes in the file
        */
        useClipPlane: boolean;
        /**
        * If shadow generators should automatically be compiled
        */
        compileShadowGenerators: boolean;
        /**
        * Observable that fires each time a mesh is loaded
        */
        onMeshLoadedObservable: Observable<AbstractMesh>;
        /**
        * Observable that fires each time a texture is loaded
        */
        onTextureLoadedObservable: Observable<BaseTexture>;
        /**
       * Observable that fires each time a material is loaded
       */
        onMaterialLoadedObservable: Observable<Material>;
        /**
        * Observable that fires when the load has completed
        */
        onCompleteObservable: Observable<IGLTFLoader>;
        /**
        * Observable that fires when the loader is disposed
        */
        onDisposeObservable: Observable<IGLTFLoader>;
        /**
        * Observable that fire when an extension is loaded
        */
        onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        /**
        * Loader state
        */
        state: Nullable<GLTFLoaderState>;
        /**
        * Imports one or more meshes from a loaded gltf file and adds them to the scene
        */
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
            animationGroups: AnimationGroup[];
        }>;
        /**
        * Imports all objects from a loaded gltf file and adds them to the scene
        */
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<void>;
    }
    /** File loader to load gltf files into a babylon scene */
    class GLTFFileLoader implements IDisposable, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
        /** Creates a gltf 1.0 file loader */
        static CreateGLTFLoaderV1: () => IGLTFLoader;
        /** Creates a gltf 2.0 file loader */
        static CreateGLTFLoaderV2: () => IGLTFLoader;
        /**
         * Raised when the asset has been parsed.
         * The data.json property stores the glTF JSON.
         * The data.bin property stores the BIN chunk from a glTF binary or null if the input is not a glTF binary.
         */
        onParsedObservable: Observable<IGLTFLoaderData>;
        private _onParsedObserver;
        /** Raised when the asset has been parsed. */
        onParsed: (loaderData: IGLTFLoaderData) => void;
        /**
         * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders. Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled. Defaults to true.
         */
        static IncrementalLoading: boolean;
        /**
         * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters. Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates
         */
        static HomogeneousCoordinates: boolean;
        /**
         * The coordinate system mode (AUTO, FORCE_RIGHT_HANDED). Defaults to AUTO.
         * - AUTO - Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
         * - FORCE_RIGHT_HANDED - Sets the useRightHandedSystem flag on the scene.
         */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
        * The animation start mode (NONE, FIRST, ALL). Defaults to FIRST.
        * - NONE - No animation will start.
        * - FIRST - The first animation will start.
        * - ALL - All animations will start.
        */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
         * Set to true to compile materials before raising the success callback. Defaults to false.
         */
        compileMaterials: boolean;
        /**
         * Set to true to also compile materials with clip planes. Defaults to false.
         */
        useClipPlane: boolean;
        /**
         * Set to true to compile shadow generators before raising the success callback. Defaults to false.
         */
        compileShadowGenerators: boolean;
        /**
         * Raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        readonly onMeshLoadedObservable: Observable<AbstractMesh>;
        private _onMeshLoadedObserver;
        /**
         * Raised when the loader creates a mesh after parsing the glTF properties of the mesh. (onMeshLoadedObservable is likely desired instead.)
         */
        onMeshLoaded: (mesh: AbstractMesh) => void;
        /**
         * Raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        readonly onTextureLoadedObservable: Observable<BaseTexture>;
        private _onTextureLoadedObserver;
        /**
         * Method called when a texture has been loaded (onTextureLoadedObservable is likely desired instead.)
         */
        onTextureLoaded: (texture: BaseTexture) => void;
        /**
         * Raised when the loader creates a material after parsing the glTF properties of the material.
         */
        readonly onMaterialLoadedObservable: Observable<Material>;
        private _onMaterialLoadedObserver;
        /**
         * Method when the loader creates a material after parsing the glTF properties of the material. (onMaterialLoadedObservable is likely desired instead.)
         */
        onMaterialLoaded: (material: Material) => void;
        /**
         * Raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
         */
        readonly onCompleteObservable: Observable<GLTFFileLoader>;
        private _onCompleteObserver;
        /**
         * Raised when the asset is completely loaded, immediately before the loader is disposed. (onCompleteObservable is likely desired instead.)
         */
        onComplete: () => void;
        /**
        * Raised after the loader is disposed.
        */
        readonly onDisposeObservable: Observable<GLTFFileLoader>;
        private _onDisposeObserver;
        /**
         * Raised after the loader is disposed. (onDisposeObservable is likely desired instead.)
         */
        onDispose: () => void;
        /**
         * Raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        readonly onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        private _onExtensionLoadedObserver;
        /**
         * Raised after a loader extension is created. (onExtensionLoadedObservable is likely desired instead.)
         */
        onExtensionLoaded: (extension: IGLTFLoaderExtension) => void;
        /**
         * Returns a promise that resolves when the asset is completely loaded.
         * @returns A promise that resolves when the asset is completely loaded.
         */
        whenCompleteAsync(): Promise<void>;
        /**
         * The loader state (LOADING, READY, COMPLETE) or null if the loader is not active.
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
        * Imports one or more meshes from a loaded gltf file and adds them to the scene
        * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
        * @param scene the scene the meshes should be added to
        * @param data gltf data containing information of the meshes in a loaded file
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
        * Imports all objects from a loaded gltf file and adds them to the scene
        * @param scene the scene the objects should be added to
        * @param data gltf data containing information of the meshes in a loaded file
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
         * If the data string can be loaded directly
         * @param data string contianing the file data
         * @returns if the data can be loaded directly
         */
        canDirectLoad(data: string): boolean;
        /**
         * Rewrites a url by combining a root url and response url
         */
        rewriteRootURL: (rootUrl: string, responseURL?: string) => string;
        /**
         * Instantiates a gltf file loader plugin
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
    /** Array item which contains it's index in an array */
    interface IArrayItem {
        _index: number;
    }
    /** Array item helper methods */
    class ArrayItem {
        /** Sets the index of each array element to its index in the array */
        static Assign(values?: IArrayItem[]): void;
    }
}



/**
 * GLTF2 module for babylon
 */
declare module BABYLON.GLTF2 {
    /**
     * Interface to access data and vertex buffer associated with a file
     */
    interface ILoaderAccessor extends IAccessor, IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonVertexBuffer?: Promise<VertexBuffer>;
    }
    /**
     * Loader's animation channel
     */
    interface ILoaderAnimationChannel extends IAnimationChannel, IArrayItem {
    }
    /**
     * Container for animation keyframe data
     */
    interface ILoaderAnimationSamplerData {
        input: Float32Array;
        interpolation: AnimationSamplerInterpolation;
        output: Float32Array;
    }
    /**
     * Keyframe data
     */
    interface ILoaderAnimationSampler extends IAnimationSampler, IArrayItem {
        _data: Promise<ILoaderAnimationSamplerData>;
    }
    /**
     * Loader animation
     */
    interface ILoaderAnimation extends IAnimation, IArrayItem {
        channels: ILoaderAnimationChannel[];
        samplers: ILoaderAnimationSampler[];
        _babylonAnimationGroup?: AnimationGroup;
    }
    /**
     * Loader buffer
     */
    interface ILoaderBuffer extends IBuffer, IArrayItem {
        _data?: Promise<ArrayBufferView>;
    }
    /**
     * Loader's buffer data
     */
    interface ILoaderBufferView extends IBufferView, IArrayItem {
        _data?: Promise<ArrayBufferView>;
        _babylonBuffer?: Promise<Buffer>;
    }
    /**
     * Loader's loaded camera data
     */
    interface ILoaderCamera extends ICamera, IArrayItem {
    }
    /**
     * Loaded image specified by url
     */
    interface ILoaderImage extends IImage, IArrayItem {
        _objectURL?: Promise<string>;
    }
    /**
     * Loaded material data
     */
    interface ILoaderMaterial extends IMaterial, IArrayItem {
        _babylonData?: {
            [drawMode: number]: {
                material: Material;
                meshes: AbstractMesh[];
                loaded: Promise<void>;
            };
        };
    }
    /**
     * Loader mesh data
     */
    interface ILoaderMesh extends IMesh, IArrayItem {
        primitives: ILoaderMeshPrimitive[];
    }
    /**
     * Loader mesh data
     */
    interface ILoaderMeshPrimitive extends IMeshPrimitive, IArrayItem {
    }
    /**
     * Node for traversing loader data
     */
    interface ILoaderNode extends INode, IArrayItem {
        _parent: ILoaderNode;
        _babylonMesh?: Mesh;
        _primitiveBabylonMeshes?: Mesh[];
        _babylonAnimationTargets?: Node[];
        _numMorphTargets?: number;
    }
    /**
     * Sampler data
     */
    interface ILoaderSamplerData {
        noMipMaps: boolean;
        samplingMode: number;
        wrapU: number;
        wrapV: number;
    }
    /**
     * Sampler data
     */
    interface ILoaderSampler extends ISampler, IArrayItem {
        _data?: ILoaderSamplerData;
    }
    /**
     * Loader's scene
     */
    interface ILoaderScene extends IScene, IArrayItem {
    }
    /**
     * Loader's skeleton data
     */
    interface ILoaderSkin extends ISkin, IArrayItem {
        _babylonSkeleton?: Skeleton;
        _loaded?: Promise<void>;
    }
    /**
     * Loader's texture
     */
    interface ILoaderTexture extends ITexture, IArrayItem {
    }
    /**
     * Loaded GLTF data
     */
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


/**
* Defines the GLTF2 module used to import/export GLTF 2.0 files
*/
declare module BABYLON.GLTF2 {
    /**
    * Interface for a meterial with a constructor
    */
    interface MaterialConstructor<T extends Material> {
        /**
        * The material class
        */
        readonly prototype: T;
        /**
        * Instatiates a material
        * @param name name of the material
        * @param scene the scene the material will be added to
        */
        new (name: string, scene: Scene): T;
    }
    /**
    * Used to load from a GLTF2 file
    */
    class GLTFLoader implements IGLTFLoader {
        /**
        * @ignore
        */
        _gltf: ILoaderGLTF;
        /**
        * @ignore
        */
        _babylonScene: Scene;
        /**
        * @ignore
        */
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
        private static _Names;
        private static _Factories;
        /**
        * @ignore, registers the loader
        * @param name name of the loader
        * @param factory function that converts a loader to a loader extension
        */
        static _Register(name: string, factory: (loader: GLTFLoader) => GLTFLoaderExtension): void;
        /**
        * Coordinate system that will be used when loading from the gltf file
        */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
        * Animation mode that determines which animations should be started when a file is loaded
        */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
        * If the materials in the file should automatically be compiled
        */
        compileMaterials: boolean;
        /**
        * If a clip plane should be usede when loading meshes in the file
        */
        useClipPlane: boolean;
        /**
        * If shadow generators should automatically be compiled
        */
        compileShadowGenerators: boolean;
        /**
        * Observable that fires when the loader is disposed
        */
        readonly onDisposeObservable: Observable<IGLTFLoader>;
        /**
        * Observable that fires each time a mesh is loaded
        */
        readonly onMeshLoadedObservable: Observable<AbstractMesh>;
        /**
        * Observable that fires each time a texture is loaded
        */
        readonly onTextureLoadedObservable: Observable<BaseTexture>;
        /**
        * Observable that fires each time a material is loaded
        */
        readonly onMaterialLoadedObservable: Observable<Material>;
        /**
        * Observable that fires each time an extension is loaded
        */
        readonly onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        /**
        * Observable that fires when the load has completed
        */
        readonly onCompleteObservable: Observable<IGLTFLoader>;
        /**
        * The current state of the loader
        */
        readonly state: Nullable<GLTFLoaderState>;
        /**
        * Disposes of the loader
        */
        dispose(): void;
        /**
        * Imports one or more meshes from a loaded gltf file and adds them to the scene
        * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
        * @param scene the scene the meshes should be added to
        * @param data gltf data containing information of the meshes in a loaded file
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
        * Imports all objects from a loaded gltf file and adds them to the scene
        * @param scene the scene the objects should be added to
        * @param data gltf data containing information of the meshes in a loaded file
        * @param rootUrl root url to load from
        * @param onProgress event that fires when loading progress has occured
        * @returns a promise which completes when objects have been loaded to the scene
        */
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void>;
        private _loadAsync(nodes, scene, data, rootUrl, onProgress?);
        private _loadExtensions();
        private _loadData(data);
        private _setupData();
        private _checkExtensions();
        private _createRootNode();
        private _loadNodesAsync(nodes);
        /**
        * @ignore
        */
        _loadSceneAsync(context: string, scene: ILoaderScene): Promise<void>;
        private _forEachPrimitive(node, callback);
        private _getMeshes();
        private _getSkeletons();
        private _getAnimationGroups();
        private _startAnimations();
        /**
        * @ignore
        */
        _loadNodeAsync(context: string, node: ILoaderNode): Promise<void>;
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
        private _loadAnimationsAsync();
        private _loadAnimationAsync(context, animation);
        private _loadAnimationChannelAsync(context, animationContext, animation, channel, babylonAnimationGroup);
        private _loadAnimationSamplerAsync(context, sampler);
        private _loadBufferAsync(context, buffer);
        /**
        * @ignore
        */
        _loadBufferViewAsync(context: string, bufferView: ILoaderBufferView): Promise<ArrayBufferView>;
        private _loadAccessorAsync(context, accessor);
        /**
        * @ignore
        */
        _loadVertexBufferViewAsync(context: string, bufferView: ILoaderBufferView, kind: string): Promise<Buffer>;
        private _loadVertexAccessorAsync(context, accessor, kind);
        private _getDefaultMaterial(drawMode);
        private _loadMaterialMetallicRoughnessPropertiesAsync(context, material, babylonMaterial);
        /**
        * @ignore
        */
        _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Promise<void>;
        /**
        * @ignore
        */
        _createMaterial<T extends Material>(type: MaterialConstructor<T>, name: string, drawMode: number): T;
        /**
        * @ignore
        */
        _loadMaterialBasePropertiesAsync(context: string, material: ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void>;
        /**
        * @ignore
        */
        _loadMaterialAlphaProperties(context: string, material: ILoaderMaterial, babylonMaterial: PBRMaterial): void;
        /**
        * @ignore
        */
        _loadTextureAsync(context: string, textureInfo: ITextureInfo, assign: (texture: Texture) => void): Promise<void>;
        private _loadSampler(context, sampler);
        private _loadImageAsync(context, image);
        /**
        * @ignore
        */
        _loadUriAsync(context: string, uri: string): Promise<ArrayBufferView>;
        private _onProgress();
        /**
        * @ignore
        */
        static _GetProperty<T>(context: string, array: ArrayLike<T> | undefined, index: number | undefined): T;
        private static _GetTextureWrapMode(context, mode);
        private static _GetTextureSamplingMode(context, magFilter?, minFilter?);
        private static _GetNumComponents(context, type);
        private static _ValidateUri(uri);
        private static _GetDrawMode(context, mode);
        private _compileMaterialsAsync();
        private _compileShadowGeneratorsAsync();
        private _clear();
        /**
        * @ignore
        */
        _applyExtensions<T>(actionAsync: (extension: GLTFLoaderExtension) => Nullable<Promise<T>>): Nullable<Promise<T>>;
    }
}


declare module BABYLON.GLTF2 {
    /**
     * Abstract class that can be implemented to extend existing gltf loader behavior.
     */
    abstract class GLTFLoaderExtension implements IGLTFLoaderExtension, IDisposable {
        enabled: boolean;
        readonly abstract name: string;
        protected _loader: GLTFLoader;
        constructor(loader: GLTFLoader);
        dispose(): void;
        /** Override this method to modify the default behavior for loading scenes. */
        protected _loadSceneAsync(context: string, node: ILoaderScene): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading nodes. */
        protected _loadNodeAsync(context: string, node: ILoaderNode): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading mesh primitive vertex data. */
        protected _loadVertexDataAsync(context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;
        /** Override this method to modify the default behavior for loading materials. */
        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        /** Override this method to modify the default behavior for loading uris. */
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
        /** Helper method called by a loader extension to load an glTF extension. */
        protected _loadExtensionAsync<TProperty, TResult = void>(context: string, property: IProperty, actionAsync: (extensionContext: string, extension: TProperty) => Promise<TResult>): Nullable<Promise<TResult>>;
        /** Helper method called by the loader to allow extensions to override loading scenes. */
        static _LoadSceneAsync(loader: GLTFLoader, context: string, scene: ILoaderScene): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading nodes. */
        static _LoadNodeAsync(loader: GLTFLoader, context: string, node: ILoaderNode): Nullable<Promise<void>>;
        /** Helper method called by the loader to allow extensions to override loading mesh primitive vertex data. */
        static _LoadVertexDataAsync(loader: GLTFLoader, context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;
        /** Helper method called by the loader to allow extensions to override loading materials. */
        static _LoadMaterialAsync(loader: GLTFLoader, context: string, material: ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
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
        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
        /**
         * Gets an array of LOD properties from lowest to highest.
         */
        private _getLODs<T>(context, property, array, ids);
    }
}


/** Module defining extensions to gltf */
declare module BABYLON.GLTF2.Extensions {
    class KHR_draco_mesh_compression extends GLTFLoaderExtension {
        readonly name: string;
        private _dracoCompression;
        constructor(loader: GLTFLoader);
        dispose(): void;
        protected _loadVertexDataAsync(context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHR_materials_pbrSpecularGlossiness extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        private _loadSpecularGlossinessPropertiesAsync(context, material, properties, babylonMaterial);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHR_materials_unlit extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>>;
        private _loadUnlitPropertiesAsync(context, material, babylonMaterial);
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
