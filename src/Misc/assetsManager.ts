import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { IParticleSystem } from "../Particles/IParticleSystem";
import { Skeleton } from "../Bones/skeleton";
import { SceneLoader } from "../Loading/sceneLoader";
import { Tools } from "./tools";
import { Observable } from "./observable";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import { CubeTexture } from "../Materials/Textures/cubeTexture";
import { HDRCubeTexture } from "../Materials/Textures/hdrCubeTexture";
import { EquiRectangularCubeTexture } from "../Materials/Textures/equiRectangularCubeTexture";
import { Logger } from "../Misc/logger";
import { AnimationGroup } from '../Animations/animationGroup';

/**
 * Defines the list of states available for a task inside a AssetsManager
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
 * Define an abstract asset task used with a AssetsManager class to load assets into a scene
 */
export abstract class AbstractAssetTask {
    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: any) => void;

    /**
     * Callback called when the task is not successful
     */
    public onError: (task: any, message?: string, exception?: any) => void;

    /**
     * Creates a new AssetsManager
     * @param name defines the name of the task
     */
    constructor(
            /**
             * Task name
             */public name: string) {
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
     * @hidden
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

    /**
     * Reset will set the task state back to INIT, so the next load call of the assets manager will execute this task again.
     * This can be used with failed tasks that have the reason for failure fixed.
     */
    public reset() {
        this._taskState = AssetTaskState.INIT;
    }

    private onErrorCallback(onError: (message?: string, exception?: any) => void, message?: string, exception?: any) {
        this._taskState = AssetTaskState.ERROR;

        this._errorObject = {
            message: message,
            exception: exception
        };

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
     * Creates a AssetsProgressEvent
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
 * Define a task used by AssetsManager to load meshes
 */
export class MeshAssetTask extends AbstractAssetTask {
    /**
     * Gets the list of loaded meshes
     */
    public loadedMeshes: Array<AbstractMesh>;
    /**
     * Gets the list of loaded particle systems
     */
    public loadedParticleSystems: Array<IParticleSystem>;
    /**
     * Gets the list of loaded skeletons
     */
    public loadedSkeletons: Array<Skeleton>;
    /**
     * Gets the list of loaded animation groups
     */
    public loadedAnimationGroups: Array<AnimationGroup>;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: MeshAssetTask) => void;

    /**
     * Callback called when the task is successful
     */
    public onError: (task: MeshAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new MeshAssetTask
     * @param name defines the name of the task
     * @param meshesNames defines the list of mesh's names you want to load
     * @param rootUrl defines the root url to use as a base to load your meshes and associated resources
     * @param sceneFilename defines the filename or File of the scene to load from
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the list of mesh's names you want to load
         */
        public meshesNames: any,
        /**
         * Defines the root url to use as a base to load your meshes and associated resources
         */
        public rootUrl: string,
        /**
         * Defines the filename or File of the scene to load from
         */
        public sceneFilename: string | File) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
        SceneLoader.ImportMesh(this.meshesNames, this.rootUrl, this.sceneFilename, scene,
            (meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[]) => {
                this.loadedMeshes = meshes;
                this.loadedParticleSystems = particleSystems;
                this.loadedSkeletons = skeletons;
                this.loadedAnimationGroups = animationGroups;
                onSuccess();
            }, null, (scene, message, exception) => {
                onError(message, exception);
            }
        );
    }
}

/**
 * Define a task used by AssetsManager to load text content
 */
export class TextFileAssetTask extends AbstractAssetTask {
    /**
     * Gets the loaded text string
     */
    public text: string;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: TextFileAssetTask) => void;

    /**
     * Callback called when the task is successful
     */
    public onError: (task: TextFileAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new TextFileAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the location of the file to load
         */
        public url: string) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
        scene._loadFile(this.url, (data) => {
            this.text = data as string;
            onSuccess();
        }, undefined, false, false, (request, exception) => {
            if (request) {
                onError(request.status + " " + request.statusText, exception);
            }
        });
    }
}

