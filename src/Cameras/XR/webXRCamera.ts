import { Vector3, Matrix, Quaternion } from "../../Maths/math.vector";
import { Scene } from "../../scene";
import { Camera } from "../../Cameras/camera";
import { FreeCamera } from "../../Cameras/freeCamera";
import { TargetCamera } from "../../Cameras/targetCamera";
import { WebXRSessionManager } from "./webXRSessionManager";
import { Viewport } from '../../Maths/math.viewport';

/**
 * WebXR Camera which holds the views for the xrSession
 * @see https://doc.babylonjs.com/how_to/webxr
 */
export class WebXRCamera extends FreeCamera {
    private static _TmpMatrix = new Matrix();

    /**
     * Creates a new webXRCamera, this should only be set at the camera after it has been updated by the xrSessionManager
     * @param name the name of the camera
     * @param scene the scene to add the camera to
     */
    constructor(name: string, scene: Scene) {
        super(name, Vector3.Zero(), scene);

        // Initial camera configuration
        this.minZ = 0.1;
        this.rotationQuaternion = new Quaternion();
        this.cameraRigMode = Camera.RIG_MODE_CUSTOM;
        this.updateUpVectorFromRotation = true;
        this._updateNumberOfRigCameras(1);
    }

    private _updateNumberOfRigCameras(viewCount = 1) {
        while (this.rigCameras.length < viewCount) {
            var newCamera = new TargetCamera("view: " + this.rigCameras.length, Vector3.Zero(), this.getScene());
            newCamera.minZ = 0.1;
            newCamera.parent = this;
            newCamera.rotationQuaternion = new Quaternion();
            newCamera.updateUpVectorFromRotation = true;
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
        this.rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
        this.rigCameras[0].position.x = -pupilDistance / 2;
        this.rigCameras[0].outputRenderTarget = null;
        this.rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
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
        if (!xrSessionManager.currentFrame || !xrSessionManager.currentFrame.getViewerPose) {
            return false;
        }
        var pose = xrSessionManager.currentFrame.getViewerPose(xrSessionManager.referenceSpace);
        if (!pose || !pose.transform || !pose.transform.matrix) {
            return false;
        }

        // Update the parent cameras matrix
        Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, WebXRCamera._TmpMatrix);
        if (!this._scene.useRightHandedSystem) {
            WebXRCamera._TmpMatrix.toggleModelMatrixHandInPlace();
        }
        WebXRCamera._TmpMatrix.getTranslationToRef(this.position);
        WebXRCamera._TmpMatrix.getRotationMatrixToRef(WebXRCamera._TmpMatrix);
        Quaternion.FromRotationMatrixToRef(WebXRCamera._TmpMatrix, this.rotationQuaternion);
        this.computeWorldMatrix();

        // Update camera rigs
        this._updateNumberOfRigCameras(pose.views.length);
        pose.views.forEach((view: any, i: number) => {
            // Update view/projection matrix
            Matrix.FromFloat32ArrayToRefScaled(view.transform.matrix, 0, 1, this.rigCameras[i]._computedViewMatrix);
            Matrix.FromFloat32ArrayToRefScaled(view.projectionMatrix, 0, 1, this.rigCameras[i]._projectionMatrix);
            if (!this._scene.useRightHandedSystem) {
                this.rigCameras[i]._computedViewMatrix.toggleModelMatrixHandInPlace();
                this.rigCameras[i]._projectionMatrix.toggleProjectionMatrixHandInPlace();
            }

            // Update viewport
            if (xrSessionManager.session.renderState.baseLayer) {
                var viewport = xrSessionManager.session.renderState.baseLayer.getViewport(view);
                var width = xrSessionManager.session.renderState.baseLayer.framebufferWidth;
                var height = xrSessionManager.session.renderState.baseLayer.framebufferHeight;
                this.rigCameras[i].viewport.width = viewport.width / width;
                this.rigCameras[i].viewport.height = viewport.height / height;
                this.rigCameras[i].viewport.x = viewport.x / width;
                this.rigCameras[i].viewport.y = viewport.y / height;
            }

            // Set cameras to render to the session's render target
            this.rigCameras[i].outputRenderTarget = xrSessionManager._sessionRenderTargetTexture;
        });
        return true;
    }
}
