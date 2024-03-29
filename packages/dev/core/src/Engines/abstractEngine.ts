import { Observable } from "../Misc/observable";
import { ThinEngine } from "./thinEngine";
import { Constants } from "./constants";
import type { Nullable } from "../types";
import { PerfCounter } from "../Misc/perfCounter";
import type { OcclusionQuery } from "./Extensions/engine.query";
import type { PostProcess } from "../PostProcesses/postProcess";
import type { Scene } from "../scene";
import type { IViewportLike } from "../Maths/math.like";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { IsWindowObjectExist } from "../Misc/domManagement";
import type { ILoadingScreen } from "../Loading/loadingScreen";
import { _WarnImport } from "../Misc/devTools";

/**
 * Defines the interface used by objects containing a viewport (like a camera)
 */
interface IViewportOwnerLike {
    /**
     * Gets or sets the viewport
     */
    viewport: IViewportLike;
}

/**
 * The parent class for specialized engines (WebGL, WebGPU)
 */
export abstract class AbstractEngine extends ThinEngine {
    protected _compatibilityMode = true;
    protected _pointerLockRequested: boolean;
    private _loadingScreen: ILoadingScreen;

    /**
     * Gets or sets a boolean to enable/disable IndexedDB support and avoid XHR on .manifest
     **/
    public enableOfflineSupport = false;

    /**
     * Gets or sets a boolean to enable/disable checking manifest if IndexedDB support is enabled (js will always consider the database is up to date)
     **/
    public disableManifestCheck = false;

    /**
     * Gets or sets a boolean to enable/disable the context menu (right-click) from appearing on the main canvas
     */
    public disableContextMenu: boolean = true;

    /**
     * Gets or sets the current render pass id
     */
    public currentRenderPassId = Constants.RENDERPASS_MAIN;

    /**
     * Gets a boolean indicating if the pointer is currently locked
     */
    public isPointerLock = false;

    /**
     * Gets the list of created postprocesses
     */
    public postProcesses: PostProcess[] = [];

    /** Gets or sets the tab index to set to the rendering canvas. 1 is the minimum value to set to be able to capture keyboard events */
    public canvasTabIndex = 1;

    /**
     * Observable event triggered each time the canvas loses focus
     */
    public onCanvasBlurObservable = new Observable<AbstractEngine>();

    /**
     * Event raised when a new scene is created
     */
    public onNewSceneAddedObservable = new Observable<Scene>();

    /**
     * Observable event triggered each time the rendering canvas is resized
     */
    public onResizeObservable = new Observable<AbstractEngine>();

    /**
     * Observable event triggered each time the canvas gains focus
     */
    public onCanvasFocusObservable = new Observable<AbstractEngine>();

    /**
     * Observable event triggered each time the canvas receives pointerout event
     */
    public onCanvasPointerOutObservable = new Observable<PointerEvent>();

    /**
     * Gets the list of created scenes
     */
    public scenes: Scene[] = [];

    /** @internal */
    public _virtualScenes = new Array<Scene>();

    protected _onPointerLockChange: () => void;

    /** @internal */
    public _verifyPointerLock(): void {
        this._onPointerLockChange?.();
    }
    /**
     * Gets the HTML element used to attach event listeners
     * @returns a HTML element
     */
    public getInputElement(): Nullable<HTMLElement> {
        return this._renderingCanvas;
    }

    /**
     * Gets the client rect of the HTML canvas attached with the current webGL context
     * @returns a client rectangle
     */
    public getRenderingCanvasClientRect(): Nullable<ClientRect> {
        if (!this._renderingCanvas) {
            return null;
        }
        return this._renderingCanvas.getBoundingClientRect();
    }

    /**
     * Gets the client rect of the HTML element used for events
     * @returns a client rectangle
     */
    public getInputElementClientRect(): Nullable<ClientRect> {
        if (!this._renderingCanvas) {
            return null;
        }
        return this.getInputElement()!.getBoundingClientRect();
    }

    /**
     * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
     * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
     * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
     */
    public get compatibilityMode() {
        return this._compatibilityMode;
    }

