import { Logger } from "../Misc/logger";
import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { IDisposable, Scene } from "../scene";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { WebXRRenderTarget } from "./webXRTypes";
import { WebXRManagedOutputCanvas, WebXRManagedOutputCanvasOptions } from "./webXRManagedOutputCanvas";
import { Engine } from "../Engines/engine";

interface IRenderTargetProvider {
    getRenderTargetForEye(eye: XREye): Nullable<RenderTargetTexture>;
}

/**
 * Manages an XRSession to work with Babylon's engine
 * @see https://doc.babylonjs.com/how_to/webxr_session_manager
 */
export class WebXRSessionManager implements IDisposable {
    private _engine: Nullable<Engine>;
    private _referenceSpace: XRReferenceSpace;
    private _rttProvider: Nullable<IRenderTargetProvider>;
    private _sessionEnded: boolean = false;
    private _xrNavigator: any;
    private _baseLayer: Nullable<XRWebGLLayer> = null;
    private _renderTargetTextures: Array<RenderTargetTexture> = [];

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
     * Underlying xr session
     */
    public session: XRSession;
    /**
     * The viewer (head position) reference space. This can be used to get the XR world coordinates
     * or get the offset the player is currently at.
     */
    public viewerReferenceSpace: XRReferenceSpace;

