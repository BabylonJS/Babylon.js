module BABYLON {
    export class SceneLoaderProgressEvent {
        constructor(public readonly lengthComputable: boolean, public readonly loaded: number, public readonly total: number) {
        }

        public static FromProgressEvent(event: ProgressEvent): SceneLoaderProgressEvent {
            return new SceneLoaderProgressEvent(event.lengthComputable, event.loaded, event.total);
        }
    }

    export interface ISceneLoaderPluginExtensions {
        [extension: string]: {
            isBinary: boolean;
        };
    }

    export interface ISceneLoaderPluginFactory {
        name: string;
        createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync;
        canDirectLoad?: (data: string) => boolean;
    }

    export interface ISceneLoaderPlugin {
        name: string;
        extensions: string | ISceneLoaderPluginExtensions;
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[], onError?: (message: string, exception?: any) => void) => boolean;
        load: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void) => boolean;
        canDirectLoad?: (data: string) => boolean;
        rewriteRootURL?: (rootUrl: string, responseURL?: string) => string;
        loadAssets: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void) => Nullable<AssetContainer>;
    }

    export interface ISceneLoaderPluginAsync {
        name: string;
        extensions: string | ISceneLoaderPluginExtensions;
        importMeshAsync: (meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void) => void;
        loadAsync: (scene: Scene, data: string, rootUrl: string, onSuccess?: () => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void) => void;
        canDirectLoad?: (data: string) => boolean;
        rewriteRootURL?: (rootUrl: string, responseURL?: string) => string;
        loadAssetsAsync: (scene: Scene, data: string, rootUrl: string, onSuccess?: (assets: Nullable<AssetContainer>) => void, onProgress?: (event: SceneLoaderProgressEvent) => void, onError?: (message: string, exception?: any) => void) => void;
    }

    interface IRegisteredPlugin {
        plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory;
        isBinary: boolean;
    }

    export class SceneLoader {
        // Flags
        private static _ForceFullSceneLoadingForIncremental = false;
        private static _ShowLoadingScreen = true;
        private static _CleanBoneMatrixWeights = false;

        public static get NO_LOGGING(): number {
            return 0;
        }

        public static get MINIMAL_LOGGING(): number {
            return 1;
        }

        public static get SUMMARY_LOGGING(): number {
            return 2;
        }

        public static get DETAILED_LOGGING(): number {
            return 3;
        }

        private static _loggingLevel = SceneLoader.NO_LOGGING;

        public static get ForceFullSceneLoadingForIncremental() {
            return SceneLoader._ForceFullSceneLoadingForIncremental;
        }

        public static set ForceFullSceneLoadingForIncremental(value: boolean) {
            SceneLoader._ForceFullSceneLoadingForIncremental = value;
        }

        public static get ShowLoadingScreen(): boolean {
            return SceneLoader._ShowLoadingScreen;
        }

        public static set ShowLoadingScreen(value: boolean) {
            SceneLoader._ShowLoadingScreen = value;
        }

        public static get loggingLevel(): number {
            return SceneLoader._loggingLevel;
        }

        public static set loggingLevel(value: number) {
            SceneLoader._loggingLevel = value;
        }

        public static get CleanBoneMatrixWeights(): boolean {
            return SceneLoader._CleanBoneMatrixWeights;
        }

        public static set CleanBoneMatrixWeights(value: boolean) {
            SceneLoader._CleanBoneMatrixWeights = value;
        }

        // Members
        public static OnPluginActivatedObservable = new Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>();

        private static _registeredPlugins: { [extension: string]: IRegisteredPlugin } = {};

        private static _getDefaultPlugin(): IRegisteredPlugin {
            return SceneLoader._registeredPlugins[".babylon"];
        }

        private static _getPluginForExtension(extension: string): IRegisteredPlugin {
            var registeredPlugin = SceneLoader._registeredPlugins[extension];
            if (registeredPlugin) {
                return registeredPlugin;
            }
            Tools.Warn("Unable to find a plugin to load " + extension + " files. Trying to use .babylon default plugin.");
            return SceneLoader._getDefaultPlugin();
        }

        private static _getPluginForDirectLoad(data: string): IRegisteredPlugin {
            for (var extension in SceneLoader._registeredPlugins) {
                var plugin = SceneLoader._registeredPlugins[extension].plugin;

                if (plugin.canDirectLoad && plugin.canDirectLoad(data)) {
                    return SceneLoader._registeredPlugins[extension];
                }
            }

            return SceneLoader._getDefaultPlugin();
        }

        private static _getPluginForFilename(sceneFilename: any): IRegisteredPlugin {
            if (sceneFilename.name) {
                sceneFilename = sceneFilename.name;
            }

            var queryStringPosition = sceneFilename.indexOf("?");

            if (queryStringPosition !== -1) {
                sceneFilename = sceneFilename.substring(0, queryStringPosition);
            }

            var dotPosition = sceneFilename.lastIndexOf(".");

            var extension = sceneFilename.substring(dotPosition, sceneFilename.length).toLowerCase();
            return SceneLoader._getPluginForExtension(extension);
        }

        // use babylon file loader directly if sceneFilename is prefixed with "data:"
        private static _getDirectLoad(sceneFilename: string): Nullable<string> {
            if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                return sceneFilename.substr(5);
            }

            return null;
        }

        private static _loadData(rootUrl: string, sceneFilename: string, scene: Scene, onSuccess: (plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync, data: any, responseURL?: string) => void, onProgress: ((event: SceneLoaderProgressEvent) => void) | undefined, onError: (message: string, exception?: any) => void, onDispose: () => void, pluginExtension: Nullable<string>): ISceneLoaderPlugin | ISceneLoaderPluginAsync {
            let directLoad = SceneLoader._getDirectLoad(sceneFilename);
            let registeredPlugin = pluginExtension ? SceneLoader._getPluginForExtension(pluginExtension) : (directLoad ? SceneLoader._getPluginForDirectLoad(sceneFilename) : SceneLoader._getPluginForFilename(sceneFilename));

            let plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
            if ((registeredPlugin.plugin as ISceneLoaderPluginFactory).createPlugin) {
                plugin = (registeredPlugin.plugin as ISceneLoaderPluginFactory).createPlugin();
            }
            else {
                plugin = <any>registeredPlugin.plugin;
            }

            let useArrayBuffer = registeredPlugin.isBinary;
            let database: Database;

            SceneLoader.OnPluginActivatedObservable.notifyObservers(plugin);

            let dataCallback = (data: any, responseURL?: string) => {
                if (scene.isDisposed) {
                    onError("Scene has been disposed");
                    return;
                }

                scene.database = database;

                onSuccess(plugin, data, responseURL);
            };

            let request: Nullable<IFileRequest> = null;
            let pluginDisposed = false;
            let onDisposeObservable = (plugin as any).onDisposeObservable as Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
            if (onDisposeObservable) {
                onDisposeObservable.add(() => {
                    pluginDisposed = true;

                    if (request) {
                        request.abort();
                        request = null;
                    }

                    onDispose();
                });
            }

            let manifestChecked = () => {
                if (pluginDisposed) {
                    return;
                }

                let url = rootUrl + sceneFilename;
                request = Tools.LoadFile(url, dataCallback, onProgress ? event => {
                    onProgress(SceneLoaderProgressEvent.FromProgressEvent(event));
                }: undefined, database, useArrayBuffer, (request, exception) => {
                    onError("Failed to load scene." + (exception ? "" : " " + exception.message), exception);
                });
            };

            if (directLoad) {
                dataCallback(directLoad);
                return plugin;
            }

            if (rootUrl.indexOf("file:") === -1) {
                if (scene.getEngine().enableOfflineSupport) {
                    // Checking if a manifest file has been set for this scene and if offline mode has been requested
                    database = new Database(rootUrl + sceneFilename, manifestChecked);
                }
                else {
                    manifestChecked();
                }
            }
            // Loading file from disk via input file or drag'n'drop
            else {
                let fileOrString = <any>sceneFilename;

                if (fileOrString.name) { // File
                    request = Tools.ReadFile(fileOrString, dataCallback, onProgress, useArrayBuffer);
                } else if (FilesInput.FilesToLoad[sceneFilename]) {
                    request = Tools.ReadFile(FilesInput.FilesToLoad[sceneFilename], dataCallback, onProgress, useArrayBuffer);
                } else {
                    onError("Unable to find file named " + sceneFilename);
                }
            }
            return plugin;
        }

        // Public functions
        public static GetPluginForExtension(extension: string): ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory {
            return SceneLoader._getPluginForExtension(extension).plugin;
        }

        public static IsPluginForExtensionAvailable(extension: string): boolean {
            return !!SceneLoader._registeredPlugins[extension];
        }

        public static RegisterPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync): void {
            if (typeof plugin.extensions === "string") {
                var extension = <string>plugin.extensions;
                SceneLoader._registeredPlugins[extension.toLowerCase()] = {
                    plugin: plugin,
                    isBinary: false
                };
            }
            else {
                var extensions = <ISceneLoaderPluginExtensions>plugin.extensions;
                Object.keys(extensions).forEach(extension => {
                    SceneLoader._registeredPlugins[extension.toLowerCase()] = {
                        plugin: plugin,
                        isBinary: extensions[extension].isBinary
                    };
                });
            }
        }

        /**
        * Import meshes into a scene
        * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported 
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with a list of imported meshes, particleSystems, and skeletons when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        public static ImportMesh(meshNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onSuccess: Nullable<(meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void> = null, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return null;
            }

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            var disposeHandler = () => {
                scene._removePendingData(loadingToken);
            };

            var errorHandler = (message: string, exception?: any) => {
                let errorMessage = "Unable to import meshes from " + rootUrl + sceneFilename + ": " + message;

                if (onError) {
                    onError(scene, errorMessage, exception);
                } else {
                    Tools.Error(errorMessage);
                    // should the exception be thrown?
                }

                disposeHandler();
            };

            var progressHandler = onProgress ? (event: SceneLoaderProgressEvent) => {
                try {
                    onProgress(event);
                }
                catch (e) {
                    errorHandler("Error in onProgress callback", e);
                }
            } : undefined;

            var successHandler = (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => {
                scene.importedMeshesFiles.push(rootUrl + sceneFilename);

                if (onSuccess) {
                    try {
                        onSuccess(meshes, particleSystems, skeletons);
                    }
                    catch (e) {
                        errorHandler("Error in onSuccess callback", e);
                    }
                }

                scene._removePendingData(loadingToken);
            };

            return SceneLoader._loadData(rootUrl, sceneFilename, scene, (plugin, data, responseURL) => {
                if (plugin.rewriteRootURL) {
                    rootUrl = plugin.rewriteRootURL(rootUrl, responseURL);
                }

                if (sceneFilename === "") {
                    if (sceneFilename === "") {
                        rootUrl = this._StripFilenameFromRootUrl(rootUrl);
                    }
                }

                if ((<any>plugin).importMesh) {
                    var syncedPlugin = <ISceneLoaderPlugin>plugin;
                    var meshes = new Array<AbstractMesh>();
                    var particleSystems = new Array<ParticleSystem>();
                    var skeletons = new Array<Skeleton>();

                    if (!syncedPlugin.importMesh(meshNames, scene, data, rootUrl, meshes, particleSystems, skeletons, errorHandler)) {
                        return;
                    }

                    scene.loadingPluginName = plugin.name;
                    successHandler(meshes, particleSystems, skeletons);
                }
                else {
                    var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                    asyncedPlugin.importMeshAsync(meshNames, scene, data, rootUrl, (meshes, particleSystems, skeletons) => {
                        scene.loadingPluginName = plugin.name;
                        successHandler(meshes, particleSystems, skeletons);
                    }, progressHandler, errorHandler);
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        }

        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        public static Load(rootUrl: string, sceneFilename: any, engine: Engine, onSuccess: Nullable<(scene: Scene) => void> = null, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
            return SceneLoader.Append(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError, pluginExtension);
        }

        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        public static Append(rootUrl: string, sceneFilename: any, scene: Scene, onSuccess: Nullable<(scene: Scene) => void> = null, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return null;
            }

            if (SceneLoader.ShowLoadingScreen) {
                scene.getEngine().displayLoadingUI();
            }

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            var disposeHandler = () => {
                scene._removePendingData(loadingToken);
                scene.getEngine().hideLoadingUI();
            };

            var errorHandler = (message: Nullable<string>, exception?: any) => {
                let errorMessage = "Unable to load from " + rootUrl + sceneFilename + (message ? ": " + message : "");
                if (onError) {
                    onError(scene, errorMessage, exception);
                } else {
                    Tools.Error(errorMessage);
                    // should the exception be thrown?
                }

                disposeHandler();
            };

            var progressHandler = onProgress ? (event: SceneLoaderProgressEvent) => {
                try {
                    onProgress(event);
                }
                catch (e) {
                    errorHandler("Error in onProgress callback", e);
                }
            } : undefined;

            var successHandler = () => {
                if (onSuccess) {
                    try {
                        onSuccess(scene);
                    }
                    catch (e) {
                        errorHandler("Error in onSuccess callback", e);
                    }
                }

                scene._removePendingData(loadingToken);
            };

            return SceneLoader._loadData(rootUrl, sceneFilename, scene, (plugin, data, responseURL) => {
                if (sceneFilename === "") {
                    rootUrl = this._StripFilenameFromRootUrl(rootUrl);
                }

                if ((<any>plugin).load) {
                    var syncedPlugin = <ISceneLoaderPlugin>plugin;
                    if (!syncedPlugin.load(scene, data, rootUrl, errorHandler)) {
                        return;
                    }

                    scene.loadingPluginName = plugin.name;
                    successHandler();
                } else {
                    var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                    asyncedPlugin.loadAsync(scene, data, rootUrl, () => {
                        scene.loadingPluginName = plugin.name;
                        successHandler();
                    }, progressHandler, errorHandler);
                }

                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(() => {
                        scene.getEngine().hideLoadingUI();
                    });
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        }

        private static _StripFilenameFromRootUrl(rootUrl: string): string {
            // We need to strip the filename off from the rootUrl
            let lastSlash = rootUrl.lastIndexOf("/");

            if (lastSlash > -1) {
                rootUrl = rootUrl.substr(0, lastSlash + 1);
            }

            return rootUrl;
        }
        
        public static LoadAssetContainer(
            rootUrl: string,
            sceneFilename: any,
            scene: Scene,
            onSuccess: Nullable<(assets: AssetContainer) => void> = null,
            onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null,
            onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
            pluginExtension: Nullable<string> = null
        ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return null;
            }

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            var disposeHandler = () => {
                scene._removePendingData(loadingToken);
            };

            var errorHandler = (message: Nullable<string>, exception?: any) => {
                let errorMessage = "Unable to load assets from " + rootUrl + sceneFilename + (message ? ": " + message : "");
                if (onError) {
                    onError(scene, errorMessage, exception);
                } else {
                    Tools.Error(errorMessage);
                    // should the exception be thrown?
                }

                disposeHandler();
            };

            var progressHandler = onProgress ? (event: SceneLoaderProgressEvent) => {
                try {
                    onProgress(event);
                }
                catch (e) {
                    errorHandler("Error in onProgress callback", e);
                }
            } : undefined;

            var successHandler = (assets: AssetContainer) => {
                if (onSuccess) {
                    try {
                        onSuccess(assets);
                    }
                    catch (e) {
                        errorHandler("Error in onSuccess callback", e);
                    }
                }

                scene._removePendingData(loadingToken);
            };

            return SceneLoader._loadData(rootUrl, sceneFilename, scene, (plugin, data, responseURL) => {
                if ((<any>plugin).loadAssets) {
                    var syncedPlugin = <ISceneLoaderPlugin>plugin;
                    var assetContainer = syncedPlugin.loadAssets(scene, data, rootUrl, errorHandler);
                    if (!assetContainer) {
                        return;
                    }

                    scene.loadingPluginName = plugin.name;
                    successHandler(assetContainer);
                } else if ((<any>plugin).loadAssetsAsync) {
                    var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                    asyncedPlugin.loadAssetsAsync(scene, data, rootUrl, (assetContainer) => {
                        if(assetContainer){
                            scene.loadingPluginName = plugin.name;
                            successHandler(assetContainer);
                        }
                    }, progressHandler, errorHandler);
                }else{
                    errorHandler("LoadAssetContainer is not supported by this plugin. Plugin did not provide a loadAssets or loadAssetsAsync method.")
                }

                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(() => {
                        scene.getEngine().hideLoadingUI();
                    });
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        }
    };
}
