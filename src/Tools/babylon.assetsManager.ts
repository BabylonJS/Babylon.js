module BABYLON {
    export interface IAssetTask {
        onSuccess: (task: IAssetTask) => void;
        onError: (task: IAssetTask) => void;
        isCompleted: boolean;

        run(scene: Scene, onSuccess: () => void, onError: () => void);
    }

    export class MeshAssetTask implements IAssetTask {
        public loadedMeshes: Array<AbstractMesh>;
        public loadedParticleSystems: Array<ParticleSystem>;
        public loadedSkeletons: Array<Skeleton>;

        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;

        public isCompleted = false;

        constructor(public name: string, public meshesNames: any, public rootUrl: string, public sceneFilename: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: () => void) {
            SceneLoader.ImportMesh(this.meshesNames, this.rootUrl, this.sceneFilename, scene,
                (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => {
                    this.loadedMeshes = meshes;
                    this.loadedParticleSystems = particleSystems;
                    this.loadedSkeletons = skeletons;

                    this.isCompleted = true;

                    if (this.onSuccess) {
                        this.onSuccess(this);
                    }

                    onSuccess();
                }, null, () => {
                    if (this.onError) {
                        this.onError(this);
                    }

                    onError();
                }
                );
        }
    }

    export class TextFileAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;

        public isCompleted = false;
        public text: string;

        constructor(public name: string, public url: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: () => void) {
            Tools.LoadFile(this.url, (data) => {

                this.text = data;
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            }, null, scene.database, false, () => {
                    if (this.onError) {
                        this.onError(this);
                    }

                    onError();
                });
        }
    }

    export class BinaryFileAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;

        public isCompleted = false;
        public data: ArrayBuffer;

        constructor(public name: string, public url: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: () => void) {
            Tools.LoadFile(this.url, (data) => {

                this.data = data;
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            }, null, scene.database, true, () => {
                    if (this.onError) {
                        this.onError(this);
                    }

                    onError();
                });
        }
    }

    export class ImageAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;

        public isCompleted = false;
        public image: HTMLImageElement;

        constructor(public name: string, public url: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: () => void) {
            var img = new Image();

            img.onload = () => {
                this.image = img;
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            };

            img.onerror = () => {
                if (this.onError) {
                    this.onError(this);
                }

                onError();
            };

            img.src = this.url;
        }
    }

    export class TextureAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;

        public isCompleted = false;
        public texture: Texture;

        constructor(public name: string, public url: string, public noMipmap?: boolean, public invertY?: boolean, public samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: () => void) {

            var onload = () => {
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            };

            var onerror = () => {
                if (this.onError) {
                    this.onError(this);
                }

                onError();
            };

            this.texture = new Texture(this.url, scene, this.noMipmap, this.invertY, this.samplingMode, onload, onerror);
        }
    }

    export class AssetsManager {
        private _tasks = new Array<IAssetTask>();
        private _scene: Scene;

        private _waitingTasksCount = 0;

        public onFinish: (tasks: IAssetTask[]) => void;
        public onTaskSuccess: (task: IAssetTask) => void;
        public onTaskError: (task: IAssetTask) => void;

        public useDefaultLoadingScreen = true;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        public addMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string): IAssetTask {
            var task = new MeshAssetTask(taskName, meshesNames, rootUrl, sceneFilename);
            this._tasks.push(task);

            return task;
        }

        public addTextFileTask(taskName: string, url: string): IAssetTask {
            var task = new TextFileAssetTask(taskName, url);
            this._tasks.push(task);

            return task;
        }

        public addBinaryFileTask(taskName: string, url: string): IAssetTask {
            var task = new BinaryFileAssetTask(taskName, url);
            this._tasks.push(task);

            return task;
        }

        public addImageTask(taskName: string, url: string): IAssetTask {
            var task = new ImageAssetTask(taskName, url);
            this._tasks.push(task);

            return task;
        }

        public addTextureTask(taskName: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): IAssetTask {
            var task = new TextureAssetTask(taskName, url, noMipmap, invertY, samplingMode);
            this._tasks.push(task);

            return task;
        }

        private _decreaseWaitingTasksCount(): void {
            this._waitingTasksCount--;

            if (this._waitingTasksCount === 0) {
                if (this.onFinish) {
                    this.onFinish(this._tasks);
                }

                this._scene.getEngine().hideLoadingUI();
            }
        }

        private _runTask(task: IAssetTask): void {
            task.run(this._scene, () => {
                if (this.onTaskSuccess) {
                    this.onTaskSuccess(task);
                }
                this._decreaseWaitingTasksCount();
            }, () => {
                    if (this.onTaskError) {
                        this.onTaskError(task);
                    }
                    this._decreaseWaitingTasksCount();
                });
        }

        public reset(): AssetsManager {
            this._tasks = new Array<IAssetTask>();
            return this;
        }

        public load(): AssetsManager {
            this._waitingTasksCount = this._tasks.length;

            if (this._waitingTasksCount === 0) {
                if (this.onFinish) {
                    this.onFinish(this._tasks);
                }
                return this;
            }

            if (this.useDefaultLoadingScreen) {
                this._scene.getEngine().displayLoadingUI();
            }

            for (var index = 0; index < this._tasks.length; index++) {
                var task = this._tasks[index];
                this._runTask(task);
            }

            return this;
        }     
    }
} 