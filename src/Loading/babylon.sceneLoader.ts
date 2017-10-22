module BABYLON {
    export interface ISceneLoaderPluginExtensions {
        [extension: string]: {
            isBinary: boolean;
        };
    }

    export interface ISceneLoaderPlugin {
        name: string;
        extensions: string | ISceneLoaderPluginExtensions;
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[], onError?: (message: string, exception?: any) => void) => boolean;
        load: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void) => boolean;
        canDirectLoad?: (data: string) => boolean;
    }

    export interface ISceneLoaderPluginAsync {
        name: string;
        extensions: string | ISceneLoaderPluginExtensions;
        importMeshAsync: (meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
        loadAsync: (scene: Scene, data: string, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string, exception?: any) => void) => void;
        canDirectLoad?: (data: string) => boolean;
    }

    interface IRegisteredPlugin {
        plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
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

            var dotPosition = sceneFilename.lastIndexOf(".");

            var queryStringPosition = sceneFilename.indexOf("?");

            if (queryStringPosition === -1) {
                queryStringPosition = sceneFilename.length;
            }

            var extension = sceneFilename.substring(dotPosition, queryStringPosition).toLowerCase();
            return SceneLoader._getPluginForExtension(extension);
        }

        // use babylon file loader directly if sceneFilename is prefixed with "data:"
        private static _getDirectLoad(sceneFilename: string): Nullable<string> {
            if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                return sceneFilename.substr(5);
            }

            return null;
        }

        private static _loadData(rootUrl: string, sceneFilename: string, scene: Scene, onSuccess: (plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync, data: any) => void, onProgress: (event: ProgressEvent) => void, onError: (message: Nullable<string>, exception?: any) => void): void {
            var directLoad = SceneLoader._getDirectLoad(sceneFilename);
            var registeredPlugin = directLoad ? SceneLoader._getPluginForDirectLoad(sceneFilename) : SceneLoader._getPluginForFilename(sceneFilename);
            var plugin = registeredPlugin.plugin;
            var useArrayBuffer = registeredPlugin.isBinary;
            var database: Database;

            SceneLoader.OnPluginActivatedObservable.notifyObservers(registeredPlugin.plugin);

            var dataCallback = (data: any) => {
                if (scene.isDisposed) {
                    onError("Scene has been disposed");
                    return;
                }

                scene.database = database;

                try {
                    onSuccess(plugin, data);
                }
                catch (e) {
                    onError(null, e);
                }
            };

            var manifestChecked = (success: any) => {
                Tools.LoadFile(rootUrl + sceneFilename, dataCallback, onProgress, database, useArrayBuffer, request => {
                    if (request) {
                        onError(request.status + " " + request.statusText);
                    }
                });
            };

            if (directLoad) {
                dataCallback(directLoad);
                return;
            }

            if (rootUrl.indexOf("file:") === -1) {
                if (scene.getEngine().enableOfflineSupport) {
                    // Checking if a manifest file has been set for this scene and if offline mode has been requested
                    database = new Database(rootUrl + sceneFilename, manifestChecked);
                }
                else {
                    manifestChecked(true);
                }
            }
            // Loading file from disk via input file or drag'n'drop
            else {
                var fileOrString = <any> sceneFilename;

                if (fileOrString.name) { // File
                    Tools.ReadFile(fileOrString, dataCallback, onProgress, useArrayBuffer);
                } else if (FilesInput.FilesToLoad[sceneFilename]) {
                    Tools.ReadFile(FilesInput.FilesToLoad[sceneFilename], dataCallback, onProgress, useArrayBuffer);
                } else {
                    onError("Unable to find file named " + sceneFilename);
                    return;
                }
            }
        }

        // Public functions
        public static GetPluginForExtension(extension: string): ISceneLoaderPlugin | ISceneLoaderPluginAsync {
            return SceneLoader._getPluginForExtension(extension).plugin;
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
        public static ImportMesh(meshNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onSuccess: Nullable<(meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void> = null, onProgress: Nullable<(event: ProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null): void {
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return;
            }

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            var errorHandler = (message: Nullable<string>, exception?: any) => {
                let errorMessage = "Unable to import meshes from " + rootUrl + sceneFilename + (message ? ": " + message : "");
                if (onError) {
                    onError(scene, errorMessage, exception);
                } else {
                    Tools.Error(errorMessage);
                    // should the exception be thrown?
                }
                scene._removePendingData(loadingToken);
            };

            var progressHandler = (event: ProgressEvent) => {
                if (onProgress) {
                    onProgress(event);
                }
            };

            SceneLoader._loadData(rootUrl, sceneFilename, scene, (plugin, data) => {
                if ((<any>plugin).importMesh) {
                    var syncedPlugin = <ISceneLoaderPlugin>plugin;
                    var meshes = new Array<AbstractMesh>();
                    var particleSystems = new Array<ParticleSystem>();
                    var skeletons = new Array<Skeleton>();
                    if (!syncedPlugin.importMesh(meshNames, scene, data, rootUrl, meshes, particleSystems, skeletons, errorHandler)) {
                        return;
                    }

                    if (onSuccess) {
                        // wrap onSuccess with try-catch to know if something went wrong.
                        try {
                            scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                            onSuccess(meshes, particleSystems, skeletons);
                            scene._removePendingData(loadingToken);
                        } catch (e) {
                            let message = 'Error in onSuccess callback.';
                            errorHandler(message, e);
                        }
                    }
                }
                else {
                    var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                    asyncedPlugin.importMeshAsync(meshNames, scene, data, rootUrl, (meshes, particleSystems, skeletons) => {
                        if (onSuccess) {
                            try {
                                scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                                onSuccess(meshes, particleSystems, skeletons);
                                scene._removePendingData(loadingToken);
                            } catch (e) {
                                let message = 'Error in onSuccess callback.';
                                errorHandler(message, e);
                            }
                        }
                    }, progressHandler, errorHandler);
                }
            }, progressHandler, errorHandler);
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
        public static Load(rootUrl: string, sceneFilename: any, engine: Engine, onSuccess?: (scene: Scene) => void, onProgress?: (event: ProgressEvent) => void, onError?: (scene: Scene, message: string, exception?: any) => void): void {
            SceneLoader.Append(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError);
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
        public static Append(rootUrl: string, sceneFilename: any, scene: Scene, onSuccess?: (scene: Scene) => void, onProgress?: (event: ProgressEvent) => void, onError?: (scene: Scene, message: string, exception?: any) => void): void {
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return;
            }

            if (SceneLoader.ShowLoadingScreen) {
                scene.getEngine().displayLoadingUI();
            }

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            var errorHandler = (message: Nullable<string>, exception?: any) => {
                let errorMessage = "Unable to load from " + rootUrl + sceneFilename + (message ? ": " + message : "");
                if (onError) {
                    onError(scene, errorMessage, exception);
                } else {
                    Tools.Error(errorMessage);
                    // should the exception be thrown?
                }
                scene._removePendingData(loadingToken);
                scene.getEngine().hideLoadingUI();
            };

            var progressHandler = (event: ProgressEvent) => {
                if (onProgress) {
                    onProgress(event);
                }
            };

            SceneLoader._loadData(rootUrl, sceneFilename, scene, (plugin, data) => {
                if ((<any>plugin).load) {
                    var syncedPlugin = <ISceneLoaderPlugin>plugin;
                    if (!syncedPlugin.load(scene, data, rootUrl, errorHandler)) {
                        return;
                    }

                    if (onSuccess) {
                        try {
                            onSuccess(scene);
                        } catch (e) {
                            errorHandler("Error in onSuccess callback", e);
                        }
                    }

                    scene.loadingPluginName = plugin.name;
                    scene._removePendingData(loadingToken);
                } else {
                    var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                    asyncedPlugin.loadAsync(scene, data, rootUrl, () => {
                        if (onSuccess) {
                            onSuccess(scene);
                        }

                        scene.loadingPluginName = plugin.name;
                        scene._removePendingData(loadingToken);
                    }, progressHandler, errorHandler);
                }

                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(() => {
                        scene.getEngine().hideLoadingUI();
                    });
                }
            }, progressHandler, errorHandler);
        }
    };
}
