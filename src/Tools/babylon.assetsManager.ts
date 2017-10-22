module BABYLON {

    export enum AssetTaskState {
        INIT,
        RUNNING,
        DONE,
        ERROR
    }

    export interface IAssetTask {
        onSuccess: (task: IAssetTask) => void;
        onError: (task: IAssetTask, message?: string, exception?: any) => void;
        isCompleted: boolean;

        taskState: AssetTaskState;
        errorObject: {
            message?: string;
            exception?: any;
        }

        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }

    export abstract class AbstractAssetTask implements IAssetTask {

        constructor() {
            this.taskState = AssetTaskState.INIT;
        }

        onSuccess: (task: IAssetTask) => void;
        onError: (task: IAssetTask, message?: string, exception?: any) => void;

        isCompleted: boolean = false;
        taskState: AssetTaskState;
        errorObject: { message?: string; exception?: any; };

        run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            this.taskState = AssetTaskState.RUNNING;
            this.runTask(scene, () => {
                this.onDoneCallback(onSuccess, onError);
            }, (msg, exception) => {
                this.onErrorCallback(onError, msg, exception);
            });
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            throw new Error("runTask is not implemented");
        }

        private onErrorCallback(onError: (message?: string, exception?: any) => void, message?: string, exception?: any) {
            this.taskState = AssetTaskState.ERROR;

            this.errorObject = {
                message: message,
                exception: exception
            }

            if (this.onError) {
                this.onError(this, message, exception);
            }

            onError();
        }

        private onDoneCallback(onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            try {
                this.taskState = AssetTaskState.DONE;
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            } catch (e) {
                this.onErrorCallback(onError, "Task is done, error executing success callback(s)", e);
            }
        }

    }

    export class MeshAssetTask extends AbstractAssetTask implements IAssetTask {
        public loadedMeshes: Array<AbstractMesh>;
        public loadedParticleSystems: Array<ParticleSystem>;
        public loadedSkeletons: Array<Skeleton>;

        constructor(public name: string, public meshesNames: any, public rootUrl: string, public sceneFilename: string) {
            super();
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            SceneLoader.ImportMesh(this.meshesNames, this.rootUrl, this.sceneFilename, scene,
                (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => {
                    this.loadedMeshes = meshes;
                    this.loadedParticleSystems = particleSystems;
                    this.loadedSkeletons = skeletons;
                    onSuccess();
                }, null, (scene, message, exception) => {
                    onError(message, exception);
                }
            );
        }
    }

    export class TextFileAssetTask extends AbstractAssetTask implements IAssetTask {
        public text: string;

        constructor(public name: string, public url: string) {
            super();
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            Tools.LoadFile(this.url, (data) => {
                this.text = data;
                onSuccess();
            }, undefined, scene.database, false, (request, exception) => {
                if (request) {
                    onError(request.status + " " + request.statusText, exception);
                }
            });
        }
    }

    export class BinaryFileAssetTask extends AbstractAssetTask implements IAssetTask {
        public data: ArrayBuffer;

        constructor(public name: string, public url: string) {
            super();
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            Tools.LoadFile(this.url, (data) => {

                this.data = data;
                onSuccess();
            }, undefined, scene.database, true, (request, exception) => {
                if (request) {
                    onError(request.status + " " + request.statusText, exception);
                }
            });
        }
    }

    export class ImageAssetTask extends AbstractAssetTask implements IAssetTask {
        public image: HTMLImageElement;

        constructor(public name: string, public url: string) {
            super();
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            var img = new Image();

            Tools.SetCorsBehavior(this.url, img);

            img.onload = () => {
                this.image = img;
                onSuccess();
            };

            img.onerror = (err: ErrorEvent): any => {
                onError("Error loading image", err);
            };

            img.src = this.url;
        }
    }

    export interface ITextureAssetTask extends IAssetTask {
        onSuccess: (task: ITextureAssetTask) => void;
        onError: (task: ITextureAssetTask, ) => void;
        texture: Texture;
    }

    export class TextureAssetTask extends AbstractAssetTask implements ITextureAssetTask {
        public texture: Texture;

        constructor(public name: string, public url: string, public noMipmap?: boolean, public invertY?: boolean, public samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super();
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                onSuccess();
            };

            var onerror = (msg: string, exception: any) => {
                onError(msg, exception);
            };

            this.texture = new Texture(this.url, scene, this.noMipmap, this.invertY, this.samplingMode, onload, onerror);
        }
    }

    export class CubeTextureAssetTask extends AbstractAssetTask implements IAssetTask {
        public texture: CubeTexture;

        constructor(public name: string, public url: string, public extensions?: string[], public noMipmap?: boolean, public files?: string[]) {
            super();
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                onSuccess();
            };

            var onerror = (msg: string, exception: any) => {
                onError(msg, exception);
            };

            this.texture = new CubeTexture(this.url, scene, this.extensions, this.noMipmap, this.files, onload, onerror);
        }
    }

    export class HDRCubeTextureAssetTask extends AbstractAssetTask implements IAssetTask {
        public texture: HDRCubeTexture;

        constructor(public name: string, public url: string, public size?: number, public noMipmap = false, public generateHarmonics = true, public useInGammaSpace = false, public usePMREMGenerator = false) {
            super();
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                onSuccess();
            };

            var onerror = (message?: string, exception?: any) => {
                onError(message, exception);
            };

            this.texture = new HDRCubeTexture(this.url, scene, this.size, this.noMipmap, this.generateHarmonics, this.useInGammaSpace, this.usePMREMGenerator, onload, onerror);
        }
    }

    export class AssetsManager {
        private _scene: Scene;

        protected tasks = new Array<AbstractAssetTask>();
        protected waitingTasksCount = 0;

        public onFinish: (tasks: IAssetTask[]) => void;
        public onTaskSuccess: (task: IAssetTask) => void;
        public onTaskError: (task: IAssetTask) => void;

        //Observables

        public onTaskSuccessObservable = new Observable<IAssetTask>();
        public onTaskErrorObservable = new Observable<IAssetTask>();
        public onTasksDoneObservable = new Observable<IAssetTask[]>();

        public useDefaultLoadingScreen = true;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        public addMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string): IAssetTask {
            var task = new MeshAssetTask(taskName, meshesNames, rootUrl, sceneFilename);
            this.tasks.push(task);

            return task;
        }

        public addTextFileTask(taskName: string, url: string): IAssetTask {
            var task = new TextFileAssetTask(taskName, url);
            this.tasks.push(task);

            return task;
        }

        public addBinaryFileTask(taskName: string, url: string): IAssetTask {
            var task = new BinaryFileAssetTask(taskName, url);
            this.tasks.push(task);

            return task;
        }

        public addImageTask(taskName: string, url: string): IAssetTask {
            var task = new ImageAssetTask(taskName, url);
            this.tasks.push(task);

            return task;
        }

        public addTextureTask(taskName: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): ITextureAssetTask {
            var task = new TextureAssetTask(taskName, url, noMipmap, invertY, samplingMode);
            this.tasks.push(task);

            return task;
        }


        public addCubeTextureTask(name: string, url: string, extensions?: string[], noMipmap?: boolean, files?: string[]): IAssetTask {
            var task = new CubeTextureAssetTask(name, url, extensions, noMipmap, files);
            this.tasks.push(task);

            return task;
        }

        public addHDRCubeTextureTask(name: string, url: string, size?: number, noMipmap = false, generateHarmonics = true, useInGammaSpace = false, usePMREMGenerator = false): IAssetTask {
            var task = new HDRCubeTextureAssetTask(name, url, size, noMipmap, generateHarmonics, useInGammaSpace, usePMREMGenerator);
            this.tasks.push(task);

            return task;
        }

        private _decreaseWaitingTasksCount(): void {
            this.waitingTasksCount--;

            if (this.waitingTasksCount === 0) {
                try {
                    if (this.onFinish) {
                        this.onFinish(this.tasks);
                    }

                    this.onTasksDoneObservable.notifyObservers(this.tasks);
                } catch (e) {
                    Tools.Error("Error running tasks-done callbacks.");
                    console.log(e);
                }

                this._scene.getEngine().hideLoadingUI();
            }
        }

        private _runTask(task: AbstractAssetTask): void {

            let done = () => {
                try {
                    if (this.onTaskSuccess) {
                        this.onTaskSuccess(task);
                    }
                    this.onTaskSuccessObservable.notifyObservers(task);
                    this._decreaseWaitingTasksCount();
                } catch (e) {
                    error("Error executing task success callbacks", e);
                }

            }

            let error = (message?: string, exception?: any) => {
                task.errorObject = task.errorObject || {
                    message: message,
                    exception: exception
                }
                if (this.onTaskError) {
                    this.onTaskError(task);
                }
                this.onTaskErrorObservable.notifyObservers(task);
                this._decreaseWaitingTasksCount();
            }

            task.run(this._scene, done, error);
        }

        public reset(): AssetsManager {
            this.tasks = new Array<AbstractAssetTask>();
            return this;
        }

        public load(): AssetsManager {
            this.waitingTasksCount = this.tasks.length;

            if (this.waitingTasksCount === 0) {
                if (this.onFinish) {
                    this.onFinish(this.tasks);
                }
                this.onTasksDoneObservable.notifyObservers(this.tasks);
                return this;
            }

            if (this.useDefaultLoadingScreen) {
                this._scene.getEngine().displayLoadingUI();
            }

            for (var index = 0; index < this.tasks.length; index++) {
                var task = this.tasks[index];
                this._runTask(task);
            }

            return this;
        }
    }
} 