/**
 * Define a task used by AssetsManager to load binary data
 */
export class BinaryFileAssetTask extends AbstractAssetTask {
    /**
     * Gets the lodaded data (as an array buffer)
     */
    public data: ArrayBuffer;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: BinaryFileAssetTask) => void;
    /**
     * Callback called when the task is successful
     */
    public onError: (task: BinaryFileAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new BinaryFileAssetTask object
     * @param name defines the name of the new task
     * @param url defines the location of the file to load
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the location of the file to load
         */
        public url: string) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
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
 * Define a task used by AssetsManager to load images
 */
export class ImageAssetTask extends AbstractAssetTask {
    /**
     * Gets the loaded images
     */
    public image: HTMLImageElement;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: ImageAssetTask) => void;
    /**
     * Callback called when the task is successful
     */
    public onError: (task: ImageAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new ImageAssetTask
     * @param name defines the name of the task
     * @param url defines the location of the image to load
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the location of the image to load
         */
        public url: string) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
        var img = new Image();

        Tools.SetCorsBehavior(this.url, img);

        img.onload = () => {
            this.image = img;
            onSuccess();
        };

        img.onerror = (err: string | Event): any => {
            onError("Error loading image", err);
        };

        img.src = this.url;
    }
}

/**
 * Defines the interface used by texture loading tasks
 */
export interface ITextureAssetTask<TEX extends BaseTexture> {
    /**
     * Gets the loaded texture
     */
    texture: TEX;
}

/**
 * Define a task used by AssetsManager to load 2D textures
 */
export class TextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<Texture> {
    /**
     * Gets the loaded texture
     */
    public texture: Texture;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: TextureAssetTask) => void;
    /**
     * Callback called when the task is successful
     */
    public onError: (task: TextureAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new TextureAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     * @param noMipmap defines if mipmap should not be generated (default is false)
     * @param invertY defines if texture must be inverted on Y axis (default is true)
     * @param samplingMode defines the sampling mode to use (default is Texture.TRILINEAR_SAMPLINGMODE)
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the location of the file to load
         */
        public url: string,
        /**
         * Defines if mipmap should not be generated (default is false)
         */
        public noMipmap?: boolean,
        /**
         * Defines if texture must be inverted on Y axis (default is true)
         */
        public invertY: boolean = true,
        /**
         * Defines the sampling mode to use (default is Texture.TRILINEAR_SAMPLINGMODE)
         */
        public samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
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
 * Define a task used by AssetsManager to load cube textures
 */
export class CubeTextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<CubeTexture> {
    /**
     * Gets the loaded texture
     */
    public texture: CubeTexture;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: CubeTextureAssetTask) => void;
    /**
     * Callback called when the task is successful
     */
    public onError: (task: CubeTextureAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new CubeTextureAssetTask
     * @param name defines the name of the task
     * @param url defines the location of the files to load (You have to specify the folder where the files are + filename with no extension)
     * @param extensions defines the extensions to use to load files (["_px", "_py", "_pz", "_nx", "_ny", "_nz"] by default)
     * @param noMipmap defines if mipmaps should not be generated (default is false)
     * @param files defines the explicit list of files (undefined by default)
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the location of the files to load (You have to specify the folder where the files are + filename with no extension)
         */
        public url: string,
        /**
         * Defines the extensions to use to load files (["_px", "_py", "_pz", "_nx", "_ny", "_nz"] by default)
         */
        public extensions?: string[],
        /**
         * Defines if mipmaps should not be generated (default is false)
         */
        public noMipmap?: boolean,
        /**
         * Defines the explicit list of files (undefined by default)
         */
        public files?: string[]) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
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
 * Define a task used by AssetsManager to load HDR cube textures
 */
export class HDRCubeTextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<HDRCubeTexture> {
    /**
     * Gets the loaded texture
     */
    public texture: HDRCubeTexture;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: HDRCubeTextureAssetTask) => void;
    /**
     * Callback called when the task is successful
     */
    public onError: (task: HDRCubeTextureAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new HDRCubeTextureAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     * @param size defines the desired size (the more it increases the longer the generation will be) If the size is omitted this implies you are using a preprocessed cubemap.
     * @param noMipmap defines if mipmaps should not be generated (default is false)
     * @param generateHarmonics specifies whether you want to extract the polynomial harmonics during the generation process (default is true)
     * @param gammaSpace specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space) (default is false)
     * @param reserved Internal use only
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the location of the file to load
         */
        public url: string,
        /**
         * Defines the desired size (the more it increases the longer the generation will be)
         */
        public size: number,
        /**
         * Defines if mipmaps should not be generated (default is false)
         */
        public noMipmap = false,
        /**
         * Specifies whether you want to extract the polynomial harmonics during the generation process (default is true)
         */
        public generateHarmonics = true,
        /**
         * Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space) (default is false)
         */
        public gammaSpace = false,
        /**
         * Internal Use Only
         */
        public reserved = false) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {

        var onload = () => {
            onSuccess();
        };

        var onerror = (message?: string, exception?: any) => {
            onError(message, exception);
        };

        this.texture = new HDRCubeTexture(this.url, scene, this.size, this.noMipmap, this.generateHarmonics, this.gammaSpace, this.reserved, onload, onerror);
    }
}

