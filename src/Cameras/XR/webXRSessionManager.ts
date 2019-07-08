import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";
import { Nullable } from "../../types";
import { IDisposable, Scene } from "../../scene";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
/**
 * Manages an XRSession to work with Babylon's engine
 * @see https://doc.babylonjs.com/how_to/webxr
 */
export class WebXRSessionManager implements IDisposable {
    /**
     * Fires every time a new xrFrame arrives which can be used to update the camera
     */
    public onXRFrameObservable: Observable<any> = new Observable<any>();
    /**
     * Fires when the xr session is ended either by the device or manually done
     */
    public onXRSessionEnded: Observable<any> = new Observable<any>();

    /**
     * Underlying xr session
     */
    public session: XRSession;

    /**
     * Type of reference space used when creating the session
     */
    public referenceSpace: XRReferenceSpace;

    /** @hidden */
    public _sessionRenderTargetTexture: Nullable<RenderTargetTexture> = null;

    /**
     * Current XR frame
     */
    public currentFrame: Nullable<XRFrame>;
    private _xrNavigator: any;
    private baseLayer: Nullable<XRWebGLLayer> = null;

    /**
     * Constructs a WebXRSessionManager, this must be initialized within a user action before usage
     * @param scene The scene which the session should be created for
     */
    constructor(private scene: Scene) {

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
            return Promise.reject("webXR not supported by this browser");
        }
        return Promise.resolve();
    }

    /**
     * Initializes an xr session
     * @param xrSessionMode mode to initialize
     * @returns a promise which will resolve once the session has been initialized
     */
    public initializeSessionAsync(xrSessionMode: XRSessionMode) {
        return this._xrNavigator.xr.requestSession(xrSessionMode).then((session: XRSession) => {
            this.session = session;

            // handle when the session is ended (By calling session.end or device ends its own session eg. pressing home button on phone)
            this.session.addEventListener("end", () => {
                // Remove render target texture and notify frame obervers
                this._sessionRenderTargetTexture = null;

                // Restore frame buffer to avoid clear on xr framebuffer after session end
                this.scene.getEngine().restoreDefaultFramebuffer();

                // Need to restart render loop as after the session is ended the last request for new frame will never call callback
                this.scene.getEngine().customAnimationFrameRequester = null;
                this.onXRSessionEnded.notifyObservers(null);
                this.scene.getEngine()._renderLoop();
            }, { once: true });
        });
    }

    /**
     * Sets the reference space on the xr session
     * @param referenceSpace space to set
     * @returns a promise that will resolve once the reference space has been set
     */
    public setReferenceSpaceAsync(referenceSpace: XRReferenceSpaceType) {
        return this.session.requestReferenceSpace(referenceSpace).then((referenceSpace: XRReferenceSpace) => {
            this.referenceSpace = referenceSpace;
        });
    }

    /**
     * Updates the render state of the session
     * @param state state to set
     * @returns a promise that resolves once the render state has been updated
     */
    public updateRenderStateAsync(state: any) {
        if (state.baseLayer) {
            this.baseLayer = state.baseLayer;
        }
        return this.session.updateRenderState(state);
    }

    /**
     * Starts rendering to the xr layer
     * @returns a promise that will resolve once rendering has started
     */
    public startRenderingToXRAsync() {
        // Tell the engine's render loop to be driven by the xr session's refresh rate and provide xr pose information
        this.scene.getEngine().customAnimationFrameRequester = {
            requestAnimationFrame: this.session.requestAnimationFrame.bind(this.session),
            renderFunction: (timestamp: number, xrFrame: Nullable<XRFrame>) => {
                // Store the XR frame in the manager to be consumed by the XR camera to update pose
                this.currentFrame = xrFrame;
                this.onXRFrameObservable.notifyObservers(null);
                this.scene.getEngine()._renderLoop();
            }
        };
        // Create render target texture from xr's webgl render target
        this._sessionRenderTargetTexture = WebXRSessionManager._CreateRenderTargetTextureFromSession(this.session, this.scene, this.baseLayer!);

        // Stop window's animation frame and trigger sessions animation frame
        window.cancelAnimationFrame(this.scene.getEngine()._frameHandler);
        this.scene.getEngine()._renderLoop();
        return Promise.resolve();
    }

    /**
     * Stops the xrSession and restores the renderloop
     * @returns Promise which resolves after it exits XR
     */
    public exitXRAsync() {
        if (this.session) {
            this.session.end();
        }
        return new Promise(() => {});
    }

    /**
     * Checks if a session would be supported for the creation options specified
     * @param sessionMode session mode to check if supported eg. immersive-vr
     * @returns true if supported
     */
    public supportsSessionAsync(sessionMode: XRSessionMode) {
        if (!(navigator as any).xr || !(navigator as any).xr.supportsSession) {
            return Promise.resolve(false);
        }else {
            return (navigator as any).xr.supportsSession(sessionMode).then(() => {
                return Promise.resolve(true);
            }).catch((e: any) => {
                Logger.Warn(e);
                return Promise.resolve(false);
            });
        }
    }

    /**
     * @hidden
     * Converts the render layer of xrSession to a render target
     * @param session session to create render target for
     * @param scene scene the new render target should be created for
     */
    public static _CreateRenderTargetTextureFromSession(session: XRSession, scene: Scene, baseLayer: XRWebGLLayer) {
        if (!baseLayer) {
            throw "no layer";
        }
        // Create internal texture
        var internalTexture = new InternalTexture(scene.getEngine(), InternalTexture.DATASOURCE_UNKNOWN, true);
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
        this.onXRFrameObservable.clear();
        this.onXRSessionEnded.clear();
    }
}