    /**
     * Constructs a WebXRSessionManager, this must be initialized within a user action before usage
     * @param scene The scene which the session should be created for
     */
    constructor(
        /** The scene which the session should be created for */
        public scene: Scene
    ) {
        this._engine = scene.getEngine();
        this._engine.onDisposeObservable.addOnce(() => {
            this._engine = null;
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
     * Disposes of the session manager
     * This should be called explicitly by the dev, if required.
     */
    public dispose() {
        // disposing without leaving XR? Exit XR first
        if (!this._sessionEnded) {
            this.exitXRAsync();
        }
        this.onXRFrameObservable.clear();
        this.onXRSessionEnded.clear();
        this.onXRReferenceSpaceChanged.clear();
        this.onXRSessionInit.clear();
    }

    /**
     * Stops the xrSession and restores the render loop
     * @returns Promise which resolves after it exits XR
     */
    public exitXRAsync() {
        if (this.session && !this._sessionEnded) {
            this._sessionEnded = true;
            return this.session.end().catch((e) => {
                Logger.Warn("Could not end XR session.");
            });
        }
        return Promise.resolve();
    }

    /**
     * Gets the correct render target texture to be rendered this frame for this eye
     * @param eye the eye for which to get the render target
     * @returns the render target for the specified eye or null if not available
     */
    public getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture> {
        return this._rttProvider!.getRenderTargetForEye(eye);
    }

    /**
     * Creates a WebXRRenderTarget object for the XR session
     * @param onStateChangedObservable optional, mechanism for enabling/disabling XR rendering canvas, used only on Web
     * @param options optional options to provide when creating a new render target
     * @returns a WebXR render target to which the session can render
     */
    public getWebXRRenderTarget(options?: WebXRManagedOutputCanvasOptions): WebXRRenderTarget {
        const engine = this.scene.getEngine();
        if (this._xrNavigator.xr.native) {
            return this._xrNavigator.xr.getWebXRRenderTarget(engine);
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
    public initializeAsync(): Promise<void> {
        // Check if the browser supports webXR
        this._xrNavigator = navigator;
        if (!this._xrNavigator.xr) {
            return Promise.reject("WebXR not available");
        }
        return Promise.resolve();
    }

    /**
     * Initializes an xr session
     * @param xrSessionMode mode to initialize
     * @param xrSessionInit defines optional and required values to pass to the session builder
     * @returns a promise which will resolve once the session has been initialized
     */
    public initializeSessionAsync(xrSessionMode: XRSessionMode = "immersive-vr", xrSessionInit: XRSessionInit = {}): Promise<XRSession> {
        return this._xrNavigator.xr.requestSession(xrSessionMode, xrSessionInit).then((session: XRSession) => {
            this.session = session;
            this.onXRSessionInit.notifyObservers(session);
            this._sessionEnded = false;

            // handle when the session is ended (By calling session.end or device ends its own session eg. pressing home button on phone)
            this.session.addEventListener(
                "end",
                () => {
                    this._sessionEnded = true;

                    // Notify frame observers
                    this.onXRSessionEnded.notifyObservers(null);
                    // Remove render target texture
                    this._rttProvider = null;

                    if (this._engine) {
                        // make sure dimensions object is restored
                        this._engine.framebufferDimensionsObject = null;

                        // Restore frame buffer to avoid clear on xr framebuffer after session end
                        this._engine.restoreDefaultFramebuffer();

                        // Need to restart render loop as after the session is ended the last request for new frame will never call callback
                        this._engine.customAnimationFrameRequester = null;
                        this._engine._renderLoop();
                    }

                    // Dispose render target textures
                    if (this.isNative) {
                        this._renderTargetTextures.forEach((rtt) => rtt.dispose());
                        this._renderTargetTextures.length = 0;
                    }
                },
                { once: true }
            );

            return this.session;
        });
    }

    /**
     * Checks if a session would be supported for the creation options specified
     * @param sessionMode session mode to check if supported eg. immersive-vr
     * @returns A Promise that resolves to true if supported and false if not
     */
    public isSessionSupportedAsync(sessionMode: XRSessionMode): Promise<boolean> {
        return WebXRSessionManager.IsSessionSupportedAsync(sessionMode);
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
        if (this._sessionEnded || !this._engine) {
            return;
        }

        // Tell the engine's render loop to be driven by the xr session's refresh rate and provide xr pose information
        this._engine.customAnimationFrameRequester = {
            requestAnimationFrame: this.session.requestAnimationFrame.bind(this.session),
            renderFunction: (timestamp: number, xrFrame: Nullable<XRFrame>) => {
                if (this._sessionEnded || !this._engine) {
                    return;
                }
                // Store the XR frame and timestamp in the session manager
                this.currentFrame = xrFrame;
                this.currentTimestamp = timestamp;
                if (xrFrame) {
                    this._engine.framebufferDimensionsObject = this._baseLayer!;
                    this.onXRFrameObservable.notifyObservers(xrFrame);
                    this._engine._renderLoop();
                    this._engine.framebufferDimensionsObject = null;
                }
            },
        };

        if (this._xrNavigator.xr.native) {
            this._rttProvider = this._xrNavigator.xr.getNativeRenderTargetProvider(this.session, this._createRenderTargetTexture.bind(this), this._destroyRenderTargetTexture.bind(this));
        } else {
            // Create render target texture from xr's webgl render target
            let rtt: RenderTargetTexture, framebufferWidth: number, framebufferHeight: number, framebuffer: WebGLFramebuffer;
            this._rttProvider = {
                getRenderTargetForEye: () => {
                    const baseLayer = this._baseLayer!;
                    if (baseLayer.framebufferWidth !== framebufferWidth || baseLayer.framebufferHeight !== framebufferHeight || baseLayer.framebuffer !== framebuffer) {
                        rtt = this._createRenderTargetTexture(baseLayer.framebufferWidth, baseLayer.framebufferHeight, baseLayer.framebuffer);
                        framebufferWidth = baseLayer.framebufferWidth;
                        framebufferHeight = baseLayer.framebufferHeight;
                        framebuffer = baseLayer.framebuffer;
                    }
                    return rtt;
                },
            };
            this._engine.framebufferDimensionsObject = this._baseLayer;
        }

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
    public setReferenceSpaceTypeAsync(referenceSpaceType: XRReferenceSpaceType = "local-floor"): Promise<XRReferenceSpace> {
        return this.session
            .requestReferenceSpace(referenceSpaceType)
            .then(
                (referenceSpace) => {
                    return referenceSpace as XRReferenceSpace;
                },
                (rejectionReason) => {
                    Logger.Error("XR.requestReferenceSpace failed for the following reason: ");
                    Logger.Error(rejectionReason);
                    Logger.Log('Defaulting to universally-supported "viewer" reference space type.');

                    return this.session.requestReferenceSpace("viewer").then(
                        (referenceSpace) => {
                            const heightCompensation = new XRRigidTransform({ x: 0, y: -this.defaultHeightCompensation, z: 0 });
                            return (referenceSpace as XRReferenceSpace).getOffsetReferenceSpace(heightCompensation);
                        },
                        (rejectionReason) => {
                            Logger.Error(rejectionReason);
                            throw 'XR initialization failed: required "viewer" reference space type not supported.';
                        }
                    );
                }
            )
            .then((referenceSpace) => {
                // create viewer reference space before setting the first reference space
                return this.session.requestReferenceSpace("viewer").then((viewerReferenceSpace) => {
                    this.viewerReferenceSpace = viewerReferenceSpace as XRReferenceSpace;
                    return referenceSpace;
                });
            })
            .then((referenceSpace) => {
                // initialize the base and offset (currently the same)
                this.referenceSpace = this.baseReferenceSpace = referenceSpace;
                return this.referenceSpace;
            });
    }

    /**
     * Updates the render state of the session
     * @param state state to set
     * @returns a promise that resolves once the render state has been updated
     */
    public updateRenderStateAsync(state: XRRenderState) {
        if (state.baseLayer) {
            this._baseLayer = state.baseLayer;
        }
        return this.session.updateRenderState(state);
    }

    /**
     * Returns a promise that resolves with a boolean indicating if the provided session mode is supported by this browser
     * @param sessionMode defines the session to test
     * @returns a promise with boolean as final value
     */
    public static IsSessionSupportedAsync(sessionMode: XRSessionMode): Promise<boolean> {
        if (!(navigator as any).xr) {
            return Promise.resolve(false);
        }
        // When the specs are final, remove supportsSession!
        const functionToUse = (navigator as any).xr.isSessionSupported || (navigator as any).xr.supportsSession;
        if (!functionToUse) {
            return Promise.resolve(false);
        } else {
            return functionToUse
                .call((navigator as any).xr, sessionMode)
                .then((result: boolean) => {
                    const returnValue = typeof result === "undefined" ? true : result;
                    return Promise.resolve(returnValue);
                })
                .catch((e: any) => {
                    Logger.Warn(e);
                    return Promise.resolve(false);
                });
        }
    }

    /**
     * Returns true if Babylon.js is using the BabylonNative backend, otherwise false
     */
    public get isNative(): boolean {
        return this._xrNavigator.xr.native ?? false;
    }

    private _createRenderTargetTexture(width: number, height: number, framebuffer: WebGLFramebuffer): RenderTargetTexture {
        if (!this._engine) {
            throw new Error("Engine is disposed");
        }

        // Create internal texture
        const internalTexture = new InternalTexture(this._engine, InternalTextureSource.Unknown, true);
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture._framebuffer = framebuffer;

        // Create render target texture from the internal texture
        const renderTargetTexture = new RenderTargetTexture("XR renderTargetTexture", { width: width, height: height }, this.scene, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
        renderTargetTexture._texture = internalTexture;
        renderTargetTexture.disableRescaling();

        // Store the render target texture for cleanup when the session ends.
        this._renderTargetTextures.push(renderTargetTexture);

        return renderTargetTexture;
    }

    private _destroyRenderTargetTexture(renderTargetTexture: RenderTargetTexture): void {
        this._renderTargetTextures.splice(this._renderTargetTextures.indexOf(renderTargetTexture), 1);
        renderTargetTexture.dispose();
    }
}
