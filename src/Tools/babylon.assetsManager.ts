module BABYLON {

    /**
     * Defines the list of states available for a task inside a {BABYLON.AssetsManager}
     */
    export enum AssetTaskState {
        /**
         * Initialization
         */
        INIT,
        /**
         * Running
         */
        RUNNING,
        /**
         * Done
         */
        DONE,
        /**
         * Error
         */
        ERROR
    }

    /**
     * Define an abstract asset task used with a {BABYLON.AssetsManager} class to load assets into a scene
     */
    export abstract class AbstractAssetTask {
        /**
         * Callback called when the task is successful
         * @param task contains the successful task
         */
        public onSuccess: (task: any) => void;

        /**
         * Callback called when the task is successful
         * @param task contains the successful task
         * @param message contains the error message
         * @param exception can contains the inner exception 
         */
        public onError: (task: any, message?: string, exception?: any) => void;

        /**
         * Creates a new {BABYLON.AssetsManager}
         * @param name define the name of the task
         */
        constructor(public name: string) {
        }

        private _isCompleted = false;
        private _taskState = AssetTaskState.INIT;
        private _errorObject: { message?: string; exception?: any; };

        /**
         * Get if the task is completed
         */
        public get isCompleted(): boolean {
            return this._isCompleted;
        }

        /**
         * Gets the current state of the task
         */
        public get taskState(): AssetTaskState {
            return this._taskState;
        }

        /**
         * Gets the current error object (if task is in error)
         */
        public get errorObject(): { message?: string; exception?: any; } {
            return this._errorObject;
        }

        /**
         * Internal only
         * @ignore 
         */
        public _setErrorObject(message?: string, exception?: any) {
            if (this._errorObject) {
                return;
            }

            this._errorObject = {
                message: message,
                exception: exception
            };
        }

        /**
         * Execute the current task
         * @param scene defines the scene where you want your assets to be loaded
         * @param onSuccess is a callback called when the task is successfully executed
         * @param onError is a callback called if an error occurs
         */
        public run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            this._taskState = AssetTaskState.RUNNING;
            this.runTask(scene, () => {
                this.onDoneCallback(onSuccess, onError);
            }, (msg, exception) => {
                this.onErrorCallback(onError, msg, exception);
            });
        }

        /**
         * Execute the current task
         * @param scene defines the scene where you want your assets to be loaded
         * @param onSuccess is a callback called when the task is successfully executed
         * @param onError is a callback called if an error occurs
         */
        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            throw new Error("runTask is not implemented");
        }

        private onErrorCallback(onError: (message?: string, exception?: any) => void, message?: string, exception?: any) {
            this._taskState = AssetTaskState.ERROR;

            this._errorObject = {
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
                this._taskState = AssetTaskState.DONE;
                this._isCompleted = true;

                if (this.onSuccess) {
                    this.onSuccess(this);
                }

                onSuccess();
            } catch (e) {
                this.onErrorCallback(onError, "Task is done, error executing success callback(s)", e);
            }
        }

    }

    /**
     * Define the interface used by progress events raised during assets loading
     */
    export interface IAssetsProgressEvent {
        /**
         * Defines the number of remaining tasks to process
         */
        remainingCount: number;
        /**
         * Defines the total number of tasks
         */
        totalCount: number;
        /**
         * Defines the task that was just processed
         */
        task: AbstractAssetTask;
    }

    /**
     * Class used to share progress information about assets loading
     */
    export class AssetsProgressEvent implements IAssetsProgressEvent {
        /**
         * Defines the number of remaining tasks to process
         */
        public remainingCount: number;
        /**
         * Defines the total number of tasks
         */
        public totalCount: number;
        /**
         * Defines the task that was just processed
         */
        public task: AbstractAssetTask;

        /**
         * Creates a {BABYLON.AssetsProgressEvent}
         * @param remainingCount defines the number of remaining tasks to process
         * @param totalCount defines the total number of tasks
         * @param task defines the task that was just processed
         */
        constructor(remainingCount: number, totalCount: number, task: AbstractAssetTask) {
            this.remainingCount = remainingCount;
            this.totalCount = totalCount;
            this.task = task;
        }
    }

    /**
     * Define a task used by {BABYLON.AssetsManager} to load meshes
     */
    export class MeshAssetTask extends AbstractAssetTask {
        public loadedMeshes: Array<AbstractMesh>;
        public loadedParticleSystems: Array<ParticleSystem>;
        public loadedSkeletons: Array<Skeleton>;

        public onSuccess: (task: MeshAssetTask) => void;
        public onError: (task: MeshAssetTask, message?: string, exception?: any) => void;

        /**
         * Creates a new {BABYLON.MeshAssetTask}
         * @param name defines the name of the task
         * @param meshesNames 
         * @param rootUrl 
         * @param sceneFilename 
         */
        constructor(public name: string, public meshesNames: any, public rootUrl: string, public sceneFilename: string) {
            super(name);
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

    /**
     * Define a task used by {BABYLON.AssetsManager} to load text content
     */
    export class TextFileAssetTask extends AbstractAssetTask {
        public text: string;

        public onSuccess: (task: TextFileAssetTask) => void;
        public onError: (task: TextFileAssetTask, message?: string, exception?: any) => void;

        constructor(public name: string, public url: string) {
            super(name);
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            scene._loadFile(this.url, (data) => {
                this.text = data as string;
                onSuccess();
            }, undefined, false, true, (request, exception) => {
                if (request) {
                    onError(request.status + " " + request.statusText, exception);
                }
            });
        }
    }

    /**
     * Define a task used by {BABYLON.AssetsManager} to load binary data
     */
    export class BinaryFileAssetTask extends AbstractAssetTask {
        public data: ArrayBuffer;

        public onSuccess: (task: BinaryFileAssetTask) => void;
        public onError: (task: BinaryFileAssetTask, message?: string, exception?: any) => void;

        constructor(public name: string, public url: string) {
            super(name);
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
            scene._loadFile(this.url, (data) => {
                this.data = data as ArrayBuffer;
                onSuccess();
            }, undefined, true, true, (request, exception) => {
                if (request) {
                    onError(request.status + " " + request.statusText, exception);
                }
            });
        }
    }

    /**
     * Define a task used by {BABYLON.AssetsManager} to load images
     */
    export class ImageAssetTask extends AbstractAssetTask {
        public image: HTMLImageElement;

        public onSuccess: (task: ImageAssetTask) => void;
        public onError: (task: ImageAssetTask, message?: string, exception?: any) => void;

        constructor(public name: string, public url: string) {
            super(name);
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

    export interface ITextureAssetTask<TEX extends BaseTexture> {
        texture: TEX;
    }

    /**
     * Define a task used by {BABYLON.AssetsManager} to load 2D textures
     */
    export class TextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<Texture> {
        public texture: Texture;

        public onSuccess: (task: TextureAssetTask) => void;
        public onError: (task: TextureAssetTask, message?: string, exception?: any) => void;

        constructor(public name: string, public url: string, public noMipmap?: boolean, public invertY?: boolean, public samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(name);
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                onSuccess();
            };

            var onerror = (message?: string, exception?: any) => {
                onError(message, exception);
            };

            this.texture = new Texture(this.url, scene, this.noMipmap, this.invertY, this.samplingMode, onload, onerror);
        }
    }

    /**
     * Define a task used by {BABYLON.AssetsManager} to load cube textures
     */
    export class CubeTextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<CubeTexture> {
        public texture: CubeTexture;

        public onSuccess: (task: CubeTextureAssetTask) => void;
        public onError: (task: CubeTextureAssetTask, message?: string, exception?: any) => void;

        constructor(public name: string, public url: string, public extensions?: string[], public noMipmap?: boolean, public files?: string[]) {
            super(name);
        }

        public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

            var onload = () => {
                onSuccess();
            };

            var onerror = (message?: string, exception?: any) => {
                onError(message, exception);
            };

            this.texture = new CubeTexture(this.url, scene, this.extensions, this.noMipmap, this.files, onload, onerror);
        }
    }

    /**
     * Define a task used by {BABYLON.AssetsManager} to load HDR cube textures
     */
    export class HDRCubeTextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<HDRCubeTexture> {
        public texture: HDRCubeTexture;

        public onSuccess: (task: HDRCubeTextureAssetTask) => void;
        public onError: (task: HDRCubeTextureAssetTask, message?: string, exception?: any) => void;

        constructor(public name: string, public url: string, public size?: number, public noMipmap = false, public generateHarmonics = true, public useInGammaSpace = false, public usePMREMGenerator = false) {
            super(name);
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

    /**
     * This class can be used to easily import assets into a scene
     * @see http://doc.babylonjs.com/how_to/how_to_use_assetsmanager
     */
    export class AssetsManager {
        private _scene: Scene;
        private _isLoading = false;

        protected tasks = new Array<AbstractAssetTask>();
        protected waitingTasksCount = 0;
        protected totalTasksCount = 0;

        /**
         * Callback called when all tasks are processed
         * @param tasks will contains all remaining tasks (ie. all tasks which were not successful)
         */
        public onFinish: (tasks: AbstractAssetTask[]) => void;

        /**
         * Callback called when a task is successful
         * @param task defines the loaded task
         */
        public onTaskSuccess: (task: AbstractAssetTask) => void;

        /**
         * Callback called when a task had an error
         * @param task defines failed task
         */
        public onTaskError: (task: AbstractAssetTask) => void;

        /**
         * Callback called when a task is done (whatever the result is)
         * @param remainingCount defines the number of remaining tasks to process
         * @param totalCount defines the total number of tasks
         * @param task defines the task that was just processed
         */
        public onProgress: (remainingCount: number, totalCount: number, task: AbstractAssetTask) => void;

        //Observables

        /**
         * Observable called when all tasks are processed
         */
        public onTaskSuccessObservable = new Observable<AbstractAssetTask>();

        /**
         * Observable called when a task had an error
         */
        public onTaskErrorObservable = new Observable<AbstractAssetTask>();

        /**
         * Observable called when a task is successful
         */
        public onTasksDoneObservable = new Observable<AbstractAssetTask[]>();

        /**
         * Observable called when a task is done (whatever the result is)
         */
        public onProgressObservable = new Observable<IAssetsProgressEvent>();

        /**
         * Gets or sets a boolean defining if the {BABYLON.AssetsManager} should use the default loading screen
         * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
         */
        public useDefaultLoadingScreen = true;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        /**
         * Add a {BABYLON.MeshAssetTask} to the list of active tasks
         * @param taskName defines the name of the new task
         * @param meshesNames defines the name of meshes to load
         * @param rootUrl defines the root url to use to locate files
         * @param sceneFilename defines the filename of the scene file
         */
        public addMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string): MeshAssetTask {
            var task = new MeshAssetTask(taskName, meshesNames, rootUrl, sceneFilename);
            this.tasks.push(task);

            return task;
        }

        /**
         * Add a {BABYLON.TextFileAssetTask} to the list of active tasks
         * @param taskName defines the name of the new task
         * @param url defines the url of the file to load
         */
        public addTextFileTask(taskName: string, url: string): TextFileAssetTask {
            var task = new TextFileAssetTask(taskName, url);
            this.tasks.push(task);

            return task;
        }

        /**
         * Add a {BABYLON.BinaryFileAssetTask} to the list of active tasks
         * @param taskName defines the name of the new task
         * @param url defines the url of the file to load
         */
        public addBinaryFileTask(taskName: string, url: string): BinaryFileAssetTask {
            var task = new BinaryFileAssetTask(taskName, url);
            this.tasks.push(task);

            return task;
        }

        /**
         * Add a {BABYLON.ImageAssetTask} to the list of active tasks
         * @param taskName defines the name of the new task
         * @param url defines the url of the file to load
         */
        public addImageTask(taskName: string, url: string): ImageAssetTask {
            var task = new ImageAssetTask(taskName, url);
            this.tasks.push(task);

            return task;
        }

        /**
         * Add a {BABYLON.TextureAssetTask} to the list of active tasks
         * @param taskName defines the name of the new task
         * @param url defines the url of the file to load
         * @param noMipmap defines if the texture must not receive mipmaps (false by default)
         * @param invertY defines if you want to invert Y axis of the loaded texture (false by default)
         * @param samplingMode defines the sampling mode to use (BABYLON.Texture.TRILINEAR_SAMPLINGMODE by default)
         */
        public addTextureTask(taskName: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): TextureAssetTask {
            var task = new TextureAssetTask(taskName, url, noMipmap, invertY, samplingMode);
            this.tasks.push(task);

            return task;
        }

        /**
         * Add a {BABYLON.CubeTextureAssetTask} to the list of active tasks
         * @param taskName defines the name of the new task
         * @param url defines the url of the file to load
         * @param extensions defines the extension to use to load the cube map (can be null)
         * @param noMipmap defines if the texture must not receive mipmaps (false by default)
         * @param files defines the list of files to load (can be null)
         */
        public addCubeTextureTask(taskName: string, url: string, extensions?: string[], noMipmap?: boolean, files?: string[]): CubeTextureAssetTask {
            var task = new CubeTextureAssetTask(taskName, url, extensions, noMipmap, files);
            this.tasks.push(task);

            return task;
        }

        /**
         * 
         * Add a {BABYLON.HDRCubeTextureAssetTask} to the list of active tasks
         * @param taskName defines the name of the new task
         * @param url defines the url of the file to load
         * @param size defines the size you want for the cubemap (can be null)
         * @param noMipmap defines if the texture must not receive mipmaps (false by default)
         * @param generateHarmonics defines if you want to automatically generate (true by default)
         * @param useInGammaSpace defines if the texture must be considered in gamma space (false by default)
         * @param usePMREMGenerator is a reserved parameter and must be set to false or ignored
         */
        public addHDRCubeTextureTask(taskName: string, url: string, size?: number, noMipmap = false, generateHarmonics = true, useInGammaSpace = false, usePMREMGenerator = false): HDRCubeTextureAssetTask {
            var task = new HDRCubeTextureAssetTask(taskName, url, size, noMipmap, generateHarmonics, useInGammaSpace, usePMREMGenerator);
            this.tasks.push(task);

            return task;
        }

        private _decreaseWaitingTasksCount(task: AbstractAssetTask): void {
            this.waitingTasksCount--;

            try {
                if (task.taskState === AssetTaskState.DONE) {
                    // Let's remove successfull tasks
                    Tools.SetImmediate(() => {
                        let index = this.tasks.indexOf(task);

                        if (index > -1) {
                            this.tasks.splice(index, 1);
                        }
                    });
                }

                if (this.onProgress) {
                    this.onProgress(
                        this.waitingTasksCount,
                        this.totalTasksCount,
                        task
                    );
                }

                this.onProgressObservable.notifyObservers(
                    new AssetsProgressEvent(
                        this.waitingTasksCount,
                        this.totalTasksCount,
                        task
                    )
                );
            } catch (e) {
                Tools.Error("Error running progress callbacks.");
                console.log(e);
            }

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
                this._isLoading = false;
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
                    this._decreaseWaitingTasksCount(task);
                } catch (e) {
                    error("Error executing task success callbacks", e);
                }

            }

            let error = (message?: string, exception?: any) => {
                task._setErrorObject(message, exception);

                if (this.onTaskError) {
                    this.onTaskError(task);
                }
                this.onTaskErrorObservable.notifyObservers(task);
                this._decreaseWaitingTasksCount(task);
            }

            task.run(this._scene, done, error);
        }

        /**
         * Reset the {BABYLON.AssetsManager} and remove all tasks
         * @return the current instance of the {BABYLON.AssetsManager}
         */
        public reset(): AssetsManager {
            this._isLoading = false;
            this.tasks = new Array<AbstractAssetTask>();
            return this;
        }

        /**
         * Start the loading process
         * @return the current instance of the {BABYLON.AssetsManager}
         */
        public load(): AssetsManager {
            if (this._isLoading) {
                return this;
            }
            this._isLoading = true;
            this.waitingTasksCount = this.tasks.length;
            this.totalTasksCount = this.tasks.length;

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
