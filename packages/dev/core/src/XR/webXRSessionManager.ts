import { Logger } from "../Misc/logger";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { IDisposable, Scene } from "../scene";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { WebXRRenderTarget } from "./webXRTypes";
import { WebXRManagedOutputCanvas, WebXRManagedOutputCanvasOptions } from "./webXRManagedOutputCanvas";
import type { Engine } from "../Engines/engine";
import type { IWebXRRenderTargetTextureProvider, WebXRLayerRenderTargetTextureProvider } from "./webXRRenderTargetTextureProvider";
import type { Viewport } from "../Maths/math.viewport";
import type { WebXRLayerWrapper } from "./webXRLayerWrapper";
import { NativeXRLayerWrapper, NativeXRRenderTarget } from "./native/nativeXRRenderTarget";
import { WebXRWebGLLayerWrapper } from "./webXRWebGLLayer";
import type { AbstractEngine } from "../Engines/abstractEngine";

/**
 * Manages an XRSession to work with Babylon's engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRSessionManagers
 */
export class WebXRSessionManager implements IDisposable, IWebXRRenderTargetTextureProvider {
    private _engine: Nullable<Engine>;
    private _referenceSpace: XRReferenceSpace;
    private _baseLayerWrapper: Nullable<WebXRLayerWrapper>;
    private _baseLayerRTTProvider: Nullable<WebXRLayerRenderTargetTextureProvider>;
    private _xrNavigator: any;
    private _sessionMode: XRSessionMode;
    private _onEngineDisposedObserver: Nullable<Observer<AbstractEngine>>;

    /**
     * The base reference space from which the session started. good if you want to reset your
     * reference space
     */
    public baseReferenceSpace: XRReferenceSpace;
    /**
     * Current XR frame
     */
    public currentFrame: Nullable<XRFrame>;
    /** WebXR timestamp updated every frame */
    public currentTimestamp: number = -1;
    /**
     * Used just in case of a failure to initialize an immersive session.
     * The viewer reference space is compensated using this height, creating a kind of "viewer-floor" reference space
     */
    public defaultHeightCompensation = 1.7;
    /**
     * Fires every time a new xrFrame arrives which can be used to update the camera
     */
    public onXRFrameObservable: Observable<XRFrame> = new Observable<XRFrame>();
    /**
     * Fires when the reference space changed
     */
    public onXRReferenceSpaceChanged: Observable<XRReferenceSpace> = new Observable();
    /**
     * Fires when the xr session is ended either by the device or manually done
     */
    public onXRSessionEnded: Observable<any> = new Observable<any>();
    /**
     * Fires when the xr session is initialized: right after requestSession was called and returned with a successful result
     */
    public onXRSessionInit: Observable<XRSession> = new Observable<XRSession>();

    /**
     * Fires when the xr reference space has been initialized
     */
    public onXRReferenceSpaceInitialized: Observable<XRReferenceSpace> = new Observable<XRReferenceSpace>();

    /**
     * Fires when the session manager is rendering the first frame
     */
    public onXRReady: Observable<WebXRSessionManager> = new Observable<WebXRSessionManager>();
    /**
     * Underlying xr session
     */
    public session: XRSession;
    /**
     * The viewer (head position) reference space. This can be used to get the XR world coordinates
     * or get the offset the player is currently at.
     */
    public viewerReferenceSpace: XRReferenceSpace;
    /**
     * Are we currently in the XR loop?
     */
    public inXRFrameLoop: boolean = false;
    /**
     * Are we in an XR session?
     */
    public inXRSession: boolean = false;

    private _worldScalingFactor: number = 1;

    /**
     * Observable raised when the world scale has changed
     */
    public onWorldScaleFactorChangedObservable: Observable<{
        previousScaleFactor: number;
        newScaleFactor: number;
    }> = new Observable(undefined, true);

    /**
     * Scale factor to apply to all XR-related elements (camera, controllers)
     */
    public get worldScalingFactor(): number {
        return this._worldScalingFactor;
    }

    public set worldScalingFactor(value: number) {
        const oldValue = this._worldScalingFactor;
        this._worldScalingFactor = value;
        this.onWorldScaleFactorChangedObservable.notifyObservers({
            previousScaleFactor: oldValue,
            newScaleFactor: value,
        });
    }

    /**
     * Constructs a WebXRSessionManager, this must be initialized within a user action before usage
     * @param scene The scene which the session should be created for
     */
    constructor(
        /** The scene which the session should be created for */
        public scene: Scene
    ) {
        this._engine = scene.getEngine() as Engine;
        this._onEngineDisposedObserver = this._engine.onDisposeObservable.addOnce(() => {
            this._engine = null;
        });
        scene.onDisposeObservable.addOnce(() => {
            this.dispose();
        });

        this.onXRSessionEnded.add(() => {
            // Set the scene's pointer camera to null to stop the XR camera being used for picking.
            scene.cameraToUseForPointers = null;
        });
    }

