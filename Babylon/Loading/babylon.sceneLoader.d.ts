declare module BABYLON {
    interface ISceneLoaderPlugin {
        extensions: string;
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => boolean;
        load: (scene: Scene, data: string, rootUrl: string) => boolean;
    }
    class SceneLoader {
        private static _ForceFullSceneLoadingForIncremental;
        private static _ShowLoadingScreen;
        static ForceFullSceneLoadingForIncremental : boolean;
        static ShowLoadingScreen : boolean;
        private static _registeredPlugins;
        private static _getPluginForFilename(sceneFilename);
        static RegisterPlugin(plugin: ISceneLoaderPlugin): void;
        static ImportMesh(meshesNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onsuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, progressCallBack?: () => void, onerror?: (scene: Scene, e: any) => void): void;
        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        */
        static Load(rootUrl: string, sceneFilename: any, engine: Engine, onsuccess?: (scene: Scene) => void, progressCallBack?: any, onerror?: (scene: Scene) => void): void;
        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        */
        static Append(rootUrl: string, sceneFilename: any, scene: Scene, onsuccess?: (scene: Scene) => void, progressCallBack?: any, onerror?: (scene: Scene) => void): void;
    }
}
