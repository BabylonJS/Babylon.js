import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { InternalTexture } from "../Materials/Textures/internalTexture";
import { _TimeToken } from "../Instrumentation/timeToken";
import { IAudioEngine } from "../Audio/audioEngine";
import { IOfflineProvider } from "../Offline/IOfflineProvider";
import { ILoadingScreen } from "../Loading/loadingScreen";
import { _DepthCullingState, _StencilState, _AlphaState } from "../States/index";
import { DomManagement } from "../Misc/domManagement";
import { EngineStore } from "./engineStore";
import { _DevTools } from '../Misc/devTools';
import { WebGLPipelineContext } from './WebGL/webGLPipelineContext';
import { IPipelineContext } from './IPipelineContext';
import { ICustomAnimationFrameRequester } from '../Misc/customAnimationFrameRequester';
import { IPerformanceMonitor } from '../Misc/IPerformanceMonitor';
import { BaseEngine, EngineOptions } from './baseEngine';
import { Constants } from './constants';

declare type Material = import("../Materials/material").Material;
declare type PostProcess = import("../PostProcesses/postProcess").PostProcess;
declare type Texture = import("../Materials/Textures/texture").Texture;

/**
 * Defines the interface used by display changed events
 */
export interface IDisplayChangedEventArgs {
    /** Gets the vrDisplay object (if any) */
    vrDisplay: Nullable<any>;
    /** Gets a boolean indicating if webVR is supported */
    vrSupported: boolean;
}

/**
 * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio
 */
export class Engine extends BaseEngine {

    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    public static get NpmPackage(): string {
        return BaseEngine.NpmPackage;
    }

    /**
     * Returns the current version of the framework
     */
    public static get Version(): string {
        return BaseEngine.Version;
    }

    /** Gets the list of created engines */
    public static get Instances(): Engine[] {
        return EngineStore.Instances;
    }

    /**
     * Gets the latest created engine
     */
    public static get LastCreatedEngine(): Nullable<Engine> {
        return EngineStore.LastCreatedEngine;
    }

    /**
     * Gets the latest created scene
     */
    public static get LastCreatedScene(): Nullable<Scene> {
        return EngineStore.LastCreatedScene;
    }

