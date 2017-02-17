module BABYLON {
    export interface ISceneLoaderPluginExtensions {
        [extension: string]: {
            isBinary: boolean;
        };
    }

    export interface ISceneLoaderPlugin {
        extensions: string | ISceneLoaderPluginExtensions;
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => boolean;
        load: (scene: Scene, data: string, rootUrl: string) => boolean;
    }

    export interface ISceneLoaderPluginAsync {
        extensions: string | ISceneLoaderPluginExtensions;
        importMeshAsync: (meshesNames: any, scene: Scene, data: any, rootUrl: string, onsuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onerror?: () => void) => void;
        loadAsync: (scene: Scene, data: string, rootUrl: string, onsuccess: () => void, onerror: () => void) => boolean;
    }

    interface IRegisteredPlugin {
        plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
        isBinary: boolean;
    }

    export class SceneLoader {
        // Flags
        private static _ForceFullSceneLoadingForIncremental = false;
        private static _ShowLoadingScreen = true;

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

        public static get ShowLoadingScreen() {
            return SceneLoader._ShowLoadingScreen;
        }

        public static set ShowLoadingScreen(value: boolean) {
            SceneLoader._ShowLoadingScreen = value;
        }

        public static get loggingLevel() {
            return SceneLoader._loggingLevel;
        }

        public static set loggingLevel(value: number) {
            SceneLoader._loggingLevel = value;
        }

        // Members
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
        private static _getDirectLoad(sceneFilename: string): string {
            if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                return sceneFilename.substr(5);
            }

            return null;
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

        public static ImportMesh(meshesNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onsuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, progressCallBack?: () => void, onerror?: (scene: Scene, message: string, exception?: any) => void): void {
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return;
            }

            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return;
            }

            var directLoad = SceneLoader._getDirectLoad(sceneFilename);

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            var manifestChecked = success => {
                scene.database = database;

                var registeredPlugin = directLoad ? SceneLoader._getDefaultPlugin() : SceneLoader._getPluginForFilename(sceneFilename);
                var plugin = registeredPlugin.plugin;
                var useArrayBuffer = registeredPlugin.isBinary;

                var importMeshFromData = data => {
                    var meshes = [];
                    var particleSystems = [];
                    var skeletons = [];

                    try {
                        if ((<any>plugin).importMesh) {
                            var syncedPlugin = <ISceneLoaderPlugin>plugin;
                            if (!syncedPlugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons)) {
                                if (onerror) {
                                    onerror(scene, 'Unable to import meshes from ' + rootUrl + sceneFilename);
                                }
                                scene._removePendingData(loadingToken);
                                return;
                            }

                            if (onsuccess) {
                                scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                                onsuccess(meshes, particleSystems, skeletons);
                                scene._removePendingData(loadingToken);
                            }
                        } else {
                            var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                            asyncedPlugin.importMeshAsync(meshesNames, scene, data, rootUrl, (meshes, particleSystems, skeletons) => {
                                if (onsuccess) {
                                    scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                                    onsuccess(meshes, particleSystems, skeletons);
                                    scene._removePendingData(loadingToken);
                                }
                            }, () => {
                                if (onerror) {
                                    onerror(scene, 'Unable to import meshes from ' + rootUrl + sceneFilename);
                                }
                                scene._removePendingData(loadingToken);
                            });
                        }
                    } catch (e) {
                        if (onerror) {
                            onerror(scene, 'Unable to import meshes from ' + rootUrl + sceneFilename, e);
                        }
                        scene._removePendingData(loadingToken);
                    }
                };

                if (directLoad) {
                    importMeshFromData(directLoad);
                    return;
                }

                Tools.LoadFile(rootUrl + sceneFilename, data => {
                    importMeshFromData(data);
                }, progressCallBack, database, useArrayBuffer);
            };

            if (scene.getEngine().enableOfflineSupport && !directLoad) {
                // Checking if a manifest file has been set for this scene and if offline mode has been requested
                var database = new Database(rootUrl + sceneFilename, manifestChecked);
            }
            else {
                // If the scene is a data stream or offline support is not enabled, it's a direct load
                manifestChecked(true);
            }
        }
        
        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        */
        public static Load(rootUrl: string, sceneFilename: any, engine: Engine, onsuccess?: (scene: Scene) => void, progressCallBack?: any, onerror?: (scene: Scene) => void): void {
            SceneLoader.Append(rootUrl, sceneFilename, new Scene(engine), onsuccess, progressCallBack, onerror);
        }

        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        */
        public static Append(rootUrl: string, sceneFilename: any, scene: Scene, onsuccess?: (scene: Scene) => void, progressCallBack?: any, onerror?: (scene: Scene) => void): void {

            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return;
            }

            var directLoad = SceneLoader._getDirectLoad(sceneFilename);
            var registeredPlugin = directLoad ? SceneLoader._getDefaultPlugin() : SceneLoader._getPluginForFilename(sceneFilename);
            var plugin = registeredPlugin.plugin;
            var useArrayBuffer = registeredPlugin.isBinary;
            var database;

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            if (SceneLoader.ShowLoadingScreen) {
                scene.getEngine().displayLoadingUI();
            }

            var loadSceneFromData = data => {
                scene.database = database;

                if ((<any>plugin).load) {
                    var syncedPlugin = <ISceneLoaderPlugin>plugin;
                    if (!syncedPlugin.load(scene, data, rootUrl)) {
                        if (onerror) {
                            onerror(scene);
                        }

                        scene._removePendingData(loadingToken);
                        scene.getEngine().hideLoadingUI();
                        return;
                    }

                    if (onsuccess) {
                        onsuccess(scene);
                    }
                    scene._removePendingData(loadingToken);
                } else {
                    var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                    asyncedPlugin.loadAsync(scene, data, rootUrl, () => {
                        if (onsuccess) {
                            onsuccess(scene);
                        }

                        scene._removePendingData(loadingToken);
                    }, () => {
                        if (onerror) {
                            onerror(scene);
                        }

                        scene._removePendingData(loadingToken);
                        scene.getEngine().hideLoadingUI();
                    });
                }

                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(() => {
                        scene.getEngine().hideLoadingUI();
                    });
                }
            };

            var manifestChecked = success => {
                Tools.LoadFile(rootUrl + sceneFilename, loadSceneFromData, progressCallBack, database, useArrayBuffer);
            };

            if (directLoad) {
                loadSceneFromData(directLoad);
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
                Tools.ReadFile(sceneFilename, loadSceneFromData, progressCallBack, useArrayBuffer);
            }
        }
    };
}
