module BABYLON {
    /**
     * States of the webXR experience
     */
    export enum WebXRState {
        /**
         * Transitioning to being in XR mode
         */
        ENTERING_XR,
        /**
         * Transitioning to non XR mode
         */
        EXITING_XR,
        /**
         * In XR mode and presenting
         */
        IN_XR,
        /**
         * Not entered XR mode
         */
        NOT_IN_XR
    }
    /**
     * Helper class used to enable XR
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

        /**
         * Fires when the state of the experience helper has changed
         */
        public onStateChangedObservable = new Observable<WebXRState>();

        /** @hidden */
        public _sessionManager: WebXRSessionManager;

        private _nonVRCamera: Nullable<Camera> = null;
        private _originalSceneAutoClear = true;

        private _supported = false;

        /**
         * Creates the experience helper
         * @param scene the scene to attach the experience helper to
         * @returns a promise for the experience helper
         */
        public static CreateAsync(scene: BABYLON.Scene): Promise<WebXRExperienceHelper> {
            var helper = new WebXRExperienceHelper(scene);
            return helper._sessionManager.initializeAsync().then(() => {
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
        private constructor(private scene: BABYLON.Scene) {
            this.camera = new BABYLON.WebXRCamera("", scene);
            this._sessionManager = new BABYLON.WebXRSessionManager(scene);
            this.container = new AbstractMesh("", scene);
        }

        /**
         * Exits XR mode and returns the scene to its original state
         * @returns promise that resolves after xr mode has exited
         */
        public exitXRAsync() {
            this._setState(WebXRState.EXITING_XR);
            return this._sessionManager.exitXRAsync();
        }

        /**
         * Enters XR mode (This must be done within a user interaction in most browsers eg. button click)
         * @param sessionCreationOptions options for the XR session
         * @param frameOfReference frame of reference of the XR session
         * @returns promise that resolves after xr mode has entered
         */
        public enterXRAsync(sessionCreationOptions: XRSessionCreationOptions, frameOfReference: string) {
            this._setState(WebXRState.ENTERING_XR);

            return this._sessionManager.enterXRAsync(sessionCreationOptions, frameOfReference).then(() => {
                // Cache pre xr scene settings
                this._originalSceneAutoClear = this.scene.autoClear;
                this._nonVRCamera = this.scene.activeCamera;

                // Overwrite current scene settings
                this.scene.autoClear = false;
                this.scene.activeCamera = this.camera;

                this._sessionManager.onXRFrameObservable.add(() => {
                    this.camera.updateFromXRSessionManager(this._sessionManager);
                });

                this._sessionManager.onXRSessionEnded.addOnce(() => {
                    // Reset camera rigs output render target to ensure sessions render target is not drawn after it ends
                    this.camera.rigCameras.forEach((c) => {
                        c.outputRenderTarget = null;
                    });

                    // Restore scene settings
                    this.scene.autoClear = this._originalSceneAutoClear;
                    this.scene.activeCamera = this._nonVRCamera;
                    this._sessionManager.onXRFrameObservable.clear();

                    this._setState(WebXRState.NOT_IN_XR);
                });
                this._setState(WebXRState.IN_XR);
            });
        }

        /**
         * Fires a ray and returns the closest hit in the xr sessions enviornment, useful to place objects in AR
         * @param ray ray to cast into the environment
         * @returns Promise which resolves with a collision point in the environment if it exists
         */
        public environmentPointHitTestAsync(ray: BABYLON.Ray): Promise<Nullable<Vector3>> {
            return this._sessionManager.environmentPointHitTestAsync(ray);
        }

        /**
         * Checks if the creation options are supported by the xr session
         * @param options creation options
         * @returns true if supported
         */
        public supportsSessionAsync(options: XRSessionCreationOptions) {
            if (!this._supported) {
                return Promise.resolve(false);
            }
            return this._sessionManager.supportsSessionAsync(options);
        }

        /**
         * Disposes of the experience helper
         */
        public dispose() {
            this.camera.dispose();
            this.container.dispose();
            this.onStateChangedObservable.clear();
            this._sessionManager.dispose();
        }
    }
}