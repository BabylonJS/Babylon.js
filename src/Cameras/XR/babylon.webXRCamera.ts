module BABYLON {
    /**
     * WebXR Camera which holds the views for the xrSession
     * @see https://immersive-web.github.io/webxr/
     */
    export class WebXRCamera extends FreeCamera {
        /**
         * Creates a new webXRCamera, this should only be set at the camera after it has been updated by the xrSessionManager
         * @param name the name of the camera
         * @param scene the scene to add the camera to
         */
        constructor(name: string, scene: BABYLON.Scene) {
            super(name, BABYLON.Vector3.Zero(), scene);

            // Initial camera configuration
            this.minZ = 0;
            this.rotationQuaternion = new BABYLON.Quaternion();
            this.cameraRigMode = BABYLON.Camera.RIG_MODE_CUSTOM;
            this._updateNumberOfRigCameras(1);
        }

        private _updateNumberOfRigCameras(viewCount = 1) {
            while (this.rigCameras.length < viewCount) {
                var newCamera = new BABYLON.TargetCamera("view: " + this.rigCameras.length, BABYLON.Vector3.Zero(), this.getScene());
                newCamera.minZ = 0;
                newCamera.parent = this;
                this.rigCameras.push(newCamera);
            }
            while (this.rigCameras.length > viewCount) {
                var removedCamera = this.rigCameras.pop();
                if (removedCamera) {
                    removedCamera.dispose();
                }
            }
        }

        /** @hidden */
        public _updateForDualEyeDebugging(pupilDistance = 0.01) {
            // Create initial camera rigs
            this._updateNumberOfRigCameras(2);
            this.rigCameras[0].viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);
            this.rigCameras[0].position.x = -pupilDistance / 2;
            this.rigCameras[0].customDefaultRenderTarget = null;
            this.rigCameras[1].viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);
            this.rigCameras[1].position.x = pupilDistance / 2;
            this.rigCameras[1].customDefaultRenderTarget = null;
        }
    }
}