    /**
     * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
     * @param flag defines which part of the materials must be marked as dirty
     * @param predicate defines a predicate used to filter which materials should be affected
     */
    public static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
        for (var engineIndex = 0; engineIndex < Engine.Instances.length; engineIndex++) {
            var engine = Engine.Instances[engineIndex];

            for (var sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
                engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
            }
        }
    }

    /**
     * Factory used to create the performance monitor
     * @returns a new PerformanceMonitor
     */
    public static DefaultPerformanceMonitorFactory(): IPerformanceMonitor {
        throw _DevTools.WarnImport("PerformanceMonitor");
    }

    /**
     * Method called to create the default loading screen.
     * This can be overriden in your own app.
     * @param canvas The rendering canvas element
     * @returns The loading screen
     */
    public static DefaultLoadingScreenFactory(canvas: HTMLCanvasElement): ILoadingScreen {
        throw _DevTools.WarnImport("LoadingScreen");
    }

    /**
     * Method called to create the default rescale post process on each engine.
     */
    public static _RescalePostProcessFactory: Nullable<(engine: Engine) => PostProcess> = null;

    // Members

    /**
     * Gets or sets a boolean to enable/disable IndexedDB support and avoid XHR on .manifest
     **/
    public enableOfflineSupport = false;

    /**
     * Gets or sets a boolean to enable/disable checking manifest if IndexedDB support is enabled (js will always consider the database is up to date)
     **/
    public disableManifestCheck = false;

    /**
     * Gets the list of created scenes
     */
    public scenes = new Array<Scene>();

    /**
     * Event raised when a new scene is created
     */
    public onNewSceneAddedObservable = new Observable<Scene>();

    /**
     * Gets the list of created postprocesses
     */
    public postProcesses = new Array<PostProcess>();

    // Observables

    /**
     * Observable event triggered each time the rendering canvas is resized
     */
    public onResizeObservable = new Observable<Engine>();

    /**
     * Observable event triggered each time the canvas loses focus
     */
    public onCanvasBlurObservable = new Observable<Engine>();

    /**
     * Observable event triggered each time the canvas gains focus
     */
    public onCanvasFocusObservable = new Observable<Engine>();

    /**
     * Observable event triggered each time the canvas receives pointerout event
     */
    public onCanvasPointerOutObservable = new Observable<PointerEvent>();

    /**
     * Observable event triggered before each texture is initialized
     */
    public onBeforeTextureInitObservable = new Observable<Texture>();

    /**
     * Observable raised when the engine begins a new frame
     */
    public onBeginFrameObservable = new Observable<Engine>();

    /**
     * If set, will be used to request the next animation frame for the render loop
     */
    public customAnimationFrameRequester: Nullable<ICustomAnimationFrameRequester> = null;

    /**
     * Observable raised when the engine ends the current frame
     */
    public onEndFrameObservable = new Observable<Engine>();

    /**
     * Observable raised when the engine is about to compile a shader
     */
    public onBeforeShaderCompilationObservable = new Observable<Engine>();

    /**
     * Observable raised when the engine has jsut compiled a shader
     */
    public onAfterShaderCompilationObservable = new Observable<Engine>();

    /**
     * Gets the audio engine
     * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
     * @ignorenaming
     */
    public static audioEngine: IAudioEngine;

    /**
     * Default AudioEngine factory responsible of creating the Audio Engine.
     * By default, this will create a BabylonJS Audio Engine if the workload has been embedded.
     */
    public static AudioEngineFactory: (hostElement: Nullable<HTMLElement>) => IAudioEngine;

    /**
     * Default offline support factory responsible of creating a tool used to store data locally.
     * By default, this will create a Database object if the workload has been embedded.
     */
    public static OfflineProviderFactory: (urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck: boolean) => IOfflineProvider;

    private _loadingScreen: ILoadingScreen;
    private _pointerLockRequested: boolean;
    private _dummyFramebuffer: WebGLFramebuffer;
    private _rescalePostProcess: PostProcess;

    protected get _supportsHardwareTextureRescaling() {
        return !!Engine._RescalePostProcessFactory;
    }

    // FPS
    private _fps = 60;
    private _deltaTime = 0;
    /**
     * Turn this value on if you want to pause FPS computation when in background
     */
    public disablePerformanceMonitorInBackground = false;

    private _performanceMonitor: Nullable<IPerformanceMonitor> = null;
    /**
     * Gets the performance monitor attached to this engine
     * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#engineinstrumentation
     */
    public get performanceMonitor(): IPerformanceMonitor {
        if (!this._performanceMonitor) {
            this._performanceMonitor = Engine.DefaultPerformanceMonitorFactory();
        }
        return this._performanceMonitor;
    }

    // Focus
    private _onFocus: () => void;
    private _onBlur: () => void;
    private _onCanvasPointerOut: (event: PointerEvent) => void;
    private _onCanvasBlur: () => void;
    private _onCanvasFocus: () => void;

    private _onFullscreenChange: () => void;
    private _onPointerLockChange: () => void;

    /**
     * Creates a new engine
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which alreay used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(canvasOrContext: Nullable<HTMLCanvasElement | WebGLRenderingContext>, antialias?: boolean, options?: EngineOptions, adaptToDeviceRatio: boolean = false) {
        super(canvasOrContext, antialias, options, adaptToDeviceRatio);

        if (!canvasOrContext) {
            return;
        }

        options = options || {};

        Engine.Instances.push(this);

        if ((<HTMLCanvasElement>canvasOrContext).getContext) {
            let canvas = <HTMLCanvasElement>canvasOrContext;

            this._onCanvasFocus = () => {
                this.onCanvasFocusObservable.notifyObservers(this);
            };

            this._onCanvasBlur = () => {
                this.onCanvasBlurObservable.notifyObservers(this);
            };

            canvas.addEventListener("focus", this._onCanvasFocus);
            canvas.addEventListener("blur", this._onCanvasBlur);

            this._onBlur = () => {
                if (this.disablePerformanceMonitorInBackground && this._performanceMonitor) {
                    this._performanceMonitor.disable();
                }
                this._windowIsBackground = true;
            };

            this._onFocus = () => {
                if (this.disablePerformanceMonitorInBackground && this._performanceMonitor) {
                    this._performanceMonitor.enable();
                }
                this._windowIsBackground = false;
            };

            this._onCanvasPointerOut = (ev) => {
                this.onCanvasPointerOutObservable.notifyObservers(ev);
            };

            if (DomManagement.IsWindowObjectExist()) {
                let hostWindow = this.getHostWindow();
                hostWindow.addEventListener("blur", this._onBlur);
                hostWindow.addEventListener("focus", this._onFocus);
            }

            canvas.addEventListener("pointerout", this._onCanvasPointerOut);

            let anyDoc = document as any;

            // Fullscreen
            this._onFullscreenChange = () => {

                if (anyDoc.fullscreen !== undefined) {
                    this.isFullscreen = anyDoc.fullscreen;
                } else if (anyDoc.mozFullScreen !== undefined) {
                    this.isFullscreen = anyDoc.mozFullScreen;
                } else if (anyDoc.webkitIsFullScreen !== undefined) {
                    this.isFullscreen = anyDoc.webkitIsFullScreen;
                } else if (anyDoc.msIsFullScreen !== undefined) {
                    this.isFullscreen = anyDoc.msIsFullScreen;
                }

                // Pointer lock
                if (this.isFullscreen && this._pointerLockRequested && canvas) {
                    Engine._RequestPointerlock(canvas);
                }
            };

            document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("msfullscreenchange", this._onFullscreenChange, false);

            // Pointer lock
            this._onPointerLockChange = () => {
                this.isPointerLock = (anyDoc.mozPointerLockElement === canvas ||
                    anyDoc.webkitPointerLockElement === canvas ||
                    anyDoc.msPointerLockElement === canvas ||
                    anyDoc.pointerLockElement === canvas
                );
            };

            document.addEventListener("pointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("mspointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("mozpointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, false);

            this._connectVREvents();

            // Create Audio Engine if needed.
            if (!Engine.audioEngine && options.audioEngine && Engine.AudioEngineFactory) {
                Engine.audioEngine = Engine.AudioEngineFactory(this.getRenderingCanvas());
            }

            this.enableOfflineSupport = Engine.OfflineProviderFactory !== undefined;
        }

        // Load WebVR Devices
        this._prepareVRComponent();
        if (options.autoEnableWebVR) {
            this.initWebVR();
        }
    }

    /**
     * Initializes a webVR display and starts listening to display change events
     * The onVRDisplayChangedObservable will be notified upon these changes
     * @returns The onVRDisplayChangedObservable
     */
    public initWebVR(): Observable<IDisplayChangedEventArgs> {
        throw _DevTools.WarnImport("WebVRCamera");
    }

    /** @hidden */
    public _prepareVRComponent() {
        // Do nothing as the engine side effect will overload it
    }

    /** @hidden */
    public _connectVREvents(canvas?: HTMLCanvasElement, document?: any) {
        // Do nothing as the engine side effect will overload it
    }

    /** @hidden */
    public _submitVRFrame() {
        // Do nothing as the engine side effect will overload it
    }
    /**
     * Call this function to leave webVR mode
     * Will do nothing if webVR is not supported or if there is no webVR device
     * @see http://doc.babylonjs.com/how_to/webvr_camera
     */
    public disableVR() {
        // Do nothing as the engine side effect will overload it
    }

    /**
     * Gets a boolean indicating that the system is in VR mode and is presenting
     * @returns true if VR mode is engaged
     */
    public isVRPresenting() {
        return false;
    }

    /** @hidden */
    public _requestVRFrame() {
        // Do nothing as the engine side effect will overload it
    }

    protected _rebuildBuffers(): void {
        // Index / Vertex
        for (var scene of this.scenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
            scene._rebuildTextures();
        }

        super._rebuildBuffers();
    }

    public _renderLoop(): void {
        if (!this._contextWasLost) {
            var shouldRender = true;
            if (!this.renderEvenInBackground && this._windowIsBackground) {
                shouldRender = false;
            }

            if (shouldRender) {
                // Start new frame
                this.beginFrame();

                for (var index = 0; index < this._activeRenderLoops.length; index++) {
                    var renderFunction = this._activeRenderLoops[index];

                    renderFunction();
                }

                // Present
                this.endFrame();
            }
        }

        if (this._activeRenderLoops.length > 0) {
            // Register new frame
            if (this.customAnimationFrameRequester) {
                this.customAnimationFrameRequester.requestID = this._queueNewFrame(this.customAnimationFrameRequester.renderFunction || this._bindedRenderFunction, this.customAnimationFrameRequester);
                this._frameHandler = this.customAnimationFrameRequester.requestID;
            } else if (this.isVRPresenting()) {
                this._requestVRFrame();
            } else {
                this._frameHandler = this._queueNewFrame(this._bindedRenderFunction, this.getHostWindow());
            }
        } else {
            this._renderingQueueLaunched = false;
        }
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
                Engine._RequestFullscreen(this._renderingCanvas);
            }
        }
    }

    /**
     * Exits full screen mode
     */
    public exitFullscreen(): void {
        if (this.isFullscreen) {
            Engine._ExitFullscreen();
        }
    }

    /**
     * Enters Pointerlock mode
     */
    public enterPointerlock(): void {
        if (this._renderingCanvas) {
            Engine._RequestPointerlock(this._renderingCanvas);
        }
    }

    /**
     * Exits Pointerlock mode
     */
    public exitPointerlock(): void {
        Engine._ExitPointerlock();
    }

    /**
     * Begin a new frame
     */
    public beginFrame(): void {
        this._measureFps();

        this.onBeginFrameObservable.notifyObservers(this);
        super.beginFrame();
    }

    /**
     * Enf the current frame
     */
    public endFrame(): void {
        super.endFrame();
        this._submitVRFrame();

        this.onEndFrameObservable.notifyObservers(this);
    }

    public resize(): void {
        // We're not resizing the size of the canvas while in VR mode & presenting
        if (this.isVRPresenting()) {
            return;
        }

        super.resize();
    }

    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     */
    public setSize(width: number, height: number): void {
        if (!this._renderingCanvas) {
            return;
        }

        super.setSize(width, height);

        for (var index = 0; index < this.scenes.length; index++) {
            var scene = this.scenes[index];

            for (var camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                var cam = scene.cameras[camIndex];

                cam._currentRenderId = 0;
            }
        }

        if (this.onResizeObservable.hasObservers) {
            this.onResizeObservable.notifyObservers(this);
        }
    }

    public _deletePipelineContext(pipelineContext: IPipelineContext): void {
        let webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (webGLPipelineContext && webGLPipelineContext.program) {
            if (webGLPipelineContext.transformFeedback) {
                this.deleteTransformFeedback(webGLPipelineContext.transformFeedback);
                webGLPipelineContext.transformFeedback = null;
            }
        }
        super._deletePipelineContext(pipelineContext);
    }

    public createShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        context = context || this._gl;

        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        let program = super.createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
        this.onAfterShaderCompilationObservable.notifyObservers(this);

        return program;
    }

    protected _createShaderProgram(pipelineContext: WebGLPipelineContext, vertexShader: WebGLShader, fragmentShader: WebGLShader, context: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        var shaderProgram = context.createProgram();
        pipelineContext.program = shaderProgram;

        if (!shaderProgram) {
            throw new Error("Unable to create program");
        }

        context.attachShader(shaderProgram, vertexShader);
        context.attachShader(shaderProgram, fragmentShader);

        context.linkProgram(shaderProgram);

        pipelineContext.context = context;
        pipelineContext.vertexShader = vertexShader;
        pipelineContext.fragmentShader = fragmentShader;

        if (!pipelineContext.isParallelCompiled) {
            this._finalizePipelineContext(pipelineContext);
        }

        return shaderProgram;
    }

    public _releaseTexture(texture: InternalTexture): void {
        super._releaseTexture(texture);

        // Set output texture of post process to null if the texture has been released/disposed
        this.scenes.forEach((scene) => {
            scene.postProcesses.forEach((postProcess) => {
                if (postProcess._outputTexture == texture) {
                    postProcess._outputTexture = null;
                }
            });
            scene.cameras.forEach((camera) => {
                camera._postProcesses.forEach((postProcess) => {
                    if (postProcess) {
                        if (postProcess._outputTexture == texture) {
                            postProcess._outputTexture = null;
                        }
                    }
                });
            });
        });
    }

    /**
     * @hidden
     * Rescales a texture
     * @param source input texutre
     * @param destination destination texture
     * @param scene scene to use to render the resize
     * @param internalFormat format to use when resizing
     * @param onComplete callback to be called when resize has completed
     */
    public _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<any>, internalFormat: number, onComplete: () => void): void {
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

        let rtt = this.createRenderTargetTexture({
            width: destination.width,
            height: destination.height,
        }, {
                generateMipMaps: false,
                type: Constants.TEXTURETYPE_UNSIGNED_INT,
                samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                generateDepthBuffer: false,
                generateStencilBuffer: false
            }
        );

        if (!this._rescalePostProcess && Engine._RescalePostProcessFactory) {
            this._rescalePostProcess = Engine._RescalePostProcessFactory(this);
        }

        this._rescalePostProcess.getEffect().executeWhenCompiled(() => {
            this._rescalePostProcess.onApply = function(effect) {
                effect._bindTexture("textureSampler", source);
            };

            let hostingScene: Scene = scene;

            if (!hostingScene) {
                hostingScene = this.scenes[this.scenes.length - 1];
            }
            hostingScene.postProcessManager.directRender([this._rescalePostProcess], rtt, true);

            this._bindTextureDirectly(this._gl.TEXTURE_2D, destination, true);
            this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

            this.unBindFramebuffer(rtt);
            this._releaseTexture(rtt);

            if (onComplete) {
                onComplete();
            }
        });
    }

    // FPS

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

    private _measureFps(): void {
        if (!this._performanceMonitor) {
            return;
        }
        this._performanceMonitor.sampleFrame();
        this._fps = this._performanceMonitor.averageFPS;
        this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
    }

    /** @hidden */
    public _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null): ArrayBufferView {
        let gl = this._gl;
        if (!this._dummyFramebuffer) {
            let dummy = gl.createFramebuffer();

            if (!dummy) {
                throw new Error("Unable to create dummy framebuffer");
            }

            this._dummyFramebuffer = dummy;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._dummyFramebuffer);

        if (faceIndex > -1) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._webGLTexture, level);
        } else {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, level);
        }

        let readType = (texture.type !== undefined) ? this._getWebGLTextureType(texture.type) : gl.UNSIGNED_BYTE;

        switch (readType) {
            case gl.UNSIGNED_BYTE:
                if (!buffer) {
                    buffer = new Uint8Array(4 * width * height);
                }
                readType = gl.UNSIGNED_BYTE;
                break;
            default:
                if (!buffer) {
                    buffer = new Float32Array(4 * width * height);
                }
                readType = gl.FLOAT;
                break;
        }

        gl.readPixels(0, 0, width, height, gl.RGBA, readType, <DataView>buffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._currentFramebuffer);

        return buffer;
    }

    public dispose(): void {
        this.hideLoadingUI();

        super.dispose();

        this.onNewSceneAddedObservable.clear();

        // Release postProcesses
        while (this.postProcesses.length) {
            this.postProcesses[0].dispose();
        }

        // Rescale PP
        if (this._rescalePostProcess) {
            this._rescalePostProcess.dispose();
        }

        // Release scenes
        while (this.scenes.length) {
            this.scenes[0].dispose();
        }

        // Release audio engine
        if (Engine.Instances.length === 1 && Engine.audioEngine) {
            Engine.audioEngine.dispose();
        }

        if (this._dummyFramebuffer) {
            this._gl.deleteFramebuffer(this._dummyFramebuffer);
        }

        //WebVR
        this.disableVR();

        // Events
        if (DomManagement.IsWindowObjectExist()) {
            window.removeEventListener("blur", this._onBlur);
            window.removeEventListener("focus", this._onFocus);
            if (this._renderingCanvas) {
                this._renderingCanvas.removeEventListener("focus", this._onCanvasFocus);
                this._renderingCanvas.removeEventListener("blur", this._onCanvasBlur);
                this._renderingCanvas.removeEventListener("pointerout", this._onCanvasPointerOut);
            }
            document.removeEventListener("fullscreenchange", this._onFullscreenChange);
            document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("pointerlockchange", this._onPointerLockChange);
            document.removeEventListener("mspointerlockchange", this._onPointerLockChange);
            document.removeEventListener("mozpointerlockchange", this._onPointerLockChange);
            document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange);
        }

        // Remove from Instances
        var index = Engine.Instances.indexOf(this);

        if (index >= 0) {
            Engine.Instances.splice(index, 1);
        }

        // Observables
        this.onResizeObservable.clear();
        this.onCanvasBlurObservable.clear();
        this.onCanvasFocusObservable.clear();
        this.onCanvasPointerOutObservable.clear();
        this.onBeginFrameObservable.clear();
        this.onEndFrameObservable.clear();
    }

    // Loading screen

    /**
     * Display the loading screen
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public displayLoadingUI(): void {
        if (!DomManagement.IsWindowObjectExist()) {
            return;
        }
        const loadingScreen = this.loadingScreen;
        if (loadingScreen) {
            loadingScreen.displayLoadingUI();
        }
    }

    /**
     * Hide the loading screen
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public hideLoadingUI(): void {
        if (!DomManagement.IsWindowObjectExist()) {
            return;
        }
        const loadingScreen = this._loadingScreen;
        if (loadingScreen) {
            loadingScreen.hideLoadingUI();
        }
    }

    /**
     * Gets the current loading screen object
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public get loadingScreen(): ILoadingScreen {
        if (!this._loadingScreen && this._renderingCanvas) {
            this._loadingScreen = Engine.DefaultLoadingScreenFactory(this._renderingCanvas);
        }
        return this._loadingScreen;
    }

    /**
     * Sets the current loading screen object
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public set loadingScreen(loadingScreen: ILoadingScreen) {
        this._loadingScreen = loadingScreen;
    }

    /**
     * Sets the current loading screen text
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public set loadingUIText(text: string) {
        this.loadingScreen.loadingUIText = text;
    }

    /**
     * Sets the current loading screen background color
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public set loadingUIBackgroundColor(color: string) {
        this.loadingScreen.loadingUIBackgroundColor = color;
    }
}
