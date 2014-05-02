//module BABYLON {

//    export interface IFileLoader {
//        extensions: string;
//        importMesh(meshesNames: any, scene: Scene, data: string, rootUrl: string, meshes: Mesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean;
//        load(scene: Scene, data: string, rootUrl: string): void;
//    }

//    export class SceneLoader {
//        private static _registeredPlugins = new Array<IFileLoader>();

//        // Methods
//        private static _GetPluginForFilename(sceneFilename: string): IFileLoader {
//            var dotPosition = sceneFilename.lastIndexOf(".");
//            var extension = sceneFilename.substring(dotPosition).toLowerCase();

//            for (var index = 0; index < this._registeredPlugins.length; index++) {
//                var plugin = this._registeredPlugins[index];

//                if (plugin.extensions.indexOf(extension) !== -1) {
//                    return plugin;
//                }
//            }

//            throw new Error("No plugin found to load this file: " + sceneFilename);
//        }

//        // Public functions
//        public static RegisterPlugin(plugin: IFileLoader): void {
//            plugin.extensions = plugin.extensions.toLowerCase();
//            SceneLoader._registeredPlugins.push(plugin);
//        }

//        public static ImportMesh(meshesNames: any, rootUrl: string, sceneFilename: string, scene: Scene,
//            onsuccess: (meshes: Mesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, progressCallBack: () => void, onerror: (scene: Scene) => void): void {
//            // Checking if a manifest file has been set for this scene and if offline mode has been requested
//            var database = new BABYLON.Database(rootUrl + sceneFilename);
//            scene.database = database;

//            var plugin = SceneLoader._GetPluginForFilename(sceneFilename);

//            BABYLON.Tools.LoadFile(rootUrl + sceneFilename, data => {
//                var meshes = [];
//                var particleSystems = [];
//                var skeletons = [];

//                if (!plugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons)) {
//                    if (onerror) {
//                        onerror(scene);
//                    }

//                    return;
//                }

//                if (onsuccess) {
//                    onsuccess(meshes, particleSystems, skeletons);
//                }
//            }, progressCallBack, database);
//        }

//        public static Load(rootUrl: string, sceneFilename: any, engine: Engine, onsuccess: (scene: Scene) => void, progressCallBack: () => void, onerror: (scene: Scene) => void): void {
//            var plugin = SceneLoader._GetPluginForFilename(sceneFilename.name || sceneFilename);
//            var database;

//            var loadSceneFromData = data => {
//                var scene = new BABYLON.Scene(engine);
//                scene.database = database;

//                if (!plugin.load(scene, data, rootUrl)) {
//                    if (onerror) {
//                        onerror(scene);
//                    }

//                    return;
//                }

//                if (onsuccess) {
//                    onsuccess(scene);
//                }
//            }

//            if (rootUrl.indexOf("file:") === -1) {
//                // Checking if a manifest file has been set for this scene and if offline mode has been requested
//                database = new BABYLON.Database(rootUrl + sceneFilename);

//                BABYLON.Tools.LoadFile(rootUrl + sceneFilename, loadSceneFromData, progressCallBack, database);
//            } else { // Loading file from disk via input file or drag'n'drop
//                BABYLON.Tools.ReadFile(sceneFilename, loadSceneFromData, progressCallBack);
//            }
//        }
//    }
//}