    public set compatibilityMode(mode: boolean) {
        // not supported in WebGL
        this._compatibilityMode = true;
    }
    /**
     * Gets the current depth function
     * @returns a number defining the depth function
     */
    public getDepthFunction(): Nullable<number> {
        return this._depthCullingState.depthFunc;
    }

    /**
     * Sets the current depth function
     * @param depthFunc defines the function to use
     */
    public setDepthFunction(depthFunc: number) {
        this._depthCullingState.depthFunc = depthFunc;
    }

    /**
     * Sets the current depth function to GREATER
     */
    public setDepthFunctionToGreater(): void {
        this.setDepthFunction(Constants.GREATER);
    }

    /**
     * Sets the current depth function to GEQUAL
     */
    public setDepthFunctionToGreaterOrEqual(): void {
        this.setDepthFunction(Constants.GEQUAL);
    }

    /**
     * Sets the current depth function to LESS
     */
    public setDepthFunctionToLess(): void {
        this.setDepthFunction(Constants.LESS);
    }

    /**
     * Sets the current depth function to LEQUAL
     */
    public setDepthFunctionToLessOrEqual(): void {
        this.setDepthFunction(Constants.LEQUAL);
    }

    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    public getDepthWrite(): boolean {
        return this._depthCullingState.depthMask;
    }

    /**
     * Enable or disable depth writing
     * @param enable defines the state to set
     */
    public setDepthWrite(enable: boolean): void {
        this._depthCullingState.depthMask = enable;
    }

    /**
     * Observable raised when the engine is about to compile a shader
     */
    public onBeforeShaderCompilationObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine has just compiled a shader
     */
    public onAfterShaderCompilationObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine begins a new frame
     */
    public onBeginFrameObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine ends the current frame
     */
    public onEndFrameObservable = new Observable<AbstractEngine>();

    /**
     * Get the performance counter associated with the frame time computation
     * @returns the perf counter
     */
    public getGPUFrameTimeCounter(): Nullable<PerfCounter> {
        return null;
    }

    /**
     * Enable or disable the GPU frame time capture
     * @param value True to enable, false to disable
     */
    public captureGPUFrameTime(value: boolean): void {
        // Do nothing. Must be implemented by child classes
    }

    /**
     * Create a new webGL query (you must be sure that queries are supported by checking getCaps() function)
     * @returns the new query
     */
    public createQuery(): Nullable<OcclusionQuery> {
        return null;
    }

    /**
     * Delete and release a webGL query
     * @param query defines the query to delete
     * @returns the current engine
     */
    public deleteQuery(query: OcclusionQuery): AbstractEngine {
        // Do nothing. Must be implemented by child classes
        return this;
    }

    /**
     * Check if a given query has resolved and got its value
     * @param query defines the query to check
     * @returns true if the query got its value
     */
    public isQueryResultAvailable(query: OcclusionQuery): boolean {
        // Do nothing. Must be implemented by child classes
        return false;
    }

    /**
     * Gets the value of a given query
     * @param query defines the query to check
     * @returns the value of the query
     */
    public getQueryResult(query: OcclusionQuery): number {
        // Do nothing. Must be implemented by child classes
        return 0;
    }

    /**
     * Initiates an occlusion query
     * @param algorithmType defines the algorithm to use
     * @param query defines the query to use
     * @returns the current engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
     */
    public beginOcclusionQuery(algorithmType: number, query: OcclusionQuery): boolean {
        // Do nothing. Must be implemented by child classes
        return false;
    }

    /**
     * Ends an occlusion query
     * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
     * @param algorithmType defines the algorithm to use
     * @returns the current engine
     */
    public endOcclusionQuery(algorithmType: number): AbstractEngine {
        // Do nothing. Must be implemented by child classes
        return this;
    }

    /**
     * Gets current aspect ratio
     * @param viewportOwner defines the camera to use to get the aspect ratio
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the aspect ratio
     */
    public getAspectRatio(viewportOwner: IViewportOwnerLike, useScreen = false): number {
        const viewport = viewportOwner.viewport;
        return (this.getRenderWidth(useScreen) * viewport.width) / (this.getRenderHeight(useScreen) * viewport.height);
    }

