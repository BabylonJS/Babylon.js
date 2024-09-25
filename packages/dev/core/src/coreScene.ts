import type { Camera } from "./Cameras/camera";
import type { AbstractEngine, ISceneLike } from "./Engines/abstractEngine";
import type { Material } from "./Materials/material";
import type { Matrix } from "./Maths/math.vector";
import type { IFileRequest } from "./Misc/fileRequest";
import type { LoadFileError, ReadFileError, RequestFileError } from "./Misc/fileTools";
import { LoadFile, ReadFile, RequestFile } from "./Misc/fileTools";
import { Logger } from "./Misc/logger";
import { Observable } from "./Misc/observable";
import type { Observer } from "./Misc/observable";
import type { WebRequest } from "./Misc/webRequest";
import type { IOfflineProvider } from "./Offline/IOfflineProvider";
import type { IRenderingManagerAutoClearSetup } from "./Rendering/renderingManager";
import type { Nullable } from "./types";

/**
 * Minimal scene class. Where Scene is doint all the heavy lifting at the price of file size, CoreScene is a minimal version of Scene.
 */
export class CoreScene implements ISceneLike {
    /** @internal */
    public _animationTime: number = 0;

    /**
     * Gets or sets a general scale for animation speed
     * @see https://www.babylonjs-playground.com/#IBU2W7#3
     */
    public animationTimeScale: number = 1;

    /** @internal */
    public _pendingData = new Array();

    /** @internal */
    public _allowPostProcessClearColor: boolean;

    /**
     * Gets or sets the current offline provider to use to store scene data
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeCached
     */
    public offlineProvider: IOfflineProvider;

    /**
     * Flag indicating if we need to store previous matrices when rendering
     */
    public needsPreviousWorldMatrices = false;

    /**
     * Gets a string identifying the name of the class
     * @returns "CoreScene" string
     */
    public getClassName(): string {
        return "CoreScene";
    }

    /**
     * An event triggered when SceneLoader.Append or SceneLoader.Load or SceneLoader.ImportMesh were successfully executed
     */
    public onDataLoadedObservable = new Observable<CoreScene>();

    /**
     * This function can help adding any object to the list of data awaited to be ready in order to check for a complete scene loading.
     * @param data defines the object to wait for
     */
    public addPendingData(data: any): void {
        this._pendingData.push(data);
    }

    /**
     * Remove a pending data from the loading list which has previously been added with addPendingData.
     * @param data defines the object to remove from the pending list
     */
    public removePendingData(data: any): void {
        const wasLoading = this.isLoading;
        const index = this._pendingData.indexOf(data);

        if (index !== -1) {
            this._pendingData.splice(index, 1);
        }

        if (wasLoading && !this.isLoading) {
            this.onDataLoadedObservable.notifyObservers(this);
        }
    }

    /**
     * Returns the number of items waiting to be loaded
     * @returns the number of items waiting to be loaded
     */
    public getWaitingItemsCount(): number {
        return this._pendingData.length;
    }

    /**
     * Returns a boolean indicating if the scene is still loading data
     */
    public get isLoading(): boolean {
        return this._pendingData.length > 0;
    }

    // Engine
    protected _engine: AbstractEngine;

    /**
     * Gets the engine associated with the scene
     * @returns an Engine
     */
    public getEngine(): AbstractEngine {
        return this._engine;
    }

    protected _renderId = 0;
    /**
     * Gets an unique Id for the current render phase
     * @returns a number
     */
    public getRenderId(): number {
        return this._renderId;
    }

    /** Call this function if you want to manually increment the render Id*/
    public incrementRenderId(): void {
        this._renderId++;
    }

    protected _frameId = 0;
    /**
     * Gets an unique Id for the current frame
     * @returns a number
     */
    public getFrameId(): number {
        return this._frameId;
    }

    /**
     * Gets or sets a boolean indicating if the scene must use right-handed coordinates system
     * CoreScene is a only left handed system
     * Child classes can override this property to define their own coordinate system
     */
    public get useRightHandedSystem(): boolean {
        return false;
    }

    /**
     * Gets or sets the current active camera
     * Always null in CoreScene
     */
    public get activeCamera(): Nullable<Camera> {
        return null;
    }

    /**
     * All of the active cameras added to this scene.
     * Always null in CoreScene
     */
    public get activeCameras(): Nullable<Camera[]> {
        return null;
    }

    /**
     * Gets the current auto clear configuration for one rendering group of the rendering
     * manager.
     * @param index the rendering group index to get the information for
     * @returns The auto clear setup for the requested rendering group
     */
    public getAutoClearDepthStencilSetup?: (index: number) => IRenderingManagerAutoClearSetup;

    /**
     * Will flag all materials as dirty to trigger new shader compilation
     * @param flag defines the flag used to specify which material part must be marked as dirty
     * @param predicate If not null, it will be used to specify if a material has to be marked as dirty
     */
    public markAllMaterialsAsDirty?: (flag: number, predicate?: (mat: Material) => boolean) => void;