/**
 * Define a task used by AssetsManager to load Equirectangular cube textures
 */
export class EquiRectangularCubeTextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<EquiRectangularCubeTexture> {
    /**
     * Gets the loaded texture
     */
    public texture: EquiRectangularCubeTexture;

    /**
     * Callback called when the task is successful
     */
    public onSuccess: (task: EquiRectangularCubeTextureAssetTask) => void;
    /**
     * Callback called when the task is successful
     */
    public onError: (task: EquiRectangularCubeTextureAssetTask, message?: string, exception?: any) => void;

    /**
     * Creates a new EquiRectangularCubeTextureAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     * @param size defines the desired size (the more it increases the longer the generation will be)
     * If the size is omitted this implies you are using a preprocessed cubemap.
     * @param noMipmap defines if mipmaps should not be generated (default is false)
     * @param gammaSpace specifies if the texture will be used in gamma or linear space
     * (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
     * (default is true)
     */
    constructor(
        /**
         * Defines the name of the task
         */
        public name: string,
        /**
         * Defines the location of the file to load
         */
        public url: string,
        /**
         * Defines the desired size (the more it increases the longer the generation will be)
         */
        public size: number,
        /**
         * Defines if mipmaps should not be generated (default is false)
         */
        public noMipmap: boolean = false,
        /**
         * Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space,
         * but the standard material would require them in Gamma space) (default is true)
         */
        public gammaSpace: boolean = true) {
        super(name);
    }

    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    public runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void {

        const onload = () => {
            onSuccess();
        };

        const onerror = (message?: string, exception?: any) => {
            onError(message, exception);
        };

        this.texture = new EquiRectangularCubeTexture(this.url, scene, this.size, this.noMipmap, this.gammaSpace, onload, onerror);
    }
}

/**
 * This class can be used to easily import assets into a scene
 * @see https://doc.babylonjs.com/how_to/how_to_use_assetsmanager
 */
export class AssetsManager {
    private _scene: Scene;
    private _isLoading = false;

    protected _tasks = new Array<AbstractAssetTask>();
    protected _waitingTasksCount = 0;
    protected _totalTasksCount = 0;

    /**
     * Callback called when all tasks are processed
     */
    public onFinish: (tasks: AbstractAssetTask[]) => void;

    /**
     * Callback called when a task is successful
     */
    public onTaskSuccess: (task: AbstractAssetTask) => void;

    /**
     * Callback called when a task had an error
     */
    public onTaskError: (task: AbstractAssetTask) => void;

    /**
     * Callback called when a task is done (whatever the result is)
     */
    public onProgress: (remainingCount: number, totalCount: number, task: AbstractAssetTask) => void;

    /**
     * Observable called when all tasks are processed
     */
    public onTaskSuccessObservable = new Observable<AbstractAssetTask>();

