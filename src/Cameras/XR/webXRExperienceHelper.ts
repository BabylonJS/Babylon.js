import { Nullable } from "../../types";
import { Observable } from "../../Misc/observable";
import { IDisposable, Scene } from "../../scene";
import { Quaternion } from "../../Maths/math.vector";
import { Camera } from "../../Cameras/camera";
import { WebXRSessionManager } from "./webXRSessionManager";
import { WebXRCamera } from "./webXRCamera";
import { WebXRState, WebXRRenderTarget } from './webXRTypes';
import { WebXRFeaturesManager } from './webXRFeaturesManager';

/**
 * Base set of functionality needed to create an XR experince (WebXRSessionManager, Camera, StateManagement, etc.)
 * @see https://doc.babylonjs.com/how_to/webxr
 */
export class WebXRExperienceHelper implements IDisposable {
    /**
     * Camera used to render xr content
     */
    public camera: WebXRCamera;

    /**
     * The current state of the XR experience (eg. transitioning, in XR or not in XR)
     */
    public state: WebXRState = WebXRState.NOT_IN_XR;

    private _setState(val: WebXRState) {
        this.state = val;
        this.onStateChangedObservable.notifyObservers(this.state);
    }

    /**
     * Fires when the state of the experience helper has changed
     */
    public onStateChangedObservable = new Observable<WebXRState>();

    /**
     * Observers registered here will be triggered after the camera's initial transformation is set
     * This can be used to set a different ground level or an extra rotation.
     *
     * Note that ground level is considered to be at 0. The height defined by the XR camera will be added
     * to the position set after this observable is done executing.
     */
    public onInitialXRPoseSetObservable = new Observable<WebXRCamera>();

    /** Session manager used to keep track of xr session */
    public sessionManager: WebXRSessionManager;

    /** A features manager for this xr session */
    public featuresManager: WebXRFeaturesManager;

    private _nonVRCamera: Nullable<Camera> = null;
    private _originalSceneAutoClear = true;

    private _supported = false;

    /**
     * Creates the experience helper
     * @param scene the scene to attach the experience helper to
     * @returns a promise for the experience helper
     */
    public static CreateAsync(scene: Scene): Promise<WebXRExperienceHelper> {
        var helper = new WebXRExperienceHelper(scene);
        return helper.sessionManager.initializeAsync().then(() => {
            helper._supported = true;
            return helper;
        }).catch(() => {
            return helper;
        });
    }

    /**
     * Creates a WebXRExperienceHelper
     * @param scene The scene the helper should be created in
     */
    private constructor(private scene: Scene) {
        this.sessionManager = new WebXRSessionManager(scene);
        this.camera = new WebXRCamera("", scene, this.sessionManager);
        this.featuresManager = new WebXRFeaturesManager(this.sessionManager);

        scene.onDisposeObservable.add(() => {
            this.exitXRAsync();
        });
    }

    /**
     * Exits XR mode and returns the scene to its original state
     * @returns promise that resolves after xr mode has exited
     */
    public exitXRAsync() {
        this._setState(WebXRState.EXITING_XR);
        return this.sessionManager.exitXRAsync();
    }

    /**
     * Enters XR mode (This must be done within a user interaction in most browsers eg. button click)
     * @param sessionMode options for the XR session
     * @param referenceSpaceType frame of reference of the XR session
     * @param renderTarget the output canvas that will be used to enter XR mode
     * @returns promise that resolves after xr mode has entered
     */
    public enterXRAsync(sessionMode: XRSessionMode, referenceSpaceType: XRReferenceSpaceType, renderTarget: WebXRRenderTarget): Promise<WebXRSessionManager> {
        if (!this._supported) {
            throw "XR session not supported by this browser";
        }
        this._setState(WebXRState.ENTERING_XR);
        let sessionCreationOptions = {
            optionalFeatures: (referenceSpaceType !== "viewer" && referenceSpaceType !== "local") ? [referenceSpaceType] : []
        };
        return this.sessionManager.initializeSessionAsync(sessionMode, sessionCreationOptions).then(() => {
            return this.sessionManager.setReferenceSpaceAsync(referenceSpaceType);
        }).then(() => {
            return renderTarget.initializeXRLayerAsync(this.sessionManager.session);
        }).then(() => {
            return this.sessionManager.updateRenderStateAsync({ depthFar: this.camera.maxZ, depthNear: this.camera.minZ, baseLayer: renderTarget.xrLayer! });
        }).then(() => {
            return this.sessionManager.startRenderingToXRAsync();
        }).then(() => {
            // Cache pre xr scene settings
            this._originalSceneAutoClear = this.scene.autoClear;
            this._nonVRCamera = this.scene.activeCamera;

            // Overwrite current scene settings
            this.scene.autoClear = false;

            this._nonXRToXRCamera();

            this.sessionManager.onXRSessionEnded.addOnce(() => {
                // Reset camera rigs output render target to ensure sessions render target is not drawn after it ends
                this.camera.rigCameras.forEach((c) => {
                    c.outputRenderTarget = null;
                });

                // Restore scene settings
                this.scene.autoClear = this._originalSceneAutoClear;
                this.scene.activeCamera = this._nonVRCamera;
                if ((<any>this._nonVRCamera).setPosition) {
                    (<any>this._nonVRCamera).setPosition(this.camera.position);
                } else {
                    this._nonVRCamera!.position.copyFrom(this.camera.position);
                }

                this._setState(WebXRState.NOT_IN_XR);
            });

            // Wait until the first frame arrives before setting state to in xr
            this.sessionManager.onXRFrameObservable.addOnce(() => {
                this._setState(WebXRState.IN_XR);
            });

            return this.sessionManager;
        }).catch((e: any) => {
            console.log(e);
            console.log(e.message);
            throw (e);
        });
    }

    /**
     * Disposes of the experience helper
     */
    public dispose() {
        this.camera.dispose();
        this.onStateChangedObservable.clear();
        this.sessionManager.dispose();
    }

    private _nonXRToXRCamera() {
        this.scene.activeCamera = this.camera;
        const mat = this._nonVRCamera!.computeWorldMatrix();
        mat.decompose(undefined, this.camera.rotationQuaternion, this.camera.position);
        // set the ground level
        this.camera.position.y = 0;
        Quaternion.FromEulerAnglesToRef(0, this.camera.rotationQuaternion.toEulerAngles().y, 0, this.camera.rotationQuaternion);

        this.onInitialXRPoseSetObservable.notifyObservers(this.camera);
    }
}
