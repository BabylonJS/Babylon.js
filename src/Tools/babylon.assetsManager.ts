module BABYLON {
    export interface IAssetTask {
        onSuccess: (task: IAssetTask) => void;
        onError: (task: IAssetTask, message?: string, exception?: any) => void;
        isCompleted: boolean;

        run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void);
    }

    export class MeshAssetTask implements IAssetTask {
        public loadedMeshes: Array<AbstractMesh>;
        public loadedParticleSystems: Array<ParticleSystem>;
        public loadedSkeletons: Array<Skeleton>;

        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask, message?: string, exception?: any) => void;

        public isCompleted = false;

        constructor(public name: string, public meshesNames: any, public rootUrl: string, public sceneFilename: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
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
                }, null, (scene, message, exception) => {
                    if (this.onError) {
                        this.onError(this, message, exception);
                    }

                    onError(message, exception);
                }
            );
        }
    }

    export class TextFileAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask, message?: string, exception?: any) => void;

        public isCompleted = false;
        public text: string;

        constructor(public name: string, public url: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            Tools.LoadFile(this.url, (data) => {

                this.text = data;
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            }, null, scene.database, false, (request, exception) => {
                if (this.onError) {
                    this.onError(this, request.status + " " + request.statusText, exception);
                }

                onError(request.status + " " + request.statusText, exception);
            });
        }
    }

    export class BinaryFileAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask, message?: string, exception?: any) => void;

        public isCompleted = false;
        public data: ArrayBuffer;

        constructor(public name: string, public url: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            Tools.LoadFile(this.url, (data) => {

                this.data = data;
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            }, null, scene.database, true, (request, exception) => {
                if (this.onError) {
                    this.onError(this, request.status + " " + request.statusText, exception);
                }

                onError(request.status + " " + request.statusText, exception);
            });
        }
    }

    export class ImageAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask, message?: string, exception?: any) => void;

        public isCompleted = false;
        public image: HTMLImageElement;

        constructor(public name: string, public url: string) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            var img = new Image();

            Tools.SetCorsBehavior(this.url, img);

            img.onload = () => {
                this.image = img;
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            };

            img.onerror = (err: ErrorEvent): any => {
                if (this.onError) {
                    this.onError(this, "Error loading image", err);
                }

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

    export class TextureAssetTask implements ITextureAssetTask {
        public onSuccess: (task: ITextureAssetTask) => void;
        public onError: (task: ITextureAssetTask, message?: string, exception?: any) => void;

        public isCompleted = false;
        public texture: Texture;

        constructor(public name: string, public url: string, public noMipmap?: boolean, public invertY?: boolean, public samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            };

            var onerror = (msg, exception) => {
                if (this.onError) {
                    this.onError(this, msg, exception);
                }

                onError(msg, exception);
            };

            this.texture = new Texture(this.url, scene, this.noMipmap, this.invertY, this.samplingMode, onload, onerror);
        }
    }

    export class CubeTextureAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask, message?: string, exception?: any) => void;

        public isCompleted = false;
        public texture: CubeTexture;

        constructor(public name: string, public url: string, public extensions?: string[], public noMipmap?: boolean, public files?: string[]) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            };

            var onerror = (msg, exception) => {
                if (this.onError) {
                    this.onError(this, msg, exception);
                }

                onError(msg, exception);
            };

            this.texture = new CubeTexture(this.url, scene, this.extensions, this.noMipmap, this.files, onload, onerror);
        }
    }

    export class HDRCubeTextureAssetTask implements IAssetTask {
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask, message?: string, exception?: any) => void;

        public isCompleted = false;
        public texture: HDRCubeTexture;

        constructor(public name: string, public url: string, public size?: number, public noMipmap = false, public generateHarmonics = true, public useInGammaSpace = false, public usePMREMGenerator = false) {
        }

        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                this.isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            };

            var onerror = (message?: string, exception?: any) => {
                if (this.onError) {
                    this.onError(this, message, exception);
                }

                onError(message, exception);
            };

            this.texture = new HDRCubeTexture(this.url, scene, this.size, this.noMipmap, this.generateHarmonics, this.useInGammaSpace, this.usePMREMGenerator, onload, onerror);
        }
    }

    export class AssetsManager {
        private _scene: Scene;

        protected tasks = new Array<IAssetTask>();
        protected waitingTasksCount = 0;

        public onFinish: (tasks: IAssetTask[]) => void;
        public onTaskSuccess: (task: IAssetTask) => void;
        public onTaskError: (task: IAssetTask) => void;

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
                if (this.onFinish) {
                    this.onFinish(this.tasks);
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
            this.tasks = new Array<IAssetTask>();
            return this;
        }

        public load(): AssetsManager {
            this.waitingTasksCount = this.tasks.length;

            if (this.waitingTasksCount === 0) {
                if (this.onFinish) {
                    this.onFinish(this.tasks);
                }
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