    /**
     * Gets current screen aspect ratio
     * @returns a number defining the aspect ratio
     */
    public getScreenAspectRatio(): number {
        return this.getRenderWidth(true) / this.getRenderHeight(true);
    }

    // Loading screen

    /**
     * Display the loading screen
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public displayLoadingUI(): void {
        if (!IsWindowObjectExist()) {
            return;
        }
        const loadingScreen = this.loadingScreen;
        if (loadingScreen) {
            loadingScreen.displayLoadingUI();
        }
    }

    /**
     * Hide the loading screen
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public hideLoadingUI(): void {
        if (!IsWindowObjectExist()) {
            return;
        }
        const loadingScreen = this._loadingScreen;
        if (loadingScreen) {
            loadingScreen.hideLoadingUI();
        }
    }

    /**
     * Gets the current loading screen object
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public get loadingScreen(): ILoadingScreen {
        if (!this._loadingScreen && this._renderingCanvas) {
            this._loadingScreen = AbstractEngine.DefaultLoadingScreenFactory(this._renderingCanvas);
        }
        return this._loadingScreen;
    }

    /**
     * Sets the current loading screen object
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public set loadingScreen(loadingScreen: ILoadingScreen) {
        this._loadingScreen = loadingScreen;
    }

    /**
     * Sets the current loading screen text
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public set loadingUIText(text: string) {
        this.loadingScreen.loadingUIText = text;
    }

    /**
     * Sets the current loading screen background color
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public set loadingUIBackgroundColor(color: string) {
        this.loadingScreen.loadingUIBackgroundColor = color;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _RenderPassIdCounter = 0;

    private _renderPassNames: string[] = ["main"];
    /**
     * Gets the names of the render passes that are currently created
     * @returns list of the render pass names
     */
    public getRenderPassNames(): string[] {
        return this._renderPassNames;
    }

    /**
     * Gets the name of the current render pass
     * @returns name of the current render pass
     */
    public getCurrentRenderPassName(): string {
        return this._renderPassNames[this.currentRenderPassId];
    }

    /**
     * Creates a render pass id
     * @param name Name of the render pass (for debug purpose only)
     * @returns the id of the new render pass
     */
    public createRenderPassId(name?: string) {
        // Note: render pass id == 0 is always for the main render pass
        const id = ++AbstractEngine._RenderPassIdCounter;
        this._renderPassNames[id] = name ?? "NONAME";
        return id;
    }

    /**
     * Releases a render pass id
     * @param id id of the render pass to release
     */
    public releaseRenderPassId(id: number): void {
        this._renderPassNames[id] = undefined as any;

        for (let s = 0; s < this.scenes.length; ++s) {
            const scene = this.scenes[s];
            for (let m = 0; m < scene.meshes.length; ++m) {
                const mesh = scene.meshes[m];
                if (mesh.subMeshes) {
                    for (let b = 0; b < mesh.subMeshes.length; ++b) {
                        const subMesh = mesh.subMeshes[b];
                        subMesh._removeDrawWrapper(id);
                    }
                }
            }
        }
    }

    /**
     * Ask the browser to promote the current element to pointerlock mode
     * @param element defines the DOM element to promote
     */
    static _RequestPointerlock(element: HTMLElement): void {
        if (element.requestPointerLock) {
            // In some browsers, requestPointerLock returns a promise.
            // Handle possible rejections to avoid an unhandled top-level exception.
            const promise: unknown = element.requestPointerLock();
            if (promise instanceof Promise)
                promise
                    .then(() => {
                        element.focus();
                    })
                    .catch(() => {});
            else element.focus();
        }
    }

