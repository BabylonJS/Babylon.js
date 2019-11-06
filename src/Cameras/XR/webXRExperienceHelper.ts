import { Nullable } from "../../types";
import { Observable } from "../../Misc/observable";
import { IDisposable, Scene } from "../../scene";
import { Quaternion, Vector3 } from "../../Maths/math.vector";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Camera } from "../../Cameras/camera";
import { WebXRSessionManager } from "./webXRSessionManager";
import { WebXRCamera } from "./webXRCamera";
import { WebXRState, WebXRRenderTarget } from './webXRTypes';

/**
 * Base set of functionality needed to create an XR experince (WebXRSessionManager, Camera, StateManagement, etc.)
 * @see https://doc.babylonjs.com/how_to/webxr
 */
export class WebXRExperienceHelper implements IDisposable {
    /**
     * Container which stores the xr camera and controllers as children. This can be used to move the camera/user as the camera's position is updated by the xr device
     */
    public container: AbstractMesh;
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

    private static _TmpVector = new Vector3();

    /**
     * Fires when the state of the experience helper has changed
     */
    public onStateChangedObservable = new Observable<WebXRState>();

    /** Session manager used to keep track of xr session */
    public sessionManager: WebXRSessionManager;

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
        this.camera = new WebXRCamera("", scene);
        this.sessionManager = new WebXRSessionManager(scene);
        this.container = new AbstractMesh("WebXR Container", scene);
        this.camera.parent = this.container;

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
    public enterXRAsync(sessionMode: XRSessionMode, referenceSpaceType: XRReferenceSpaceType, renderTarget: WebXRRenderTarget) {
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
            this.scene.activeCamera = this.camera;

            this.sessionManager.onXRFrameObservable.add(() => {
                this.camera.updateFromXRSessionManager(this.sessionManager);
            });

            this.sessionManager.onXRSessionEnded.addOnce(() => {
                // Reset camera rigs output render target to ensure sessions render target is not drawn after it ends
                this.camera.rigCameras.forEach((c) => {
                    c.outputRenderTarget = null;
                });

                // Restore scene settings
                this.scene.autoClear = this._originalSceneAutoClear;
                this.scene.activeCamera = this._nonVRCamera;

                this._setState(WebXRState.NOT_IN_XR);
            });

            // Wait until the first frame arrives before setting state to in xr
            this.sessionManager.onXRFrameObservable.addOnce(() => {
                this._setState(WebXRState.IN_XR);
            });
        }).catch((e: any) => {
            console.log(e);
            console.log(e.message);
        });
    }

    /**
     * Updates the global position of the camera by moving the camera's container
     * This should be used instead of modifying the camera's position as it will be overwritten by an xrSessions's update frame
     * @param position The desired global position of the camera
     */
    public setPositionOfCameraUsingContainer(position: Vector3) {
        this.camera.globalPosition.subtractToRef(position, WebXRExperienceHelper._TmpVector);
        this.container.position.subtractInPlace(WebXRExperienceHelper._TmpVector);
    }

    /**
     * Rotates the xr camera by rotating the camera's container around the camera's position
     * This should be used instead of modifying the camera's rotation as it will be overwritten by an xrSessions's update frame
     * @param rotation the desired quaternion rotation to apply to the camera
     */
    public rotateCameraByQuaternionUsingContainer(rotation: Quaternion) {
        if (!this.container.rotationQuaternion) {
            this.container.rotationQuaternion = Quaternion.FromEulerVector(this.container.rotation);
        }
        this.container.rotationQuaternion.multiplyInPlace(rotation);
        this.container.position.rotateByQuaternionAroundPointToRef(rotation, this.camera.globalPosition, this.container.position);
    }

    /**
     * Disposes of the experience helper
     */
    public dispose() {
        this.camera.dispose();
        this.container.dispose();
        this.onStateChangedObservable.clear();
        this.sessionManager.dispose();
    }
}