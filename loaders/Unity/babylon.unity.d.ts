declare module BABYLON {
    interface IScriptComponent {
        order: number;
        name: string;
        klass: string;
        update: boolean;
        controller: boolean;
        properties: any;
        instance: BABYLON.SceneComponent;
        tag: any;
    }
    abstract class SceneComponent {
        readonly engine: BABYLON.Engine;
        readonly scene: BABYLON.Scene;
        register: () => void;
        disposer: () => void;
        tick: boolean;
        private _ticker;
        private _started;
        private _initialized;
        private _properties;
        constructor(host: BABYLON.Scene, enableUpdate: boolean, propertyBag: any);
        abstract start(): void;
        abstract update(): void;
        abstract destroy(): void;
        getManager(): BABYLON.SceneManager;
        getProperty<T>(name: string, defaultValue?: T): T;
        private registerInstance(instance);
        private updateInstance(instance);
        private disposeInstance(instance);
    }
    abstract class CameraComponent extends BABYLON.SceneComponent {
        readonly camera: BABYLON.Camera;
        constructor(owner: BABYLON.Camera, scene: BABYLON.Scene, enableUpdate: boolean, propertyBag: any);
        getGameObject(): BABYLON.UnityGameObject;
        findComponent(klass: string): any;
        findComponents(klass: string): any[];
    }
    abstract class LightComponent extends BABYLON.SceneComponent {
        readonly light: BABYLON.Light;
        constructor(owner: BABYLON.Light, scene: BABYLON.Scene, enableUpdate: boolean, propertyBag: any);
        getGameObject(): BABYLON.UnityGameObject;
        findComponent(klass: string): any;
        findComponents(klass: string): any[];
    }
    abstract class MeshComponent extends BABYLON.SceneComponent {
        readonly mesh: BABYLON.AbstractMesh;
        constructor(owner: BABYLON.AbstractMesh, scene: BABYLON.Scene, enableUpdate: boolean, propertyBag: any);
        getGameObject(): BABYLON.UnityGameObject;
        findComponent(klass: string): any;
        findComponents(klass: string): any[];
    }
    abstract class SceneController extends BABYLON.MeshComponent {
        abstract ready(): void;
        constructor(owner: BABYLON.AbstractMesh, scene: BABYLON.Scene, enableUpdate: boolean, propertyBag: any);
    }
    class SceneManager {
        onrender: () => void;
        controller: BABYLON.SceneController;
        private _scene;
        private _render;
        private _running;
        private _audioPause;
        private _markup;
        private _gui;
        private static loader;
        constructor(host: BABYLON.Scene);
        dispose(): void;
        start(): void;
        stop(): void;
        toggle(): void;
        isRunning(): boolean;
        loadLevel(name: string, path?: string): void;
        pauseAudio(): void;
        resumeAudio(): void;
        showFullscreen(): void;
        getGuiMode(): string;
        getSceneMarkup(): string;
        drawSceneMarkup(markup: string): void;
        clearSceneMarkup(): void;
        getSceneGameObject(owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light): BABYLON.UnityGameObject;
        findSceneController(meshes: BABYLON.AbstractMesh[], scene: BABYLON.Scene): any;
        findSceneComponent(klass: string, owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light): any;
        findSceneComponents(klass: string, owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light): any[];
        detroySceneComponents(owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light): void;
        static hasSceneLoader(): boolean;
        static registerSceneLoader(handler: (root: string, name: string) => void): void;
        static parseSceneCameras(cameras: BABYLON.Camera[], scene: BABYLON.Scene, ticklist: BABYLON.IScriptComponent[]): void;
        static parseSceneLights(lights: BABYLON.Light[], scene: BABYLON.Scene, ticklist: BABYLON.IScriptComponent[]): void;
        static parseSceneMeshes(meshes: BABYLON.AbstractMesh[], scene: BABYLON.Scene, ticklist: BABYLON.IScriptComponent[]): void;
        private static createComponentClass(klass);
        private static createObjectFromString(str, type);
    }
    class UnityGameObject {
        type: string;
        objectId: string;
        objectName: string;
        tagName: string;
        layerIndex: number;
        layerName: string;
        private _properties;
        constructor(propertyBag: any);
        getProperty<T>(name: string, defaultValue?: T): T;
    }
    class UnitySceneLoader implements BABYLON.ISceneLoaderPlugin {
        extensions: string;
        plugin: BABYLON.ISceneLoaderPlugin;
        constructor();
        importMesh(meshesNames: any, scene: BABYLON.Scene, data: any, rootUrl: string, meshes: BABYLON.AbstractMesh[], particleSystems: BABYLON.ParticleSystem[], skeletons: BABYLON.Skeleton[]): boolean;
        load(scene: BABYLON.Scene, data: string, rootUrl: string): boolean;
    }
}
