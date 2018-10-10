module BABYLON {
    /**
     * WebXR Camera which holds the views for the xrSession
     * @see https://doc.babylonjs.com/how_to/webxr
     */
    export class WebXRCamera extends FreeCamera {
        private static _TmpMatrix = new BABYLON.Matrix();

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
            this.rigCameras[0].outputRenderTarget = null;
            this.rigCameras[1].viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);
            this.rigCameras[1].position.x = pupilDistance / 2;
            this.rigCameras[1].outputRenderTarget = null;
        }

        /**
         * Updates the cameras position from the current pose information of the  XR session
         * @param xrSessionManager the session containing pose information
         * @returns true if the camera has been updated, false if the session did not contain pose or frame data
         */
        public updateFromXRSessionManager(xrSessionManager: WebXRSessionManager) {
            // Ensure all frame data is available
            if (!xrSessionManager._currentXRFrame || !xrSessionManager._currentXRFrame.getDevicePose) {
                return false;
            }
            var pose = xrSessionManager._currentXRFrame.getDevicePose(xrSessionManager._frameOfReference);
            if (!pose || !pose.poseModelMatrix) {
                return false;
            }

            // Update the parent cameras matrix
            BABYLON.Matrix.FromFloat32ArrayToRefScaled(pose.poseModelMatrix, 0, 1, WebXRCamera._TmpMatrix);
            if (!this._scene.useRightHandedSystem) {
                WebXRCamera._TmpMatrix.toggleModelMatrixHandInPlace();
            }
            WebXRCamera._TmpMatrix.getTranslationToRef(this.position);
            WebXRCamera._TmpMatrix.getRotationMatrixToRef(WebXRCamera._TmpMatrix);
            BABYLON.Quaternion.FromRotationMatrixToRef(WebXRCamera._TmpMatrix, this.rotationQuaternion);
            this.computeWorldMatrix();

            // Update camera rigs
            this._updateNumberOfRigCameras(xrSessionManager._currentXRFrame.views.length);
            xrSessionManager._currentXRFrame.views.forEach((view, i) => {
                // Update view/projection matrix
                BABYLON.Matrix.FromFloat32ArrayToRefScaled(pose.getViewMatrix(view), 0, 1, this.rigCameras[i]._computedViewMatrix);
                BABYLON.Matrix.FromFloat32ArrayToRefScaled(view.projectionMatrix, 0, 1, this.rigCameras[i]._projectionMatrix);
                if (!this._scene.useRightHandedSystem) {
                    this.rigCameras[i]._computedViewMatrix.toggleModelMatrixHandInPlace();
                    this.rigCameras[i]._projectionMatrix.toggleProjectionMatrixHandInPlace();
                }

                // Update viewport
                var viewport  = xrSessionManager._xrSession.baseLayer.getViewport(view);
                var width = xrSessionManager._xrSession.baseLayer.framebufferWidth;
                var height = xrSessionManager._xrSession.baseLayer.framebufferHeight;
                this.rigCameras[i].viewport.width = viewport.width / width;
                this.rigCameras[i].viewport.height = viewport.height / height;
                this.rigCameras[i].viewport.x = viewport.x / width;
                this.rigCameras[i].viewport.y = viewport.y / height;

                // Set cameras to render to the session's render target
                this.rigCameras[i].outputRenderTarget = xrSessionManager._sessionRenderTargetTexture;
            });
            return true;
        }
    }
}