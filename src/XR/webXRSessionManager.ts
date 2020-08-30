import { Logger } from "../Misc/logger";
import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { IDisposable, Scene } from "../scene";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { WebXRRenderTarget } from "./webXRTypes";
import { WebXRManagedOutputCanvas, WebXRManagedOutputCanvasOptions } from "./webXRManagedOutputCanvas";

interface IRenderTargetProvider {
    getRenderTargetForEye(eye: XREye): RenderTargetTexture;
}

/**
 * Manages an XRSession to work with Babylon's engine
 * @see https://doc.babylonjs.com/how_to/webxr_session_manager
 */
export class WebXRSessionManager implements IDisposable {
    private _referenceSpace: XRReferenceSpace;
    private _rttProvider: Nullable<IRenderTargetProvider>;
    private _sessionEnded: boolean = false;
    private _xrNavigator: any;
    private baseLayer: Nullable<XRWebGLLayer> = null;

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
     * Fires when the xr session is ended either by the device or manually done
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
    ) {}

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
     * @returns the render target for the specified eye
     */
    public getRenderTargetTextureForEye(eye: XREye): RenderTargetTexture {
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
            options.canvasElement = engine.getRenderingCanvas() || undefined;
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
                    const engine = this.scene.getEngine();
                    this._sessionEnded = true;
                    // Remove render target texture and notify frame observers
                    this._rttProvider = null;
                    // make sure dimensions object is restored
                    engine.framebufferDimensionsObject = null;

                    // Restore frame buffer to avoid clear on xr framebuffer after session end
                    engine.restoreDefaultFramebuffer();

                    // Need to restart render loop as after the session is ended the last request for new frame will never call callback
                    engine.customAnimationFrameRequester = null;
                    this.onXRSessionEnded.notifyObservers(null);
                    engine._renderLoop();
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
        const engine = this.scene.getEngine();
        // Tell the engine's render loop to be driven by the xr session's refresh rate and provide xr pose information
        engine.customAnimationFrameRequester = {
            requestAnimationFrame: this.session.requestAnimationFrame.bind(this.session),
            renderFunction: (timestamp: number, xrFrame: Nullable<XRFrame>) => {
                if (this._sessionEnded) {
                    return;
                }
                // Store the XR frame and timestamp in the session manager
                this.currentFrame = xrFrame;
                this.currentTimestamp = timestamp;
                if (xrFrame) {
                    engine.framebufferDimensionsObject = this.baseLayer!;
                    this.onXRFrameObservable.notifyObservers(xrFrame);
                    engine._renderLoop();
                    engine.framebufferDimensionsObject = null;
                }
            },
        };

        if (this._xrNavigator.xr.native) {
            this._rttProvider = this._xrNavigator.xr.getNativeRenderTargetProvider(this.session, this._createRenderTargetTexture.bind(this));
        } else {
            // Create render target texture from xr's webgl render target
            const rtt = this._createRenderTargetTexture(this.baseLayer!.framebufferWidth, this.baseLayer!.framebufferHeight, this.baseLayer!.framebuffer);
            this._rttProvider = { getRenderTargetForEye: () => rtt };
            engine.framebufferDimensionsObject = this.baseLayer;
        }

        // Stop window's animation frame and trigger sessions animation frame
        if (window.cancelAnimationFrame) {
            window.cancelAnimationFrame(engine._frameHandler);
        }
        engine._renderLoop();
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
                (referenceSpace: XRReferenceSpace) => {
                    return referenceSpace;
                },
                (rejectionReason) => {
                    Logger.Error("XR.requestReferenceSpace failed for the following reason: ");
                    Logger.Error(rejectionReason);
                    Logger.Log('Defaulting to universally-supported "viewer" reference space type.');

                    return this.session.requestReferenceSpace("viewer").then(
                        (referenceSpace: XRReferenceSpace) => {
                            const heightCompensation = new XRRigidTransform({ x: 0, y: -this.defaultHeightCompensation, z: 0 });
                            return referenceSpace.getOffsetReferenceSpace(heightCompensation);
                        },
                        (rejectionReason) => {
                            Logger.Error(rejectionReason);
                            throw "XR initialization failed: required \"viewer\" reference space type not supported.";
                        }
                    );
                }
            )
            .then((referenceSpace) => {
                // create viewer reference space before setting the first reference space
                return this.session.requestReferenceSpace("viewer").then((viewerReferenceSpace: XRReferenceSpace) => {
                    this.viewerReferenceSpace = viewerReferenceSpace;
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
            this.baseLayer = state.baseLayer;
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

    private _createRenderTargetTexture(width: number, height: number, framebuffer: Nullable<WebGLFramebuffer> = null) {
        // Create internal texture
        var internalTexture = new InternalTexture(this.scene.getEngine(), InternalTextureSource.Unknown, true);
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture._framebuffer = framebuffer;

        // Create render target texture from the internal texture
        var renderTargetTexture = new RenderTargetTexture("XR renderTargetTexture", { width: width, height: height }, this.scene, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
        renderTargetTexture._texture = internalTexture;

        return renderTargetTexture;
    }
}
