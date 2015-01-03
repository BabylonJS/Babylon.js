declare module BABYLON {
    interface IAssetTask {
        onSuccess: (task: IAssetTask) => void;
        onError: (task: IAssetTask) => void;
        isCompleted: boolean;
        run(scene: Scene, onSuccess: () => void, onError: () => void): any;
    }
    class MeshAssetTask implements IAssetTask {
        public name: string;
        public meshesNames: any;
        public rootUrl: string;
        public sceneFilename: string;
        public loadedMeshes: AbstractMesh[];
        public loadedParticleSystems: ParticleSystem[];
        public loadedSkeletons: Skeleton[];
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        constructor(name: string, meshesNames: any, rootUrl: string, sceneFilename: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class TextFileAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public text: string;
        constructor(name: string, url: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class BinaryFileAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public data: ArrayBuffer;
        constructor(name: string, url: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class ImageAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public image: HTMLImageElement;
        constructor(name: string, url: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class TextureAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public noMipmap: boolean;
        public invertY: boolean;
        public samplingMode: number;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public texture: Texture;
        constructor(name: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode?: number);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class AssetsManager {
        private _tasks;
        private _scene;
        private _waitingTasksCount;
        public onFinish: (tasks: IAssetTask[]) => void;
        public onTaskSuccess: (task: IAssetTask) => void;
        public onTaskError: (task: IAssetTask) => void;
        public useDefaultLoadingScreen: boolean;
        constructor(scene: Scene);
        public addMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string): IAssetTask;
        public addTextFileTask(taskName: string, url: string): IAssetTask;
        public addBinaryFileTask(taskName: string, url: string): IAssetTask;
        public addImageTask(taskName: string, url: string): IAssetTask;
        public addTextureTask(taskName: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode?: number): IAssetTask;
        private _decreaseWaitingTasksCount();
        private _runTask(task);
        public reset(): AssetsManager;
        public load(): AssetsManager;
    }
}