    /**
     * The current reference space used in this session. This reference space can constantly change!
     * It is mainly used to offset the camera's position.
     */
    public get referenceSpace(): XRReferenceSpace {
        return this._referenceSpace;
    }

    /**
     * Set a new reference space and triggers the observable
     */
    public set referenceSpace(newReferenceSpace: XRReferenceSpace) {
        this._referenceSpace = newReferenceSpace;
        this.onXRReferenceSpaceChanged.notifyObservers(this._referenceSpace);
    }

    /**
     * The mode for the managed XR session
     */
    public get sessionMode(): XRSessionMode {
        return this._sessionMode;
    }

    /**
     * Disposes of the session manager
     * This should be called explicitly by the dev, if required.
     */
    public dispose() {
        // disposing without leaving XR? Exit XR first
        if (this.inXRSession) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.exitXRAsync();
        }
        this.onXRReady.clear();
        this.onXRFrameObservable.clear();
        this.onXRSessionEnded.clear();
        this.onXRReferenceSpaceChanged.clear();
        this.onXRReferenceSpaceInitialized.clear();
        this.onXRSessionInit.clear();
        this.onWorldScaleFactorChangedObservable.clear();
        this._engine?.onDisposeObservable.remove(this._onEngineDisposedObserver);
        this._engine = null;
    }

    /**
     * Stops the xrSession and restores the render loop
     * @returns Promise which resolves after it exits XR
     */
    public async exitXRAsync() {
        if (this.session && this.inXRSession) {
            this.inXRSession = false;
            try {
                return await this.session.end();
            } catch {
                Logger.Warn("Could not end XR session.");
            }
        }
    }

    /**
     * Attempts to set the framebuffer-size-normalized viewport to be rendered this frame for this view.
     * In the event of a failure, the supplied viewport is not updated.
     * @param viewport the viewport to which the view will be rendered
     * @param view the view for which to set the viewport
     * @returns whether the operation was successful
     */
    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        return this._baseLayerRTTProvider?.trySetViewportForView(viewport, view) || false;
    }

    /**
     * Gets the correct render target texture to be rendered this frame for this eye
     * @param eye the eye for which to get the render target
     * @returns the render target for the specified eye or null if not available
     */
    public getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture> {
        return this._baseLayerRTTProvider?.getRenderTargetTextureForEye(eye) || null;
    }

    /**
     * Gets the correct render target texture to be rendered this frame for this view
     * @param view the view for which to get the render target
     * @returns the render target for the specified view or null if not available
     */
    public getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture> {
        return this._baseLayerRTTProvider?.getRenderTargetTextureForView(view) || null;
    }

    /**
     * Creates a WebXRRenderTarget object for the XR session
     * @param options optional options to provide when creating a new render target
     * @returns a WebXR render target to which the session can render
     */
    public getWebXRRenderTarget(options?: WebXRManagedOutputCanvasOptions): WebXRRenderTarget {
        const engine = this.scene.getEngine();
        if (this._xrNavigator.xr.native) {
            return new NativeXRRenderTarget(this);
        } else {
            options = options || WebXRManagedOutputCanvasOptions.GetDefaults(engine);
            options.canvasElement = options.canvasElement || engine.getRenderingCanvas() || undefined;
            return new WebXRManagedOutputCanvas(this, options);
        }
    }

    /**
     * Initializes the manager
     * After initialization enterXR can be called to start an XR session
     * @returns Promise which resolves after it is initialized
     */
    public async initializeAsync(): Promise<void> {
        // Check if the browser supports webXR
        this._xrNavigator = navigator;
        if (!this._xrNavigator.xr) {
            throw new Error("WebXR not supported on this browser.");
        }
    }

    /**
     * Initializes an xr session
     * @param xrSessionMode mode to initialize
     * @param xrSessionInit defines optional and required values to pass to the session builder
     * @returns a promise which will resolve once the session has been initialized
     */
    public async initializeSessionAsync(xrSessionMode: XRSessionMode = "immersive-vr", xrSessionInit: XRSessionInit = {}): Promise<XRSession> {
        const session = await this._xrNavigator.xr.requestSession(xrSessionMode, xrSessionInit);

        this.session = session;
        this._sessionMode = xrSessionMode;
        this.inXRSession = true;
        this.onXRSessionInit.notifyObservers(session);

        // handle when the session is ended (By calling session.end or device ends its own session eg. pressing home button on phone)
        this.session.addEventListener(
            "end",
            () => {
                this.inXRSession = false;

                // Notify frame observers
                this.onXRSessionEnded.notifyObservers(null);

                if (this._engine) {
                    // make sure dimensions object is restored
                    this._engine.framebufferDimensionsObject = null;

                    // Restore frame buffer to avoid clear on xr framebuffer after session end
                    this._engine.restoreDefaultFramebuffer();

                    // Need to restart render loop as after the session is ended the last request for new frame will never call callback
                    this._engine.customAnimationFrameRequester = null;
                    this._engine._renderLoop();
                }

                // Dispose render target textures.
                // Only dispose on native because we can't destroy opaque textures on browser.
                if (this.isNative) {
                    this._baseLayerRTTProvider?.dispose();
                }
                this._baseLayerRTTProvider = null;
                this._baseLayerWrapper = null;
            },
            { once: true }
        );

        return this.session;
    }

    /**
     * Checks if a session would be supported for the creation options specified
     * @param sessionMode session mode to check if supported eg. immersive-vr
     * @returns A Promise that resolves to true if supported and false if not
     */
    public async isSessionSupportedAsync(sessionMode: XRSessionMode): Promise<boolean> {
        return await WebXRSessionManager.IsSessionSupportedAsync(sessionMode);
    }

    /**
     * Resets the reference space to the one started the session
     */
    public resetReferenceSpace() {
        this.referenceSpace = this.baseReferenceSpace;
    }

    /**
     * Starts rendering to the xr layer
     */
    public runXRRenderLoop() {
        if (!this.inXRSession || !this._engine) {
            return;
        }

        // Tell the engine's render loop to be driven by the xr session's refresh rate and provide xr pose information
        this._engine.customAnimationFrameRequester = {
            requestAnimationFrame: (callback: FrameRequestCallback) => this.session.requestAnimationFrame(callback),
            renderFunction: (timestamp: number, xrFrame: Nullable<XRFrame>) => {
                if (!this.inXRSession || !this._engine) {
                    return;
                }
                // Store the XR frame and timestamp in the session manager
                this.currentFrame = xrFrame;
                this.currentTimestamp = timestamp;
                if (xrFrame) {
                    this.inXRFrameLoop = true;
                    const framebufferDimensionsObject = this._baseLayerRTTProvider?.getFramebufferDimensions() || null;
                    // equality can be tested as it should be the same object
                    if (this._engine.framebufferDimensionsObject !== framebufferDimensionsObject) {
                        this._engine.framebufferDimensionsObject = framebufferDimensionsObject;
                    }
                    this.onXRFrameObservable.notifyObservers(xrFrame);
                    this._engine._renderLoop();
                    this._engine.framebufferDimensionsObject = null;
                    this.inXRFrameLoop = false;
                }
            },
        };

        this._engine.framebufferDimensionsObject = this._baseLayerRTTProvider?.getFramebufferDimensions() || null;
        this.onXRFrameObservable.addOnce(() => {
            this.onXRReady.notifyObservers(this);
        });

        // Stop window's animation frame and trigger sessions animation frame
        if (typeof window !== "undefined" && window.cancelAnimationFrame) {
            window.cancelAnimationFrame(this._engine._frameHandler);
        }
        this._engine._renderLoop();
    }

    /**
     * Sets the reference space on the xr session
     * @param referenceSpaceType space to set
     * @returns a promise that will resolve once the reference space has been set
     */
    public async setReferenceSpaceTypeAsync(referenceSpaceType: XRReferenceSpaceType = "local-floor"): Promise<XRReferenceSpace> {
        let referenceSpace: XRReferenceSpace;
        let viewerReferenceSpace: Nullable<XRReferenceSpace> = null;
        try {
            referenceSpace = await this.session.requestReferenceSpace(referenceSpaceType);
        } catch (rejectionReason) {
            Logger.Error("XR.requestReferenceSpace failed for the following reason: ");
            Logger.Error(rejectionReason);
            Logger.Log('Defaulting to universally-supported "viewer" reference space type.');

            try {
                viewerReferenceSpace = (await this.session.requestReferenceSpace("viewer")) as XRReferenceSpace;
                const heightCompensation = new XRRigidTransform({ x: 0, y: -this.defaultHeightCompensation, z: 0 });
                referenceSpace = viewerReferenceSpace.getOffsetReferenceSpace(heightCompensation);
            } catch (rejectionReason) {
                Logger.Error(rejectionReason);
                // eslint-disable-next-line no-throw-literal
                throw 'XR initialization failed: required "viewer" reference space type not supported.';
            }
        }
        // create viewer reference space before setting the first reference space
        this.viewerReferenceSpace = viewerReferenceSpace ?? ((await this.session.requestReferenceSpace("viewer")) as XRReferenceSpace);
        // initialize the base and offset (currently the same)
        this.referenceSpace = this.baseReferenceSpace = referenceSpace;
        this.onXRReferenceSpaceInitialized.notifyObservers(referenceSpace);
        return this.referenceSpace;
    }

    /**
     * Updates the render state of the session.
     * Note that this is deprecated in favor of WebXRSessionManager.updateRenderState().
     * @param state state to set
     * @returns a promise that resolves once the render state has been updated
     * @deprecated Use updateRenderState() instead.
     */
    public async updateRenderStateAsync(state: XRRenderState): Promise<void> {
        return await this.session.updateRenderState(state);
    }

    /**
     * @internal
     */
    public _setBaseLayerWrapper(baseLayerWrapper: Nullable<WebXRLayerWrapper>): void {
        if (this.isNative) {
            this._baseLayerRTTProvider?.dispose();
        }
        this._baseLayerWrapper = baseLayerWrapper;
        this._baseLayerRTTProvider = this._baseLayerWrapper?.createRenderTargetTextureProvider(this) || null;
    }

    /**
     * @internal
     */
    public _getBaseLayerWrapper(): Nullable<WebXRLayerWrapper> {
        return this._baseLayerWrapper;
    }

    /**
     * Updates the render state of the session
     * @param state state to set
     */
    public updateRenderState(state: XRRenderStateInit): void {
        if (state.baseLayer) {
            this._setBaseLayerWrapper(this.isNative ? new NativeXRLayerWrapper(state.baseLayer) : new WebXRWebGLLayerWrapper(state.baseLayer));
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.session.updateRenderState(state);
    }

    /**
     * Returns a promise that resolves with a boolean indicating if the provided session mode is supported by this browser
     * @param sessionMode defines the session to test
     * @returns a promise with boolean as final value
     */
    public static async IsSessionSupportedAsync(sessionMode: XRSessionMode): Promise<boolean> {
        if (!(navigator as any).xr) {
            return false;
        }
        // When the specs are final, remove supportsSession!
        const functionToUse = (navigator as any).xr.isSessionSupported || (navigator as any).xr.supportsSession;
        if (!functionToUse) {
            return false;
        } else {
            try {
                const result = functionToUse.call((navigator as any).xr, sessionMode);
                const returnValue = typeof result === "undefined" ? true : result;
                return returnValue;
            } catch (e: any) {
                Logger.Warn(e);
                return false;
            }
        }
    }

    /**
     * Returns true if Babylon.js is using the BabylonNative backend, otherwise false
     */
    public get isNative(): boolean {
        return this._xrNavigator.xr.native ?? false;
    }

    /**
     * The current frame rate as reported by the device
     */
    public get currentFrameRate(): number | undefined {
        return this.session?.frameRate;
    }

    /**
     * A list of supported frame rates (only available in-session!
     */
    public get supportedFrameRates(): Float32Array | undefined {
        return this.session?.supportedFrameRates;
    }

    /**
     * Set the framerate of the session.
     * @param rate the new framerate. This value needs to be in the supportedFrameRates array
     * @returns a promise that resolves once the framerate has been set
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public async updateTargetFrameRate(rate: number): Promise<void> {
        return await this.session.updateTargetFrameRate(rate);
    }

    /**
     * Run a callback in the xr render loop
     * @param callback the callback to call when in XR Frame
     * @param ignoreIfNotInSession if no session is currently running, run it first thing on the next session
     */
    public runInXRFrame(callback: () => void, ignoreIfNotInSession = true): void {
        if (this.inXRFrameLoop) {
            callback();
        } else if (this.inXRSession || !ignoreIfNotInSession) {
            this.onXRFrameObservable.addOnce(callback);
        }
    }

    /**
     * Check if fixed foveation is supported on this device
     */
    public get isFixedFoveationSupported(): boolean {
        return this._baseLayerWrapper?.isFixedFoveationSupported || false;
    }

    /**
     * Get the fixed foveation currently set, as specified by the webxr specs
     * If this returns null, then fixed foveation is not supported
     */
    public get fixedFoveation(): Nullable<number> {
        return this._baseLayerWrapper?.fixedFoveation || null;
    }

    /**
     * Set the fixed foveation to the specified value, as specified by the webxr specs
     * This value will be normalized to be between 0 and 1, 1 being max foveation, 0 being no foveation
     */
    public set fixedFoveation(value: Nullable<number>) {
        const val = Math.max(0, Math.min(1, value || 0));
        if (this._baseLayerWrapper) {
            this._baseLayerWrapper.fixedFoveation = val;
        }
    }

    /**
     * Get the features enabled on the current session
     * This is only available in-session!
     * @see https://www.w3.org/TR/webxr/#dom-xrsession-enabledfeatures
     */
    public get enabledFeatures(): Nullable<string[]> {
        return this.session?.enabledFeatures ?? null;
    }
}
