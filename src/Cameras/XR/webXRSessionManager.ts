import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";
import { Nullable } from "../../types";
import { IDisposable, Scene } from "../../scene";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { WebXRRenderTarget } from './webXRTypes';
import { WebXRManagedOutputCanvas, WebXRManagedOutputCanvasOptions } from './webXRManagedOutputCanvas';

interface IRenderTargetProvider {
    getRenderTargetForEye(eye: XREye): RenderTargetTexture;
}

class RenderTargetProvider implements IRenderTargetProvider {
    private _texture: RenderTargetTexture;

    public constructor(texture: RenderTargetTexture) {
        this._texture = texture;
    }

    public getRenderTargetForEye(eye: XREye): RenderTargetTexture {
        return this._texture;
    }
}

/**
 * Manages an XRSession to work with Babylon's engine
 * @see https://doc.babylonjs.com/how_to/webxr
 */
export class WebXRSessionManager implements IDisposable {
    /**
     * Fires every time a new xrFrame arrives which can be used to update the camera
     */
    public onXRFrameObservable: Observable<XRFrame> = new Observable<XRFrame>();
    /**
     * Fires when the xr session is ended either by the device or manually done
     */
    public onXRSessionEnded: Observable<any> = new Observable<any>();
    /**
     * Fires when the xr session is ended either by the device or manually done
     */
    public onXRSessionInit: Observable<XRSession> = new Observable<XRSession>();

    /**
     * Fires when the reference space changed
     */
    public onXRReferenceSpaceChanged: Observable<XRReferenceSpace> = new Observable();

    /**
     * Underlying xr session
     */
    public session: XRSession;

    /**
     * The viewer (head position) reference space. This can be used to get the XR world coordinates
     * or get the offset the player is currently at.
     */
    public viewerReferenceSpace: XRReferenceSpace;

    private _referenceSpace: XRReferenceSpace;
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
     * The base reference space from which the session started. good if you want to reset your
     * reference space
     */
    public baseReferenceSpace: XRReferenceSpace;

    /**
     * Used just in case of a failure to initialize an immersive session.
     * The viewer reference space is compensated using this height, creating a kind of "viewer-floor" reference space
     */
    public defaultHeightCompensation = 1.7;

    /**
     * Current XR frame
     */
    public currentFrame: Nullable<XRFrame>;

    /** WebXR timestamp updated every frame */
    public currentTimestamp: number = -1;

    private _xrNavigator: any;
    private baseLayer: Nullable<XRWebGLLayer> = null;
    private _rttProvider: Nullable<IRenderTargetProvider>;

    private _sessionEnded: boolean = false;

    /**
     * Constructs a WebXRSessionManager, this must be initialized within a user action before usage
     * @param scene The scene which the session should be created for
     */
    constructor(
        /** The scene which the session should be created for */
        public scene: Scene
    ) {

    }

