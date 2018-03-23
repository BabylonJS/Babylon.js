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
        /**
         * The friendly name of this plugin.
         */
        name: string;

        /**
         * The file extensions supported by this plugin.
         */
        extensions: string | ISceneLoaderPluginExtensions;

        /**
         * Import meshes into a scene.
         * @param meshesNames An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
         * @param scene The scene to import into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param meshes The meshes array to import into
         * @param particleSystems The particle systems array to import into
         * @param skeletons The skeletons array to import into
         * @param onError The callback when import fails
         * @returns True if successful or false otherwise
         */
        importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[], onError?: (message: string, exception?: any) => void): boolean;

        /**
         * Load into a scene.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onError The callback when import fails
         * @returns true if successful or false otherwise
         */
        load(scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): boolean;

        /**
         * The callback that returns true if the data can be directly loaded.
         */
        canDirectLoad?: (data: string) => boolean;

        /**
         * The callback that allows custom handling of the root url based on the response url.
         */
        rewriteRootURL?: (rootUrl: string, responseURL?: string) => string;

        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onError The callback when import fails
         * @returns The loaded asset container
         */
        loadAssetContainer(scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer;
    }

    export interface ISceneLoaderPluginAsync {
        /**
         * The friendly name of this plugin.
         */
        name: string;

        /**
         * The file extensions supported by this plugin.
         */
        extensions: string | ISceneLoaderPluginExtensions;

        /**
         * Import meshes into a scene.
         * @param meshesNames An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
         * @param scene The scene to import into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @returns The loaded meshes, particle systems, and skeletons
         */
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{ meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[] }>;

        /**
         * Load into a scene.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @returns Nothing
         */
        loadAsync(scene: Scene, data: string, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void>;

        /**
         * The callback that returns true if the data can be directly loaded.
         */
        canDirectLoad?: (data: string) => boolean;

        /**
         * The callback that allows custom handling of the root url based on the response url.
         */
        rewriteRootURL?: (rootUrl: string, responseURL?: string) => string;

        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @returns The loaded asset container
         */
        loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<AssetContainer>;
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
                } : undefined, database, useArrayBuffer, (request, exception) => {
                    onError("Failed to load scene." + (exception ? "" : " " + exception.message), exception);
                });
            };

            if (directLoad) {
                dataCallback(directLoad);
                return plugin;
            }

            if (rootUrl.indexOf("file:") === -1) {
                let canUseOfflineSupport = scene.getEngine().enableOfflineSupport;
                if (canUseOfflineSupport) {
                    // Also check for exceptions
                    let exceptionFound = false;
                    for (var regex of scene.disableOfflineSupportExceptionRules) {
                        if (regex.test(rootUrl + sceneFilename)) {
                            exceptionFound = true;
                            break;
                        }
                    }

                    canUseOfflineSupport = !exceptionFound;
                }

                if (canUseOfflineSupport) {
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
         * @param pluginExtension the extension used to determine the plugin
         * @returns The loaded plugin
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
                        rootUrl = Tools.GetFolderPath(rootUrl, true);
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
                    asyncedPlugin.importMeshAsync(meshNames, scene, data, rootUrl, progressHandler).then(result => {
                        scene.loadingPluginName = plugin.name;
                        successHandler(result.meshes, result.particleSystems, result.skeletons);
                    }).catch(error => {
                        errorHandler(error.message, error);
                    });
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        }

        /**
        * Import meshes into a scene
        * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported 
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene the instance of BABYLON.Scene to append to
        * @param onProgress a callback with a progress event for each file being loaded
        * @param pluginExtension the extension used to determine the plugin
        * @returns The loaded list of imported meshes, particleSystems, and skeletons
        */
        public static ImportMeshAsync(meshNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<{ meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[] }> {
            return new Promise((resolve, reject) => {
                SceneLoader.ImportMesh(meshNames, rootUrl, sceneFilename, scene, (meshes, particleSystems, skeletons) => {
                    resolve({
                        meshes: meshes,
                        particleSystems: particleSystems,
                        skeletons: skeletons
                    });
                }, onProgress, (scene, message, exception) => {
                    reject(exception || new Error(message));
                });
            });
        }

        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        * @param pluginExtension the extension used to determine the plugin
        * @returns The loaded plugin
        */
        public static Load(rootUrl: string, sceneFilename: any, engine: Engine, onSuccess: Nullable<(scene: Scene) => void> = null, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
            return SceneLoader.Append(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError, pluginExtension);
        }

        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        * @param onProgress a callback with a progress event for each file being loaded
        * @param pluginExtension the extension used to determine the plugin
        * @returns The loaded scene
        */
        public static LoadAsync(rootUrl: string, sceneFilename: any, engine: Engine, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<Scene> {
            return new Promise((resolve, reject) => {
                SceneLoader.Load(rootUrl, sceneFilename, engine, scene => {
                    resolve(scene);
                }, onProgress, (scene, message, exception) => {
                    reject(exception || new Error(message));
                }, pluginExtension);
            });
        }

        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        * @param pluginExtension the extension used to determine the plugin
        * @returns The loaded plugin
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
                    rootUrl = Tools.GetFolderPath(rootUrl, true);
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
                    asyncedPlugin.loadAsync(scene, data, rootUrl, progressHandler).then(() => {
                        scene.loadingPluginName = plugin.name;
                        successHandler();
                    }).catch(error => {
                        errorHandler(error.message, error);
                    });
                }

                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(() => {
                        scene.getEngine().hideLoadingUI();
                    });
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        }

        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        * @param onProgress a callback with a progress event for each file being loaded
        * @param pluginExtension the extension used to determine the plugin
        * @returns The given scene
        */
        public static AppendAsync(rootUrl: string, sceneFilename: any, scene: Scene, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<Scene> {
            return new Promise((resolve, reject) => {
                SceneLoader.Append(rootUrl, sceneFilename, scene, scene => {
                    resolve(scene);
                }, onProgress, (scene, message, exception) => {
                    reject(exception || new Error(message));
                }, pluginExtension);
            });
        }

        /**
        * Load a scene into an asset container
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        * @param pluginExtension the extension used to determine the plugin
        * @returns The loaded plugin
        */
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
                if ((<any>plugin).loadAssetContainer) {
                    var syncedPlugin = <ISceneLoaderPlugin>plugin;
                    var assetContainer = syncedPlugin.loadAssetContainer(scene, data, rootUrl, errorHandler);
                    if (!assetContainer) {
                        return;
                    }

                    scene.loadingPluginName = plugin.name;
                    successHandler(assetContainer);
                } else if ((<any>plugin).loadAssetContainerAsync) {
                    var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                    asyncedPlugin.loadAssetContainerAsync(scene, data, rootUrl, progressHandler).then(assetContainer => {
                        scene.loadingPluginName = plugin.name;
                        successHandler(assetContainer);
                    }).catch(error => {
                        errorHandler(error.message, error);
                    });
                } else {
                    errorHandler("LoadAssetContainer is not supported by this plugin. Plugin did not provide a loadAssetContainer or loadAssetContainerAsync method.")
                }

                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(() => {
                        scene.getEngine().hideLoadingUI();
                    });
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        }

        /**
        * Load a scene into an asset container
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        * @param onProgress a callback with a progress event for each file being loaded
        * @param pluginExtension the extension used to determine the plugin
        * @returns The loaded asset container
        */
        public static LoadAssetContainerAsync(rootUrl: string, sceneFilename: any, scene: Scene, onProgress: Nullable<(event: SceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<AssetContainer> {
            return new Promise((resolve, reject) => {
                SceneLoader.LoadAssetContainer(rootUrl, sceneFilename, scene, assetContainer => {
                    resolve(assetContainer);
                }, onProgress, (scene, message, exception) => {
                    reject(exception || new Error(message));
                }, pluginExtension);
            });
        }
    };
}