    /** @internal */
    public _viewMatrix: Matrix;

    /** @internal */
    public _projectionMatrix: Matrix;

    /**
     * Gets the current view matrix
     * @returns a Matrix
     */
    public getViewMatrix(): Matrix {
        return this._viewMatrix;
    }

    /**
     * Gets the current projection matrix
     * @returns a Matrix
     */
    public getProjectionMatrix(): Matrix {
        return this._projectionMatrix;
    }

    /**
     * Boolean indicating if this is a CoreScene or a full Scene
     */
    public get isCore() {
        return true;
    }

    /**
     * Creates a new CoreScene
     * @param engine defines the engine to use to render this scene
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;
    }

    private _activeRequests = new Array<IFileRequest>();
    /**
     * @internal
     */
    public _loadFile(
        fileOrUrl: File | string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
        onProgress?: (ev: ProgressEvent) => void,
        useOfflineSupport?: boolean,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void,
        onOpened?: (request: WebRequest) => void
    ): IFileRequest {
        const request = LoadFile(fileOrUrl, onSuccess, onProgress, useOfflineSupport ? this.offlineProvider : undefined, useArrayBuffer, onError, onOpened);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    public _loadFileAsync(
        fileOrUrl: File | string,
        onProgress?: (data: any) => void,
        useOfflineSupport?: boolean,
        useArrayBuffer?: false,
        onOpened?: (request: WebRequest) => void
    ): Promise<string>;

    public _loadFileAsync(
        fileOrUrl: File | string,
        onProgress?: (data: any) => void,
        useOfflineSupport?: boolean,
        useArrayBuffer?: true,
        onOpened?: (request: WebRequest) => void
    ): Promise<ArrayBuffer>;

    /**
     * @internal
     */
    public _loadFileAsync(
        fileOrUrl: File | string,
        onProgress?: (data: any) => void,
        useOfflineSupport?: boolean,
        useArrayBuffer?: boolean,
        onOpened?: (request: WebRequest) => void
    ): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._loadFile(
                fileOrUrl,
                (data) => {
                    resolve(data);
                },
                onProgress,
                useOfflineSupport,
                useArrayBuffer,
                (request, exception) => {
                    reject(exception);
                },
                onOpened
            );
        });
    }

    /**
     * @internal
     */
    public _requestFile(
        url: string,
        onSuccess: (data: string | ArrayBuffer, request?: WebRequest) => void,
        onProgress?: (ev: ProgressEvent) => void,
        useOfflineSupport?: boolean,
        useArrayBuffer?: boolean,
        onError?: (error: RequestFileError) => void,
        onOpened?: (request: WebRequest) => void
    ): IFileRequest {
        const request = RequestFile(url, onSuccess, onProgress, useOfflineSupport ? this.offlineProvider : undefined, useArrayBuffer, onError, onOpened);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    /**
     * @internal
     */
    public _requestFileAsync(
        url: string,
        onProgress?: (ev: ProgressEvent) => void,
        useOfflineSupport?: boolean,
        useArrayBuffer?: boolean,
        onOpened?: (request: WebRequest) => void
    ): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._requestFile(
                url,
                (data) => {
                    resolve(data);
                },
                onProgress,
                useOfflineSupport,
                useArrayBuffer,
                (error) => {
                    reject(error);
                },
                onOpened
            );
        });
    }

    /**
     * @internal
     */
    public _readFile(
        file: File,
        onSuccess: (data: string | ArrayBuffer) => void,
        onProgress?: (ev: ProgressEvent) => any,
        useArrayBuffer?: boolean,
        onError?: (error: ReadFileError) => void
    ): IFileRequest {
        const request = ReadFile(file, onSuccess, onProgress, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    /**
     * @internal
     */
    public _readFileAsync(file: File, onProgress?: (ev: ProgressEvent) => any, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._readFile(
                file,
                (data) => {
                    resolve(data);
                },
                onProgress,
                useArrayBuffer,
                (error) => {
                    reject(error);
                }
            );
        });
    }

    private _isDisposed = false;
    /**
     * Gets if the scene is already disposed
     */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * An event triggered when the scene is disposed.
     */
    public onDisposeObservable = new Observable<CoreScene>();

    private _onDisposeObserver: Nullable<Observer<CoreScene>> = null;
    /** Sets a function to be executed when this scene is disposed. */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    /**
     * Releases all held resources
     */
    public dispose(): void {
        // Abort active requests
        const activeRequests = this._activeRequests.slice();
        for (const request of activeRequests) {
            request.abort();
        }
        this._activeRequests.length = 0;

        // Events
        try {
            this.onDisposeObservable.notifyObservers(this);
        } catch (e) {
            Logger.Error("An error occurred while calling onDisposeObservable!", e);
        }

        this._isDisposed = true;
        this.onDisposeObservable.clear();
    }
}