    /**
     * Asks the browser to exit pointerlock mode
     */
    static _ExitPointerlock(): void {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    /**
     * creates and returns a new video element
     * @param constraints video constraints
     * @returns video element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createVideoElement(constraints: MediaTrackConstraints): any {
        return document.createElement("video");
    }

    // FPS
    protected _fps = 60;
    protected _deltaTime = 0;

    /** @internal */
    public _drawCalls = new PerfCounter();

    /**
     * @internal
     */
    public _reportDrawCall(numDrawCalls = 1) {
        this._drawCalls.addCount(numDrawCalls, false);
    }
    /**
     * Gets the current framerate
     * @returns a number representing the framerate
     */
    public getFps(): number {
        return this._fps;
    }

    /**
     * Gets the time spent between current and previous frame
     * @returns a number representing the delta time in ms
     */
    public getDeltaTime(): number {
        return this._deltaTime;
    }

    // Deterministic lockstepMaxSteps
    protected _deterministicLockstep: boolean = false;
    protected _lockstepMaxSteps: number = 4;
    protected _timeStep: number = 1 / 60;

    /**
     * Gets a boolean indicating that the engine is running in deterministic lock step mode
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns true if engine is in deterministic lock step mode
     */
    public isDeterministicLockStep(): boolean {
        return this._deterministicLockstep;
    }

    /**
     * Gets the max steps when engine is running in deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns the max steps
     */
    public getLockstepMaxSteps(): number {
        return this._lockstepMaxSteps;
    }

    /**
     * Returns the time in ms between steps when using deterministic lock step.
     * @returns time step in (ms)
     */
    public getTimeStep(): number {
        return this._timeStep * 1000;
    }

    /**
     * Force the mipmap generation for the given render target texture
     * @param texture defines the render target texture to use
     * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
     */
    public abstract generateMipMapsForCubemap(texture: InternalTexture, unbind: boolean): void;

    /**
     * Gets a boolean indicating if stencil buffer is enabled
     * @returns the current stencil buffer state
     */
    public getStencilBuffer(): boolean {
        return this._stencilState.stencilTest;
    }

    /**
     * Enable or disable the stencil buffer
     * @param enable defines if the stencil buffer must be enabled or disabled
     */
    public setStencilBuffer(enable: boolean): void {
        this._stencilState.stencilTest = enable;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the new stencil mask to use
     */
    public getStencilMask(): number {
        return this._stencilState.stencilMask;
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilMask(mask: number): void {
        this._stencilState.stencilMask = mask;
    }

    /**
     * Gets the current stencil function
     * @returns a number defining the stencil function to use
     */
    public getStencilFunction(): number {
        return this._stencilState.stencilFunc;
    }

    /**
     * Gets the current stencil reference value
     * @returns a number defining the stencil reference value to use
     */
    public getStencilFunctionReference(): number {
        return this._stencilState.stencilFuncRef;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the stencil mask to use
     */
    public getStencilFunctionMask(): number {
        return this._stencilState.stencilFuncMask;
    }

    /**
     * Sets the current stencil function
     * @param stencilFunc defines the new stencil function to use
     */
    public setStencilFunction(stencilFunc: number) {
        this._stencilState.stencilFunc = stencilFunc;
    }

    /**
     * Sets the current stencil reference
     * @param reference defines the new stencil reference to use
     */
    public setStencilFunctionReference(reference: number) {
        this._stencilState.stencilFuncRef = reference;
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilFunctionMask(mask: number) {
        this._stencilState.stencilFuncMask = mask;
    }

    /**
     * Gets the current stencil operation when stencil fails
     * @returns a number defining stencil operation to use when stencil fails
     */
    public getStencilOperationFail(): number {
        return this._stencilState.stencilOpStencilFail;
    }

    /**
     * Gets the current stencil operation when depth fails
     * @returns a number defining stencil operation to use when depth fails
     */
    public getStencilOperationDepthFail(): number {
        return this._stencilState.stencilOpDepthFail;
    }

    /**
     * Gets the current stencil operation when stencil passes
     * @returns a number defining stencil operation to use when stencil passes
     */
    public getStencilOperationPass(): number {
        return this._stencilState.stencilOpStencilDepthPass;
    }

    /**
     * Sets the stencil operation to use when stencil fails
     * @param operation defines the stencil operation to use when stencil fails
     */
    public setStencilOperationFail(operation: number): void {
        this._stencilState.stencilOpStencilFail = operation;
    }

    /**
     * Sets the stencil operation to use when depth fails
     * @param operation defines the stencil operation to use when depth fails
     */
    public setStencilOperationDepthFail(operation: number): void {
        this._stencilState.stencilOpDepthFail = operation;
    }

    /**
     * Sets the stencil operation to use when stencil passes
     * @param operation defines the stencil operation to use when stencil passes
     */
    public setStencilOperationPass(operation: number): void {
        this._stencilState.stencilOpStencilDepthPass = operation;
    }

    private _cachedStencilBuffer: boolean;
    private _cachedStencilFunction: number;
    private _cachedStencilMask: number;
    private _cachedStencilOperationPass: number;
    private _cachedStencilOperationFail: number;
    private _cachedStencilOperationDepthFail: number;
    private _cachedStencilReference: number;

    /**
     * Caches the state of the stencil buffer
     */
    public cacheStencilState() {
        this._cachedStencilBuffer = this.getStencilBuffer();
        this._cachedStencilFunction = this.getStencilFunction();
        this._cachedStencilMask = this.getStencilMask();
        this._cachedStencilOperationPass = this.getStencilOperationPass();
        this._cachedStencilOperationFail = this.getStencilOperationFail();
        this._cachedStencilOperationDepthFail = this.getStencilOperationDepthFail();
        this._cachedStencilReference = this.getStencilFunctionReference();
    }

    /**
     * Restores the state of the stencil buffer
     */
    public restoreStencilState() {
        this.setStencilFunction(this._cachedStencilFunction);
        this.setStencilMask(this._cachedStencilMask);
        this.setStencilBuffer(this._cachedStencilBuffer);
        this.setStencilOperationPass(this._cachedStencilOperationPass);
        this.setStencilOperationFail(this._cachedStencilOperationFail);
        this.setStencilOperationDepthFail(this._cachedStencilOperationDepthFail);
        this.setStencilFunctionReference(this._cachedStencilReference);
    }

    /**
     * Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap.
     */
    public _createImageBitmapFromSource(imageSource: string, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        const promise = new Promise<ImageBitmap>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                image.decode().then(() => {
                    this.createImageBitmap(image, options).then((imageBitmap) => {
                        resolve(imageBitmap);
                    });
                });
            };
            image.onerror = () => {
                reject(`Error loading image ${image.src}`);
            };

            image.src = imageSource;
        });

        return promise;
    }

    /**
     * Engine abstraction for createImageBitmap
     * @param image source for image
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public createImageBitmap(image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return createImageBitmap(image, options);
    }

    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    public resizeImageBitmap(image: HTMLImageElement | ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
        const canvas = this.createCanvas(bufferWidth, bufferHeight);
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Unable to get 2d context for resizeImageBitmap");
        }

        context.drawImage(image, 0, 0);

        // Create VertexData from map data
        // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
        const buffer = <Uint8Array>(<any>context.getImageData(0, 0, bufferWidth, bufferHeight).data);
        return buffer;
    }

    /**
     * Toggle full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public switchFullscreen(requestPointerLock: boolean): void {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen(requestPointerLock);
        }
    }

    /**
     * Enters full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public enterFullscreen(requestPointerLock: boolean): void {
        if (!this.isFullscreen) {
            this._pointerLockRequested = requestPointerLock;
            if (this._renderingCanvas) {
                AbstractEngine._RequestFullscreen(this._renderingCanvas);
            }
        }
    }

    /**
     * Exits full screen mode
     */
    public exitFullscreen(): void {
        if (this.isFullscreen) {
            AbstractEngine._ExitFullscreen();
        }
    }

    /**
     * Ask the browser to promote the current element to fullscreen rendering mode
     * @param element defines the DOM element to promote
     */
    static _RequestFullscreen(element: HTMLElement): void {
        const requestFunction = element.requestFullscreen || (<any>element).webkitRequestFullscreen;
        if (!requestFunction) {
            return;
        }
        requestFunction.call(element);
    }

    /**
     * Asks the browser to exit fullscreen mode
     */
    static _ExitFullscreen(): void {
        const anyDoc = document as any;

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (anyDoc.webkitCancelFullScreen) {
            anyDoc.webkitCancelFullScreen();
        }
    }

    /**
     * Method called to create the default rescale post process on each engine.
     */
    public static _RescalePostProcessFactory: Nullable<(engine: AbstractEngine) => PostProcess> = null;

    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static DefaultLoadingScreenFactory(canvas: HTMLCanvasElement): ILoadingScreen {
        throw _WarnImport("LoadingScreen");
    }
}
