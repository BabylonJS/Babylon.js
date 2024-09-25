import type { Camera } from "./Cameras/camera";
import type { AbstractEngine, ISceneLike } from "./Engines/abstractEngine";
import type { Effect } from "./Materials/effect";
import type { Material } from "./Materials/material";
import { UniformBuffer } from "./Materials/uniformBuffer";
import { Frustum } from "./Maths/math.frustum";
import type { Plane } from "./Maths/math.plane";
import type { Vector3, Vector4 } from "./Maths/math.vector";
import { Matrix, TmpVectors } from "./Maths/math.vector";
import { _ObserveArray } from "./Misc/arrayTools";
import type { IFileRequest } from "./Misc/fileRequest";
import type { LoadFileError, ReadFileError, RequestFileError } from "./Misc/fileTools";
import { LoadFile, ReadFile, RequestFile } from "./Misc/fileTools";
import type { IClipPlanesHolder } from "./Misc/interfaces/iClipPlanesHolder";
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
export class CoreScene implements ISceneLike, IClipPlanesHolder {
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
     * Gets or sets the active clipplane 1
     */
    public clipPlane: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 2
     */
    public clipPlane2: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 3
     */
    public clipPlane3: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 4
     */
    public clipPlane4: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 5
     */
    public clipPlane5: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 6
     */
    public clipPlane6: Nullable<Plane>;

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

    // Lights
    protected _shadowsEnabled = true;
    /**
     * Gets or sets a boolean indicating if shadows are enabled on this scene
     */
    public set shadowsEnabled(value: boolean) {
        if (this._shadowsEnabled === value) {
            return;
        }
        this._shadowsEnabled = value;
    }
    public get shadowsEnabled(): boolean {
        return this._shadowsEnabled;
    }

    protected _lightsEnabled = true;
    /**
     * Gets or sets a boolean indicating if lights are enabled on this scene
     */
    public set lightsEnabled(value: boolean) {
        if (this._lightsEnabled === value) {
            return;
        }
        this._lightsEnabled = value;
    }

    public get lightsEnabled(): boolean {
        return this._lightsEnabled;
    }

    /**
     * An event triggered when the activeCamera property is updated
     */
    public onActiveCameraChanged = new Observable<CoreScene>();

    /**
     * An event triggered when the activeCameras property is updated
     */
    public onActiveCamerasChanged = new Observable<CoreScene>();

    private _activeCameras: Nullable<Camera[]>;
    private _unObserveActiveCameras: Nullable<() => void> = null;

    /** All of the active cameras added to this scene. */
    public get activeCameras(): Nullable<Camera[]> {
        return this._activeCameras;
    }

    public set activeCameras(cameras: Nullable<Camera[]>) {
        if (this._unObserveActiveCameras) {
            this._unObserveActiveCameras();
            this._unObserveActiveCameras = null;
        }

        if (cameras) {
            this._unObserveActiveCameras = _ObserveArray(cameras, () => {
                this.onActiveCamerasChanged.notifyObservers(this);
            });
        }

        this._activeCameras = cameras;
    }

    /** @internal */
    public _activeCamera: Nullable<Camera>;
    /** Gets or sets the current active camera */
    public get activeCamera(): Nullable<Camera> {
        return this._activeCamera;
    }

