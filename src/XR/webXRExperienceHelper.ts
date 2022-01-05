import { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { IDisposable, Scene } from "../scene";
import { Camera } from "../Cameras/camera";
import { WebXRSessionManager } from "./webXRSessionManager";
import { WebXRCamera } from "./webXRCamera";
import { WebXRState, WebXRRenderTarget } from "./webXRTypes";
import { WebXRFeatureName, WebXRFeaturesManager } from "./webXRFeaturesManager";
import { Logger } from "../Misc/logger";
import { UniversalCamera } from "../Cameras/universalCamera";
import { Quaternion, Vector3 } from "../Maths/math.vector";

/**
 * Base set of functionality needed to create an XR experience (WebXRSessionManager, Camera, StateManagement, etc.)
 * @see https://doc.babylonjs.com/how_to/webxr_experience_helpers
 */
export class WebXRExperienceHelper implements IDisposable {
    private _nonVRCamera: Nullable<Camera> = null;
    private _attachedToElement: boolean = false;
    private _spectatorCamera: Nullable<UniversalCamera> = null;
    private _originalSceneAutoClear = true;
    private _supported = false;
    private _spectatorMode = false;

    /**
     * Camera used to render xr content
     */
    public camera: WebXRCamera;
    /** A features manager for this xr session */
    public featuresManager: WebXRFeaturesManager;
    /**
     * Observers registered here will be triggered after the camera's initial transformation is set
     * This can be used to set a different ground level or an extra rotation.
     *
     * Note that ground level is considered to be at 0. The height defined by the XR camera will be added
     * to the position set after this observable is done executing.
     */
    public onInitialXRPoseSetObservable = new Observable<WebXRCamera>();
    /**
     * Fires when the state of the experience helper has changed
     */
    public onStateChangedObservable = new Observable<WebXRState>();
    /** Session manager used to keep track of xr session */
    public sessionManager: WebXRSessionManager;
    /**
     * The current state of the XR experience (eg. transitioning, in XR or not in XR)
     */
    public state: WebXRState = WebXRState.NOT_IN_XR;

    /**
     * Creates a WebXRExperienceHelper
     * @param scene The scene the helper should be created in
     */
    private constructor(private scene: Scene) {
        this.sessionManager = new WebXRSessionManager(scene);
        this.camera = new WebXRCamera("webxr", scene, this.sessionManager);
        this.featuresManager = new WebXRFeaturesManager(this.sessionManager);

        scene.onDisposeObservable.add(() => {
            this.exitXRAsync();
        });
    }

    /**
     * Creates the experience helper
     * @param scene the scene to attach the experience helper to
     * @returns a promise for the experience helper
     */
    public static CreateAsync(scene: Scene): Promise<WebXRExperienceHelper> {
        var helper = new WebXRExperienceHelper(scene);
        return helper.sessionManager
            .initializeAsync()
            .then(() => {
                helper._supported = true;
                return helper;
            })
            .catch((e) => {
                helper._setState(WebXRState.NOT_IN_XR);
                helper.dispose();
                throw e;
            });
    }

    /**
     * Disposes of the experience helper
     */
    public dispose() {
        this.camera.dispose();
        this.onStateChangedObservable.clear();
        this.onInitialXRPoseSetObservable.clear();
        this.sessionManager.dispose();
        this._spectatorCamera?.dispose();
        if (this._nonVRCamera) {
            this.scene.activeCamera = this._nonVRCamera;
        }
    }

    /**
     * Enters XR mode (This must be done within a user interaction in most browsers eg. button click)
     * @param sessionMode options for the XR session
     * @param referenceSpaceType frame of reference of the XR session
     * @param renderTarget the output canvas that will be used to enter XR mode
     * @param sessionCreationOptions optional XRSessionInit object to init the session with
     * @returns promise that resolves after xr mode has entered
     */
    public async enterXRAsync(sessionMode: XRSessionMode, referenceSpaceType: XRReferenceSpaceType, renderTarget: WebXRRenderTarget = this.sessionManager.getWebXRRenderTarget(), sessionCreationOptions: XRSessionInit = {}): Promise<WebXRSessionManager> {
        if (!this._supported) {
            throw "WebXR not supported in this browser or environment";
        }
        this._setState(WebXRState.ENTERING_XR);
        if (referenceSpaceType !== "viewer" && referenceSpaceType !== "local") {
            sessionCreationOptions.optionalFeatures = sessionCreationOptions.optionalFeatures || [];
            sessionCreationOptions.optionalFeatures.push(referenceSpaceType);
        }
        sessionCreationOptions = await this.featuresManager._extendXRSessionInitObject(sessionCreationOptions);
        // we currently recommend "unbounded" space in AR (#7959)
        if (sessionMode === "immersive-ar" && referenceSpaceType !== "unbounded") {
            Logger.Warn("We recommend using 'unbounded' reference space type when using 'immersive-ar' session mode");
        }
        // make sure that the session mode is supported
        try {
            await this.sessionManager.initializeSessionAsync(sessionMode, sessionCreationOptions);
            await this.sessionManager.setReferenceSpaceTypeAsync(referenceSpaceType);
            const baseLayer = await renderTarget.initializeXRLayerAsync(this.sessionManager.session);

            const xrRenderState: XRRenderStateInit = {
                depthFar: this.camera.maxZ,
                depthNear: this.camera.minZ,
            };

            // The layers feature will have already initialized the xr session's layers on session init.
            if (!this.featuresManager.getEnabledFeature(WebXRFeatureName.LAYERS)) {
                xrRenderState.baseLayer = baseLayer;
            }

            this.sessionManager.updateRenderState(xrRenderState);
            // run the render loop
            this.sessionManager.runXRRenderLoop();
            // Cache pre xr scene settings
            this._originalSceneAutoClear = this.scene.autoClear;
            this._nonVRCamera = this.scene.activeCamera;
            this._attachedToElement = !!(this._nonVRCamera?.inputs.attachedToElement);
            this._nonVRCamera?.detachControl();

            this.scene.activeCamera = this.camera;
            // do not compensate when AR session is used
            if (sessionMode !== "immersive-ar") {
                this._nonXRToXRCamera();
            } else {
                // Kept here, TODO - check if needed
                this.scene.autoClear = false;
                this.camera.compensateOnFirstFrame = false;
            }

            this.sessionManager.onXRSessionEnded.addOnce(() => {
                // Reset camera rigs output render target to ensure sessions render target is not drawn after it ends
                this.camera.rigCameras.forEach((c) => {
                    c.outputRenderTarget = null;
                });

                // Restore scene settings
                this.scene.autoClear = this._originalSceneAutoClear;
                this.scene.activeCamera = this._nonVRCamera;
                if (this._attachedToElement && this._nonVRCamera) {
                    this._nonVRCamera.attachControl(!!(this._nonVRCamera.inputs.noPreventDefault));
                }
                if (sessionMode !== "immersive-ar" && this.camera.compensateOnFirstFrame) {
                    if ((<any>this._nonVRCamera).setPosition) {
                        (<any>this._nonVRCamera).setPosition(this.camera.position);
                    } else {
                        this._nonVRCamera!.position.copyFrom(this.camera.position);
                    }
                }

                this._setState(WebXRState.NOT_IN_XR);
            });

            // Wait until the first frame arrives before setting state to in xr
            this.sessionManager.onXRFrameObservable.addOnce(() => {
                this._setState(WebXRState.IN_XR);
            });
            return this.sessionManager;
        } catch (e) {
            console.log(e);
            console.log(e.message);
            this._setState(WebXRState.NOT_IN_XR);
            throw e;
        }
    }

    /**
     * Exits XR mode and returns the scene to its original state
     * @returns promise that resolves after xr mode has exited
     */
    public exitXRAsync() {
        // only exit if state is IN_XR
        if (this.state !== WebXRState.IN_XR) {
            return Promise.resolve();
        }
        this._setState(WebXRState.EXITING_XR);
        return this.sessionManager.exitXRAsync();
    }

    /**
     * Enable spectator mode for desktop VR experiences.
     * When spectator mode is enabled a camera will be attached to the desktop canvas and will
     * display the first rig camera's view on the desktop canvas.
     * Please note that this will degrade performance, as it requires another camera render.
     * It is also not recommended to enable this in devices like the quest, as it brings no benefit there.
     */
    public enableSpectatorMode(): void {
        if (!this._spectatorMode) {
            const updateSpectatorCamera = () => {
                if (this._spectatorCamera) {
                    this._spectatorCamera.position.copyFrom(this.camera.rigCameras[0].globalPosition);
                    this._spectatorCamera.rotationQuaternion.copyFrom(this.camera.rigCameras[0].absoluteRotation);
                }
            };
            const onStateChanged = () => {
                if (this.state === WebXRState.IN_XR) {
                    this._spectatorCamera = new UniversalCamera('webxr-spectator', Vector3.Zero(), this.scene);
                    this._spectatorCamera.rotationQuaternion = new Quaternion();
                    this.scene.activeCameras = [this.camera, this._spectatorCamera];
                    this.sessionManager.onXRFrameObservable.add(updateSpectatorCamera);
                    this.scene.onAfterRenderCameraObservable.add((camera) => {
                        if (camera === this.camera) {
                            // reset the dimensions object for correct resizing
                            this.scene.getEngine().framebufferDimensionsObject = null;
                        }
                    });
                } else if (this.state === WebXRState.EXITING_XR) {
                    this.sessionManager.onXRFrameObservable.removeCallback(updateSpectatorCamera);
                    this.scene.activeCameras = null;
                }
            };
            this._spectatorMode = true;
            this.onStateChangedObservable.add(onStateChanged);
            onStateChanged();
        }
    }

    private _nonXRToXRCamera() {
        this.camera.setTransformationFromNonVRCamera(this._nonVRCamera!);
        this.onInitialXRPoseSetObservable.notifyObservers(this.camera);
    }

    private _setState(val: WebXRState) {
        if (this.state === val) {
            return;
        }
        this.state = val;
        this.onStateChangedObservable.notifyObservers(this.state);
    }
}
