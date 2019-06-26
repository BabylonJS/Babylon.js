import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";
import { Nullable } from "../../types";
import { IDisposable, Scene } from "../../scene";
import { Vector3, Matrix } from "../../Maths/math";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { Ray } from "../../Culling/ray";
/**
 * Manages an XRSession
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

    /** @hidden */
    public _xrSession: XRSession;
    /** @hidden */
    public _frameOfReference: XRFrameOfReference;
    /** @hidden */
    public _sessionRenderTargetTexture: Nullable<RenderTargetTexture> = null;
    /** @hidden */
    public _currentXRFrame: Nullable<XRFrame>;
    private _xrNavigator: any;
    private _tmpMatrix = new Matrix();
    private baseLayer:Nullable<XRWebGLLayer> = null;

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

    public initializeSessionAsync(sessionCreationOptions: XRSessionCreationOptions){
        return this._xrNavigator.xr.requestSession(sessionCreationOptions.mode).then((session: XRSession) => {
            this._xrSession = session;

            // handle when the session is ended (By calling session.end or device ends its own session eg. pressing home button on phone)
            this._xrSession.addEventListener("end", () => {
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

    public setReferenceSpaceAsync(referenceSpaceOptions: ReferenceSpaceOptions){
        return this._xrSession.requestReferenceSpace(referenceSpaceOptions).then((referenceSpace: any)=>{
            this._frameOfReference = referenceSpace;
        })
    }

    public updateRenderStateAsync(state:any){
        if(state.baseLayer){
            this.baseLayer = state.baseLayer;
        }
        return this._xrSession.updateRenderState(state);
    }

    public startRenderingToXRAsync(){
        // Tell the engine's render loop to be driven by the xr session's refresh rate and provide xr pose information
        this.scene.getEngine().customAnimationFrameRequester = {
            requestAnimationFrame: this._xrSession.requestAnimationFrame.bind(this._xrSession),
            renderFunction: (timestamp: number, xrFrame: Nullable<XRFrame>) => {
                // Store the XR frame in the manager to be consumed by the XR camera to update pose
                this._currentXRFrame = xrFrame;
                this.onXRFrameObservable.notifyObservers(null);
                this.scene.getEngine()._renderLoop();
            }
        };
        // Create render target texture from xr's webgl render target
        this._sessionRenderTargetTexture = WebXRSessionManager._CreateRenderTargetTextureFromSession(this._xrSession, this.scene, this.baseLayer!);

        // Stop window's animation frame and trigger sessions animation frame
        window.cancelAnimationFrame(this.scene.getEngine()._frameHandler);
        debugger;
        this.scene.getEngine()._renderLoop();
        return Promise.resolve();
    }

    /**
     * Stops the xrSession and restores the renderloop
     * @returns Promise which resolves after it exits XR
     */
    public exitXRAsync() {
        return this._xrSession.end();
    }

    /**
     * Fires a ray and returns the closest hit in the xr sessions enviornment, useful to place objects in AR
     * @param ray ray to cast into the environment
     * @returns Promise which resolves with a collision point in the environment if it exists
     */
    public environmentPointHitTestAsync(ray: Ray): Promise<Nullable<Vector3>> {
        return new Promise((res) => {
            // Compute left handed inputs to request hit test
            var origin = new Float32Array([ray.origin.x, ray.origin.y, ray.origin.z]);
            var direction = new Float32Array([ray.direction.x, ray.direction.y, ray.direction.z]);
            if (!this.scene.useRightHandedSystem) {
                origin[2] *= -1;
                direction[2] *= -1;
            }

            // Fire hittest
            this._xrSession.requestHitTest(origin, direction, this._frameOfReference)
                .then((hits: any) => {
                    if (hits.length > 0) {
                        Matrix.FromFloat32ArrayToRefScaled(hits[0].hitMatrix, 0, 1.0, this._tmpMatrix);
                        var hitPoint = this._tmpMatrix.getTranslation();
                        if (!this.scene.useRightHandedSystem) {
                            hitPoint.z *= -1;
                        }
                        res(hitPoint);
                    } else {
                        res(null);
                    }
                }).catch(() => {
                    res(null);
                });
        });
    }

    /**
     * Checks if a session would be supported for the creation options specified
     * @param sessionMode session mode to check if supported eg. immersive-vr
     * @returns true if supported
     */
    public supportsSessionModeAsync(sessionMode: string) {
        if(!(navigator as any).xr || !(navigator as any).xr.supportsSession){
            return Promise.resolve(false);
        }else{
            return (navigator as any).xr.supportsSession(sessionMode).then(()=>{
                return Promise.resolve(true)
            }).catch((e:any)=>{
                Logger.Warn(e)
                return Promise.resolve(false);
            })
        }
    }

    /**
     * @hidden
     * Converts the render layer of xrSession to a render target
     * @param session session to create render target for
     * @param scene scene the new render target should be created for
     */
    public static _CreateRenderTargetTextureFromSession(session: XRSession, scene: Scene, baseLayer: XRWebGLLayer) {
        console.log("creating render target")
        if(!baseLayer){
            throw "no layer"
        }
        //debugger;
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