    /**
     * Initializes the manager
     * After initialization enterXR can be called to start an XR session
     * @returns Promise which resolves after it is initialized
     */
    public initializeAsync(): Promise<void> {
        Logger.Warn("The WebXR APIs are still under development and are subject to change in the future.");
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
    public initializeSessionAsync(xrSessionMode: XRSessionMode, xrSessionInit: XRSessionInit = {}): Promise<XRSession> {
        return this._xrNavigator.xr.requestSession(xrSessionMode, xrSessionInit).then((session: XRSession) => {
            this.session = session;
            this.onXRSessionInit.notifyObservers(session);
            this._sessionEnded = false;

            // handle when the session is ended (By calling session.end or device ends its own session eg. pressing home button on phone)
            this.session.addEventListener("end", () => {
                this._sessionEnded = true;
                // Remove render target texture and notify frame obervers
                this._rttProvider = null;

                // Restore frame buffer to avoid clear on xr framebuffer after session end
                this.scene.getEngine().restoreDefaultFramebuffer();

                // Need to restart render loop as after the session is ended the last request for new frame will never call callback
                this.scene.getEngine().customAnimationFrameRequester = null;
                this.onXRSessionEnded.notifyObservers(null);
                this.scene.getEngine()._renderLoop();
            }, { once: true });
            return this.session;
        });
    }

    /**
     * Sets the reference space on the xr session
     * @param referenceSpace space to set
     * @returns a promise that will resolve once the reference space has been set
     */
    public setReferenceSpaceAsync(referenceSpace: XRReferenceSpaceType) {
        return this.session.requestReferenceSpace(referenceSpace).then((referenceSpace: XRReferenceSpace) => {
            return referenceSpace;
        }, (rejectionReason) => {
            Logger.Error("XR.requestReferenceSpace failed for the following reason: ");
            Logger.Error(rejectionReason);
            Logger.Log("Defaulting to universally-supported \"viewer\" reference space type.");

            return this.session.requestReferenceSpace("viewer").then((referenceSpace: XRReferenceSpace) => {
                const heightCompensation = new XRRigidTransform({ x: 0, y: -this.defaultHeightCompensation, z: 0 });
                return referenceSpace.getOffsetReferenceSpace(heightCompensation);
            }, (rejectionReason) => {
                Logger.Error(rejectionReason);
                throw "XR initialization failed: required \"viewer\" reference space type not supported.";
            });
        }).then((referenceSpace) => {
            // initialize the base and offset (currently the same)
            this.referenceSpace = this.baseReferenceSpace = referenceSpace;

            this.session.requestReferenceSpace("viewer").then((referenceSpace: XRReferenceSpace) => {
                this.viewerReferenceSpace = referenceSpace;
            });
        });
    }

    /**
     * Resets the reference space to the one started the session
     */
    public resetReferenceSpace() {
        this.referenceSpace = this.baseReferenceSpace;
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
     * Starts rendering to the xr layer
     * @returns a promise that will resolve once rendering has started
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
                    this.onXRFrameObservable.notifyObservers(xrFrame);
                    // only run the render loop if a frame exists
                    engine._renderLoop();
                }
            }
        };

        if (this._xrNavigator.xr.native) {
            this._rttProvider = this._xrNavigator.xr.getNativeRenderTargetProvider(this.session, (width: number, height: number) => {
                return engine.createRenderTargetTexture({ width: width, height: height }, false);
            });
        } else {
            // Create render target texture from xr's webgl render target
            this._rttProvider = new RenderTargetProvider(WebXRSessionManager._CreateRenderTargetTextureFromSession(this.session, this.scene, this.baseLayer!));
        }

        // Stop window's animation frame and trigger sessions animation frame
        if (window.cancelAnimationFrame) { window.cancelAnimationFrame(engine._frameHandler); }
        engine._renderLoop();
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
     * Stops the xrSession and restores the renderloop
     * @returns Promise which resolves after it exits XR
     */
    public exitXRAsync() {
        if (this.session && !this._sessionEnded) {
            return this.session.end().catch((e) => {
                Logger.Warn("could not end XR session. It has ended already.");
            });
        }
        return Promise.resolve();
    }

    /**
     * Checks if a session would be supported for the creation options specified
     * @param sessionMode session mode to check if supported eg. immersive-vr
     * @returns true if supported
     */
    public isSessionSupportedAsync(sessionMode: XRSessionMode) {
        return WebXRSessionManager.IsSessionSupportedAsync(sessionMode);
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
        }
        else {
            options = options || {};
            options.canvasElement = engine.getRenderingCanvas() || undefined;
            return new WebXRManagedOutputCanvas(this, options);
        }
    }

    /**
     * @hidden
     * Converts the render layer of xrSession to a render target
     * @param session session to create render target for
     * @param scene scene the new render target should be created for
     * @param baseLayer the webgl layer to create the render target for
     */
    public static _CreateRenderTargetTextureFromSession(_session: XRSession, scene: Scene, baseLayer: XRWebGLLayer) {
        if (!baseLayer) {
            throw "no layer";
        }
        // Create internal texture
        var internalTexture = new InternalTexture(scene.getEngine(), InternalTextureSource.Unknown, true);
        internalTexture.width = baseLayer.framebufferWidth;
        internalTexture.height = baseLayer.framebufferHeight;
        internalTexture._framebuffer = baseLayer.framebuffer;

        // Create render target texture from the internal texture
        var renderTargetTexture = new RenderTargetTexture("XR renderTargetTexture", { width: internalTexture.width, height: internalTexture.height }, scene, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
        renderTargetTexture._texture = internalTexture;

        return renderTargetTexture;
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
            return functionToUse.call((navigator as any).xr, sessionMode).then(() => {
                return Promise.resolve(true);
            }).catch((e: any) => {
                Logger.Warn(e);
                return Promise.resolve(false);
            });
        }
    }
}