    /**
     * Observable called when a task had an error
     */
    public onTaskErrorObservable = new Observable<AbstractAssetTask>();

    /**
     * Observable called when all tasks were executed
     */
    public onTasksDoneObservable = new Observable<AbstractAssetTask[]>();

    /**
     * Observable called when a task is done (whatever the result is)
     */
    public onProgressObservable = new Observable<IAssetsProgressEvent>();

    /**
     * Gets or sets a boolean defining if the AssetsManager should use the default loading screen
     * @see https://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public useDefaultLoadingScreen = true;

    /**
     * Gets or sets a boolean defining if the AssetsManager should automatically hide the loading screen
     * when all assets have been downloaded.
     * If set to false, you need to manually call in hideLoadingUI() once your scene is ready.
     */
    public autoHideLoadingUI = true;

    /**
     * Creates a new AssetsManager
     * @param scene defines the scene to work on
     */
    constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Add a MeshAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param meshesNames defines the name of meshes to load
     * @param rootUrl defines the root url to use to locate files
     * @param sceneFilename defines the filename of the scene file
     * @returns a new MeshAssetTask object
     */
    public addMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string): MeshAssetTask {
        var task = new MeshAssetTask(taskName, meshesNames, rootUrl, sceneFilename);
        this._tasks.push(task);

        return task;
    }

    /**
     * Add a TextFileAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @returns a new TextFileAssetTask object
     */
    public addTextFileTask(taskName: string, url: string): TextFileAssetTask {
        var task = new TextFileAssetTask(taskName, url);
        this._tasks.push(task);

        return task;
    }

    /**
     * Add a BinaryFileAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @returns a new BinaryFileAssetTask object
     */
    public addBinaryFileTask(taskName: string, url: string): BinaryFileAssetTask {
        var task = new BinaryFileAssetTask(taskName, url);
        this._tasks.push(task);

        return task;
    }

    /**
     * Add a ImageAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @returns a new ImageAssetTask object
     */
    public addImageTask(taskName: string, url: string): ImageAssetTask {
        var task = new ImageAssetTask(taskName, url);
        this._tasks.push(task);

        return task;
    }

    /**
     * Add a TextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param invertY defines if you want to invert Y axis of the loaded texture (false by default)
     * @param samplingMode defines the sampling mode to use (Texture.TRILINEAR_SAMPLINGMODE by default)
     * @returns a new TextureAssetTask object
     */
    public addTextureTask(taskName: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): TextureAssetTask {
        var task = new TextureAssetTask(taskName, url, noMipmap, invertY, samplingMode);
        this._tasks.push(task);

        return task;
    }

    /**
     * Add a CubeTextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param extensions defines the extension to use to load the cube map (can be null)
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param files defines the list of files to load (can be null)
     * @returns a new CubeTextureAssetTask object
     */
    public addCubeTextureTask(taskName: string, url: string, extensions?: string[], noMipmap?: boolean, files?: string[]): CubeTextureAssetTask {
        var task = new CubeTextureAssetTask(taskName, url, extensions, noMipmap, files);
        this._tasks.push(task);

        return task;
    }

    /**
     *
     * Add a HDRCubeTextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param size defines the size you want for the cubemap (can be null)
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param generateHarmonics defines if you want to automatically generate (true by default)
     * @param gammaSpace specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space) (default is false)
     * @param reserved Internal use only
     * @returns a new HDRCubeTextureAssetTask object
     */
    public addHDRCubeTextureTask(taskName: string, url: string, size: number, noMipmap = false, generateHarmonics = true, gammaSpace = false, reserved = false): HDRCubeTextureAssetTask {
        var task = new HDRCubeTextureAssetTask(taskName, url, size, noMipmap, generateHarmonics, gammaSpace, reserved);
        this._tasks.push(task);

        return task;
    }

    /**
     *
     * Add a EquiRectangularCubeTextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param size defines the size you want for the cubemap (can be null)
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param gammaSpace Specifies if the texture will be used in gamma or linear space
     * (the PBR material requires those textures in linear space, but the standard material would require them in Gamma space)
     * @returns a new EquiRectangularCubeTextureAssetTask object
     */
    public addEquiRectangularCubeTextureAssetTask(taskName: string, url: string, size: number, noMipmap = false, gammaSpace = true): EquiRectangularCubeTextureAssetTask {
        const task = new EquiRectangularCubeTextureAssetTask(taskName, url, size, noMipmap, gammaSpace);
        this._tasks.push(task);

        return task;
    }

    /**
     * Remove a task from the assets manager.
     * @param task the task to remove
     */
    public removeTask(task: AbstractAssetTask) {
        let index = this._tasks.indexOf(task);

        if (index > -1) {
            this._tasks.splice(index, 1);
        }
    }

    private _decreaseWaitingTasksCount(task: AbstractAssetTask): void {
        this._waitingTasksCount--;

        try {
            if (this.onProgress) {
                this.onProgress(
                    this._waitingTasksCount,
                    this._totalTasksCount,
                    task
                );
            }

            this.onProgressObservable.notifyObservers(
                new AssetsProgressEvent(
                    this._waitingTasksCount,
                    this._totalTasksCount,
                    task
                )
            );
        } catch (e) {
            Logger.Error("Error running progress callbacks.");
            console.log(e);
        }

        if (this._waitingTasksCount === 0) {
            try {

                var currentTasks = this._tasks.slice();

                if (this.onFinish) {
                    // Calling onFinish with immutable array of tasks
                    this.onFinish(currentTasks);
                }

                // Let's remove successfull tasks
                for (var task of currentTasks) {
                    if (task.taskState === AssetTaskState.DONE) {
                        let index = this._tasks.indexOf(task);

                        if (index > -1) {
                            this._tasks.splice(index, 1);
                        }
                    }
                }

                this.onTasksDoneObservable.notifyObservers(this._tasks);
            } catch (e) {
                Logger.Error("Error running tasks-done callbacks.");
                console.log(e);
            }
            this._isLoading = false;
            if (this.autoHideLoadingUI) {
                this._scene.getEngine().hideLoadingUI();
            }
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

        };

        let error = (message?: string, exception?: any) => {
            task._setErrorObject(message, exception);

            if (this.onTaskError) {
                this.onTaskError(task);
            }
            this.onTaskErrorObservable.notifyObservers(task);
            this._decreaseWaitingTasksCount(task);
        };

        task.run(this._scene, done, error);
    }

    /**
     * Reset the AssetsManager and remove all tasks
     * @return the current instance of the AssetsManager
     */
    public reset(): AssetsManager {
        this._isLoading = false;
        this._tasks = new Array<AbstractAssetTask>();
        return this;
    }

    /**
     * Start the loading process
     * @return the current instance of the AssetsManager
     */
    public load(): AssetsManager {
        if (this._isLoading) {
            return this;
        }
        this._isLoading = true;
        this._waitingTasksCount = this._tasks.length;
        this._totalTasksCount = this._tasks.length;

        if (this._waitingTasksCount === 0) {
            this._isLoading = false;
            if (this.onFinish) {
                this.onFinish(this._tasks);
            }
            this.onTasksDoneObservable.notifyObservers(this._tasks);
            return this;
        }

        if (this.useDefaultLoadingScreen) {
            this._scene.getEngine().displayLoadingUI();
        }

        for (var index = 0; index < this._tasks.length; index++) {
            var task = this._tasks[index];
            if (task.taskState === AssetTaskState.INIT) {
                this._runTask(task);
            }
        }

        return this;
    }

    /**
     * Start the loading process as an async operation
     * @return a promise returning the list of failed tasks
     */
    public loadAsync(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._isLoading) {
                resolve();
                return;
            }
            this.onTasksDoneObservable.addOnce((remainingTasks) => {
                if (remainingTasks && remainingTasks.length) {
                    reject(remainingTasks);
                } else {
                    resolve();
                }
            });

            this.load();
        });
    }
}