    public set activeCamera(value: Nullable<Camera>) {
        if (value === this._activeCamera) {
            return;
        }

        this._activeCamera = value;
        this.onActiveCameraChanged.notifyObservers(this);
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

    /** @internal */
    protected _transformMatrix = Matrix.Zero();

    /** @internal */
    protected _sceneUbo: UniformBuffer;

    /** @internal */
    public _frustumPlanes: Plane[];
    /**
     * Gets the list of frustum planes (built from the active camera)
     */
    public get frustumPlanes(): Plane[] {
        return this._frustumPlanes;
    }

    private _viewUpdateFlag = -1;
    private _projectionUpdateFlag = -1;

    /**
     * Gets the uniform buffer used to store scene data
     * @returns a UniformBuffer
     */
    public getSceneUniformBuffer(): UniformBuffer {
        return this._multiviewSceneUbo ? this._multiviewSceneUbo : this._sceneUbo;
    }

    /**
     * Creates a scene UBO
     * @param name name of the uniform buffer (optional, for debugging purpose only)
     * @returns a new ubo
     */
    public createSceneUniformBuffer(name?: string): UniformBuffer {
        const sceneUbo = new UniformBuffer(this._engine, undefined, false, name ?? "scene");
        sceneUbo.addUniform("viewProjection", 16);
        sceneUbo.addUniform("view", 16);
        sceneUbo.addUniform("projection", 16);
        sceneUbo.addUniform("vEyePosition", 4);

        return sceneUbo;
    }

    /**
     * Sets the scene ubo
     * @param ubo the ubo to set for the scene
     */
    public setSceneUniformBuffer(ubo: UniformBuffer): void {
        this._sceneUbo = ubo;
        this._viewUpdateFlag = -1;
        this._projectionUpdateFlag = -1;
    }

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
     * Gets the current transform matrix
     * @returns a Matrix made of View * Projection
     */
    public getTransformMatrix(): Matrix {
        return this._transformMatrix;
    }

    /**
     * Sets the current transform matrix
     * @param viewL defines the View matrix to use
     * @param projectionL defines the Projection matrix to use
     * @param viewR defines the right View matrix to use (if provided)
     * @param projectionR defines the right Projection matrix to use (if provided)
     */
    public setTransformMatrix(viewL: Matrix, projectionL: Matrix, viewR?: Matrix, projectionR?: Matrix): void {
        // clear the multiviewSceneUbo if no viewR and projectionR are defined
        if (!viewR && !projectionR && this._multiviewSceneUbo) {
            this._multiviewSceneUbo.dispose();
            this._multiviewSceneUbo = null;
        }
        if (this._viewUpdateFlag === viewL.updateFlag && this._projectionUpdateFlag === projectionL.updateFlag) {
            return;
        }

        this._viewUpdateFlag = viewL.updateFlag;
        this._projectionUpdateFlag = projectionL.updateFlag;
        this._viewMatrix = viewL;
        this._projectionMatrix = projectionL;

        this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);

        // Update frustum
        if (!this._frustumPlanes) {
            this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
        } else {
            Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
        }

        if (this._multiviewSceneUbo && this._multiviewSceneUbo.useUbo) {
            this._updateMultiviewUbo(viewR, projectionR);
        } else if (this._sceneUbo.useUbo) {
            this._sceneUbo.updateMatrix("viewProjection", this._transformMatrix);
            this._sceneUbo.updateMatrix("view", this._viewMatrix);
            this._sceneUbo.updateMatrix("projection", this._projectionMatrix);
        }
    }

    /**
     * Update the transform matrix to update from the current active camera
     * @param force defines a boolean used to force the update even if cache is up to date
     */
    public updateTransformMatrix(force?: boolean): void {
        const activeCamera = this.activeCamera;
        if (!activeCamera) {
            return;
        }

        if (activeCamera._renderingMultiview) {
            const leftCamera = activeCamera._rigCameras[0];
            const rightCamera = activeCamera._rigCameras[1];
            this.setTransformMatrix(leftCamera.getViewMatrix(), leftCamera.getProjectionMatrix(force), rightCamera.getViewMatrix(), rightCamera.getProjectionMatrix(force));
        } else {
            this.setTransformMatrix(activeCamera.getViewMatrix(), activeCamera.getProjectionMatrix(force));
        }
    }

    /** @internal */
    public _forcedViewPosition: Nullable<Vector3>;

    // Mirror
    /** @internal */
    public _mirroredCameraPosition: Nullable<Vector3>;

    /**
     * Bind the current view position to an effect.
     * @param effect The effect to be bound
     * @param variableName name of the shader variable that will hold the eye position
     * @param isVector3 true to indicates that variableName is a Vector3 and not a Vector4
     * @returns the computed eye position
     */
    public bindEyePosition(effect: Nullable<Effect>, variableName = "vEyePosition", isVector3 = false): Vector4 {
        const eyePosition = this._forcedViewPosition ? this._forcedViewPosition : this._mirroredCameraPosition ? this._mirroredCameraPosition : this.activeCamera!.globalPosition;

        const invertNormal = this.useRightHandedSystem === (this._mirroredCameraPosition != null);

        TmpVectors.Vector4[0].set(eyePosition.x, eyePosition.y, eyePosition.z, invertNormal ? -1 : 1);

        if (effect) {
            if (isVector3) {
                effect.setFloat3(variableName, TmpVectors.Vector4[0].x, TmpVectors.Vector4[0].y, TmpVectors.Vector4[0].z);
            } else {
                effect.setVector4(variableName, TmpVectors.Vector4[0]);
            }
        }

        return TmpVectors.Vector4[0];
    }

    /**
     * Update the scene ubo before it can be used in rendering processing
     * @returns the scene UniformBuffer
     */
    public finalizeSceneUbo(): UniformBuffer {
        const ubo = this.getSceneUniformBuffer();
        const eyePosition = this.bindEyePosition(null);
        ubo.updateFloat4("vEyePosition", eyePosition.x, eyePosition.y, eyePosition.z, eyePosition.w);

        ubo.update();

        return ubo;
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
        this.onDataLoadedObservable.clear();

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
