import type { Nullable } from "../types";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { IDisposable } from "../scene";
import type { IWebXRControllerOptions } from "./webXRInputSource";
import { WebXRInputSource } from "./webXRInputSource";
import type { WebXRSessionManager } from "./webXRSessionManager";
import type { WebXRCamera } from "./webXRCamera";
import { WebXRMotionControllerManager } from "./motionController/webXRMotionControllerManager";

/**
 * The schema for initialization options of the XR Input class
 */
export interface IWebXRInputOptions {
    /**
     * If set to true no model will be automatically loaded
     */
    doNotLoadControllerMeshes?: boolean;

    /**
     * If set, this profile will be used for all controllers loaded (for example "microsoft-mixed-reality")
     * If not found, the xr input profile data will be used.
     * Profiles are defined here - https://github.com/immersive-web/webxr-input-profiles/
     */
    forceInputProfile?: string;

    /**
     * Do not send a request to the controller repository to load the profile.
     *
     * Instead, use the controllers available in babylon itself.
     */
    disableOnlineControllerRepository?: boolean;

    /**
     * A custom URL for the controllers repository
     */
    customControllersRepositoryURL?: string;

    /**
     * Should the controller model's components not move according to the user input
     */
    disableControllerAnimation?: boolean;

    /**
     * Optional options to pass to the controller. Will be overridden by the Input options where applicable
     */
    controllerOptions?: IWebXRControllerOptions;
}
/**
 * XR input used to track XR inputs such as controllers/rays
 */
export class WebXRInput implements IDisposable {
    /**
     * XR controllers being tracked
     */
    public controllers: Array<WebXRInputSource> = [];
    private _frameObserver: Nullable<Observer<any>>;
    private _sessionEndedObserver: Nullable<Observer<any>>;
    private _sessionInitObserver: Nullable<Observer<any>>;
    /**
     * Event when a controller has been connected/added
     */
    public onControllerAddedObservable = new Observable<WebXRInputSource>();
    /**
     * Event when a controller has been removed/disconnected
     */
    public onControllerRemovedObservable = new Observable<WebXRInputSource>();

    /**
     * Initializes the WebXRInput
     * @param xrSessionManager the xr session manager for this session
     * @param xrCamera the WebXR camera for this session. Mainly used for teleportation
     * @param _options = initialization options for this xr input
     */
    public constructor(
        /**
         * the xr session manager for this session
         */
        public xrSessionManager: WebXRSessionManager,
        /**
         * the WebXR camera for this session. Mainly used for teleportation
         */
        public xrCamera: WebXRCamera,
        private readonly _options: IWebXRInputOptions = {}
    ) {
        // Remove controllers when exiting XR
        this._sessionEndedObserver = this.xrSessionManager.onXRSessionEnded.add(() => {
            this._addAndRemoveControllers(
                [],
                this.controllers.map((c) => {
                    return c.inputSource;
                })
            );
        });

        this._sessionInitObserver = this.xrSessionManager.onXRSessionInit.add((session) => {
            session.addEventListener("inputsourceschange", this._onInputSourcesChange);
        });

        this._frameObserver = this.xrSessionManager.onXRFrameObservable.add((frame) => {
            // Update controller pose info
            for (const controller of this.controllers) {
                controller.updateFromXRFrame(frame, this.xrSessionManager.referenceSpace, this.xrCamera, this.xrSessionManager);
            }
        });

        if (this._options.customControllersRepositoryURL) {
            WebXRMotionControllerManager.BaseRepositoryUrl = this._options.customControllersRepositoryURL;
        }

        WebXRMotionControllerManager.UseOnlineRepository = !this._options.disableOnlineControllerRepository;
        if (WebXRMotionControllerManager.UseOnlineRepository) {
            // pre-load the profiles list to load the controllers quicker afterwards
            try {
                WebXRMotionControllerManager.UpdateProfilesList().catch(() => {
                    WebXRMotionControllerManager.UseOnlineRepository = false;
                });
            } catch (e) {
                WebXRMotionControllerManager.UseOnlineRepository = false;
            }
        }
    }

    private _onInputSourcesChange = (event: XRInputSourceChangeEvent) => {
        this._addAndRemoveControllers(event.added, event.removed);
    };

    private _addAndRemoveControllers(addInputs: readonly XRInputSource[], removeInputs: readonly XRInputSource[]) {
        // Add controllers if they don't already exist
        const sources = this.controllers.map((c) => {
            return c.inputSource;
        });
        for (const input of addInputs) {
            if (sources.indexOf(input) === -1) {
                const controller = new WebXRInputSource(this.xrSessionManager.scene, input, {
                    ...(this._options.controllerOptions || {}),
                    forceControllerProfile: this._options.forceInputProfile,
                    doNotLoadControllerMesh: this._options.doNotLoadControllerMeshes,
                    disableMotionControllerAnimation: this._options.disableControllerAnimation,
                });
                this.controllers.push(controller);
                this.onControllerAddedObservable.notifyObservers(controller);
            }
        }

        // Remove and dispose of controllers to be disposed
        const keepControllers: Array<WebXRInputSource> = [];
        const removedControllers: Array<WebXRInputSource> = [];
        for (const c of this.controllers) {
            if (removeInputs.indexOf(c.inputSource) === -1) {
                keepControllers.push(c);
            } else {
                removedControllers.push(c);
            }
        }
        this.controllers = keepControllers;
        for (const c of removedControllers) {
            this.onControllerRemovedObservable.notifyObservers(c);
            c.dispose();
        }
    }

    /**
     * Disposes of the object
     */
    public dispose() {
        for (const c of this.controllers) {
            c.dispose();
        }
        this.xrSessionManager.onXRFrameObservable.remove(this._frameObserver);
        this.xrSessionManager.onXRSessionInit.remove(this._sessionInitObserver);
        this.xrSessionManager.onXRSessionEnded.remove(this._sessionEndedObserver);
        this.onControllerAddedObservable.clear();
        this.onControllerRemovedObservable.clear();

        // clear the controller cache
        WebXRMotionControllerManager.ClearControllerCache();
    }
}
