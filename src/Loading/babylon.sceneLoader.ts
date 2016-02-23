module BABYLON {
    export interface ISceneLoaderPlugin {
        extensions: string;
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => boolean;
        load: (scene: Scene, data: string, rootUrl: string) => boolean;
    }

    export class SceneLoader {
        // Flags
        private static _ForceFullSceneLoadingForIncremental = false;
        private static _ShowLoadingScreen = true;

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

        // Members
        private static _registeredPlugins = new Array<ISceneLoaderPlugin>();

        private static _getPluginForFilename(sceneFilename): ISceneLoaderPlugin {
            var dotPosition = sceneFilename.lastIndexOf(".");

            var queryStringPosition = sceneFilename.indexOf("?");

            if (queryStringPosition === -1) {
                queryStringPosition = sceneFilename.length;
            }

            var extension = sceneFilename.substring(dotPosition, queryStringPosition).toLowerCase();

            for (var index = 0; index < this._registeredPlugins.length; index++) {
                var plugin = this._registeredPlugins[index];

                if (plugin.extensions.indexOf(extension) !== -1) {
                    return plugin;
                }
            }

            return this._registeredPlugins[this._registeredPlugins.length - 1];
        }

        // Public functions
        public static GetPluginForExtension(extension: string): ISceneLoaderPlugin {
            for (var index = 0; index < this._registeredPlugins.length; index++) {
                var plugin = this._registeredPlugins[index];

                if (plugin.extensions.indexOf(extension) !== -1) {
                    return plugin;
                }
            }

            return null;
        }

        public static RegisterPlugin(plugin: ISceneLoaderPlugin): void {
            plugin.extensions = plugin.extensions.toLowerCase();
            SceneLoader._registeredPlugins.push(plugin);
        }

        public static ImportMesh(meshesNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onsuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, progressCallBack?: () => void, onerror?: (scene: Scene, e: any) => void): void {
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return;
            }

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            var manifestChecked = success => {
                scene.database = database;

                var plugin = SceneLoader._getPluginForFilename(sceneFilename);

                var importMeshFromData = data => {
                    var meshes = [];
                    var particleSystems = [];
                    var skeletons = [];

                    try {
                        if (!plugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons)) {
                            if (onerror) {
                                onerror(scene, 'Unable to import meshes from ' + rootUrl + sceneFilename);
                            }
                            scene._removePendingData(loadingToken);
                            return;
                        }
                    } catch (e) {
                        if (onerror) {
                            onerror(scene, 'Unable to import meshes from ' + rootUrl + sceneFilename + ' (Exception: ' + e + ')');
                        }
                        scene._removePendingData(loadingToken);
                        return;
                    }


                    if (onsuccess) {
                        scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                        onsuccess(meshes, particleSystems, skeletons);
                        scene._removePendingData(loadingToken);
                    }
                };

                if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                    // Direct load
                    importMeshFromData(sceneFilename.substr(5));
                    return;
                }

                Tools.LoadFile(rootUrl + sceneFilename, data => {
                    importMeshFromData(data);
                }, progressCallBack, database);
            };

            if (scene.getEngine().enableOfflineSupport && !(sceneFilename.substr && sceneFilename.substr(0, 5) === "data:")) {
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

            var plugin = this._getPluginForFilename(sceneFilename.name || sceneFilename);
            var database;

            var loadingToken = {};
            scene._addPendingData(loadingToken);

            if (SceneLoader.ShowLoadingScreen) {
                scene.getEngine().displayLoadingUI();
            }

            var loadSceneFromData = data => {
                scene.database = database;

                if (!plugin.load(scene, data, rootUrl)) {
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

                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(() => {
                        scene.getEngine().hideLoadingUI();
                    });
                }                
            };

            var manifestChecked = success => {
                Tools.LoadFile(rootUrl + sceneFilename, loadSceneFromData, progressCallBack, database);
            };

            if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                // Direct load
                loadSceneFromData(sceneFilename.substr(5));
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
                Tools.ReadFile(sceneFilename, loadSceneFromData, progressCallBack);
            }
        }
    };
}