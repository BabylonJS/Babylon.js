import { Vector3, Matrix, Quaternion, TmpVectors } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { Camera } from "../Cameras/camera";
import { FreeCamera } from "../Cameras/freeCamera";
import { TargetCamera } from "../Cameras/targetCamera";
import type { WebXRSessionManager } from "./webXRSessionManager";
import { Viewport } from "../Maths/math.viewport";
import { Observable } from "../Misc/observable";
import { WebXRTrackingState } from "./webXRTypes";

/**
 * WebXR Camera which holds the views for the xrSession
 * @see https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRCamera
 */
export class WebXRCamera extends FreeCamera {
    private static _ScaleReadOnly = Vector3.One();

    private _firstFrame = false;
    private _referenceQuaternion: Quaternion = Quaternion.Identity();
    private _referencedPosition: Vector3 = new Vector3();
    private _trackingState: WebXRTrackingState = WebXRTrackingState.NOT_TRACKING;

    /**
     * This will be triggered after the first XR Frame initialized the camera,
     * including the right number of views and their rendering parameters
     */
    public onXRCameraInitializedObservable = new Observable<WebXRCamera>();

    /**
     * Observable raised before camera teleportation
     * @deprecated use onBeforeCameraTeleport of the teleportation feature instead
     */
    public onBeforeCameraTeleport = new Observable<Vector3>();

    /**
     *  Observable raised after camera teleportation
     * @deprecated use onAfterCameraTeleport of the teleportation feature instead
     */
    public onAfterCameraTeleport = new Observable<Vector3>();

    /**
     * Notifies when the camera's tracking state has changed.
     * Notice - will also be triggered when tracking has started (at the beginning of the session)
     */
    public onTrackingStateChanged = new Observable<WebXRTrackingState>();

    /**
     * Should position compensation execute on first frame.
     * This is used when copying the position from a native (non XR) camera
     */
    public compensateOnFirstFrame: boolean = true;

    /**
     * The last XRViewerPose from the current XRFrame
     * @internal
     */
    public _lastXRViewerPose?: XRViewerPose;

    /**
     * Creates a new webXRCamera, this should only be set at the camera after it has been updated by the xrSessionManager
     * @param name the name of the camera
     * @param scene the scene to add the camera to
     * @param _xrSessionManager a constructed xr session manager
     */
    constructor(
        name: string,
        scene: Scene,
        private _xrSessionManager: WebXRSessionManager
    ) {
        super(name, Vector3.Zero(), scene);

        // Initial camera configuration
        this.minZ = 0.1;
        this.rotationQuaternion = new Quaternion();
        this.cameraRigMode = Camera.RIG_MODE_CUSTOM;
        this.updateUpVectorFromRotation = true;
        this._updateNumberOfRigCameras(1);
        // freeze projection matrix, which will be copied later
        this.freezeProjectionMatrix();
        this._deferOnly = true;

        this._xrSessionManager.onXRSessionInit.add(() => {
            this._referencedPosition.copyFromFloats(0, 0, 0);
            this._referenceQuaternion.copyFromFloats(0, 0, 0, 1);
            // first frame - camera's y position should be 0 for the correct offset
            this._firstFrame = this.compensateOnFirstFrame;
            this._xrSessionManager.onWorldScaleFactorChangedObservable.add(() => {
                // only run if in session
                if (!this._xrSessionManager.currentFrame) {
                    return;
                }
                this._updateDepthNearFar();
            });
        });

        // Check transformation changes on each frame. Callback is added to be first so that the transformation will be
        // applied to the rest of the elements using the referenceSpace object
        this._xrSessionManager.onXRFrameObservable.add(
            () => {
                if (this._firstFrame) {
                    this._updateFromXRSession();
                }
                if (this.onXRCameraInitializedObservable.hasObservers()) {
                    this.onXRCameraInitializedObservable.notifyObservers(this);
                    this.onXRCameraInitializedObservable.clear();
                }

                if (this._deferredUpdated) {
                    this.position.copyFrom(this._deferredPositionUpdate);
                    this.rotationQuaternion.copyFrom(this._deferredRotationQuaternionUpdate);
                }

                this._updateReferenceSpace();
                this._updateFromXRSession();
            },
            undefined,
            true
        );
    }

    /**
     * Get the current XR tracking state of the camera
     */
    public get trackingState(): WebXRTrackingState {
        return this._trackingState;
    }

    private _setTrackingState(newState: WebXRTrackingState) {
        if (this._trackingState !== newState) {
            this._trackingState = newState;
            this.onTrackingStateChanged.notifyObservers(newState);
        }
    }

    /**
     * Return the user's height, unrelated to the current ground.
     * This will be the y position of this camera, when ground level is 0.
     *
     * Note - this value is multiplied by the worldScalingFactor (if set), so it will be in the same units as the scene.
     */
    public get realWorldHeight(): number {
        const basePose = this._xrSessionManager.currentFrame && this._xrSessionManager.currentFrame.getViewerPose(this._xrSessionManager.baseReferenceSpace);
        if (basePose && basePose.transform) {
            return basePose.transform.position.y * this._xrSessionManager.worldScalingFactor;
        } else {
            return 0;
        }
    }

    /** @internal */
    public _updateForDualEyeDebugging(/*pupilDistance = 0.01*/) {
        // Create initial camera rigs
        this._updateNumberOfRigCameras(2);
        this.rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
        // this.rigCameras[0].position.x = -pupilDistance / 2;
        this.rigCameras[0].outputRenderTarget = null;
        this.rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
        // this.rigCameras[1].position.x = pupilDistance / 2;
        this.rigCameras[1].outputRenderTarget = null;
    }

    /**
     * Sets this camera's transformation based on a non-vr camera
     * @param otherCamera the non-vr camera to copy the transformation from
     * @param resetToBaseReferenceSpace should XR reset to the base reference space
     */
    public setTransformationFromNonVRCamera(otherCamera: Camera = this.getScene().activeCamera!, resetToBaseReferenceSpace: boolean = true) {
        if (!otherCamera || otherCamera === this) {
            return;
        }
        const mat = otherCamera.computeWorldMatrix();
        mat.decompose(undefined, this.rotationQuaternion, this.position);
        // set the ground level
        this.position.y = 0;
        Quaternion.FromEulerAnglesToRef(0, this.rotationQuaternion.toEulerAngles().y, 0, this.rotationQuaternion);
        this._firstFrame = true;
        if (resetToBaseReferenceSpace) {
            this._xrSessionManager.resetReferenceSpace();
        }
    }

    /**
     * Gets the current instance class name ("WebXRCamera").
     * @returns the class name
     */
    public getClassName(): string {
        return "WebXRCamera";
    }

    /**
     * Set the target for the camera to look at.
     * Note that this only rotates around the Y axis, as opposed to the default behavior of other cameras
     * @param target the target to set the camera to look at
     */
    public setTarget(target: Vector3): void {
        // only rotate around the y axis!
        const tmpVector = TmpVectors.Vector3[1];
        target.subtractToRef(this.position, tmpVector);
        tmpVector.y = 0;
        tmpVector.normalize();
        const yRotation = Math.atan2(tmpVector.x, tmpVector.z);
        this.rotationQuaternion.toEulerAnglesToRef(tmpVector);
        Quaternion.FromEulerAnglesToRef(tmpVector.x, yRotation, tmpVector.z, this.rotationQuaternion);
    }

    public dispose() {
        super.dispose();
        this._lastXRViewerPose = undefined;
    }

    private _updateDepthNearFar() {
        const far = (this.maxZ || 10000) * this._xrSessionManager.worldScalingFactor;
        const xrRenderState: XRRenderStateInit = {
            // if maxZ is 0 it should be "Infinity", but it doesn't work with the WebXR API. Setting to a large number.
            depthFar: far,
            depthNear: this.minZ,
        };

        this._xrSessionManager.updateRenderState(xrRenderState);
        this._cache.minZ = this.minZ;
        this._cache.maxZ = far;
    }

    private _rotate180 = new Quaternion(0, 1, 0, 0);

    private _updateFromXRSession() {
        const pose = this._xrSessionManager.currentFrame && this._xrSessionManager.currentFrame.getViewerPose(this._xrSessionManager.referenceSpace);
        this._lastXRViewerPose = pose || undefined;
        if (!pose) {
            this._setTrackingState(WebXRTrackingState.NOT_TRACKING);
            return;
        }

        // Set the tracking state. if it didn't change it is a no-op
        const trackingState = pose.emulatedPosition ? WebXRTrackingState.TRACKING_LOST : WebXRTrackingState.TRACKING;
        this._setTrackingState(trackingState);

        // check min/max Z and update if not the same as in cache
        if (this.minZ !== this._cache.minZ || this.maxZ !== this._cache.maxZ) {
            this._updateDepthNearFar();
        }

        if (pose.transform) {
            const orientation = pose.transform.orientation;
            if (pose.transform.orientation.x === undefined) {
                // Babylon native polyfill can return an undefined orientation value
                // When not initialized
                return;
            }
            const pos = pose.transform.position;
            this._referencedPosition.set(pos.x, pos.y, pos.z).scaleInPlace(this._xrSessionManager.worldScalingFactor);

            this._referenceQuaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
            if (!this._scene.useRightHandedSystem) {
                this._referencedPosition.z *= -1;
                this._referenceQuaternion.z *= -1;
                this._referenceQuaternion.w *= -1;
            }

            if (this._firstFrame) {
                this._firstFrame = false;
                // we have the XR reference, now use this to find the offset to get the camera to be
                // in the right position

                // set the height to correlate to the current height
                this.position.y += this._referencedPosition.y;
                // avoid using the head rotation on the first frame.
                this._referenceQuaternion.copyFromFloats(0, 0, 0, 1);
            } else {
                // update position and rotation as reference
                this.rotationQuaternion.copyFrom(this._referenceQuaternion);
                this.position.copyFrom(this._referencedPosition);
            }
        }

        // Update camera rigs
        if (this.rigCameras.length !== pose.views.length) {
            this._updateNumberOfRigCameras(pose.views.length);
        }

        pose.views.forEach((view: XRView, i: number) => {
            const currentRig = <TargetCamera>this.rigCameras[i];
            // update right and left, where applicable
            if (!currentRig.isLeftCamera && !currentRig.isRightCamera) {
                if (view.eye === "right") {
                    currentRig._isRightCamera = true;
                } else if (view.eye === "left") {
                    currentRig._isLeftCamera = true;
                }
            }
            // Update view/projection matrix
            const pos = view.transform.position;
            const orientation = view.transform.orientation;

            currentRig.parent = this.parent;

            currentRig.position.set(pos.x, pos.y, pos.z).scaleInPlace(this._xrSessionManager.worldScalingFactor);
            currentRig.rotationQuaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
            if (!this._scene.useRightHandedSystem) {
                currentRig.position.z *= -1;
                currentRig.rotationQuaternion.z *= -1;
                currentRig.rotationQuaternion.w *= -1;
            } else {
                currentRig.rotationQuaternion.multiplyInPlace(this._rotate180);
            }
            Matrix.FromFloat32ArrayToRefScaled(view.projectionMatrix, 0, 1, currentRig._projectionMatrix);

            if (!this._scene.useRightHandedSystem) {
                currentRig._projectionMatrix.toggleProjectionMatrixHandInPlace();
            }

            // first camera?
            if (i === 0) {
                this._projectionMatrix.copyFrom(currentRig._projectionMatrix);
            }

            const renderTargetTexture = this._xrSessionManager.getRenderTargetTextureForView(view);
            this._renderingMultiview = renderTargetTexture?._texture?.isMultiview || false;
            if (this._renderingMultiview) {
                // For multiview, the render target texture is the same per-view (just the slice index is different),
                // so we only need to set the output render target once for the rig parent.
                if (i == 0) {
                    this._xrSessionManager.trySetViewportForView(this.viewport, view);
                    this.outputRenderTarget = renderTargetTexture;
                }
            } else {
                // Update viewport
                this._xrSessionManager.trySetViewportForView(currentRig.viewport, view);

                // Set cameras to render to the session's render target
                currentRig.outputRenderTarget = renderTargetTexture || this._xrSessionManager.getRenderTargetTextureForView(view);
            }

            // Replicate parent rig camera behavior
            currentRig.layerMask = this.layerMask;
        });
    }

    private _updateNumberOfRigCameras(viewCount = 1) {
        while (this.rigCameras.length < viewCount) {
            const newCamera = new TargetCamera("XR-RigCamera: " + this.rigCameras.length, Vector3.Zero(), this.getScene());
            newCamera.minZ = 0.1;
            newCamera.rotationQuaternion = new Quaternion();
            newCamera.updateUpVectorFromRotation = true;
            newCamera.isRigCamera = true;
            newCamera.rigParent = this;
            // do not compute projection matrix, provided by XR
            newCamera.freezeProjectionMatrix();
            this.rigCameras.push(newCamera);
        }
        while (this.rigCameras.length > viewCount) {
            const removedCamera = this.rigCameras.pop();
            if (removedCamera) {
                removedCamera.dispose();
            }
        }
    }

    private _updateReferenceSpace() {
        // were position & rotation updated OUTSIDE of the xr update loop
        if (!this.position.equals(this._referencedPosition) || !this.rotationQuaternion.equals(this._referenceQuaternion)) {
            const referencedMat = TmpVectors.Matrix[0];
            const poseMat = TmpVectors.Matrix[1];
            const transformMat = TmpVectors.Matrix[2];

            Matrix.ComposeToRef(WebXRCamera._ScaleReadOnly, this._referenceQuaternion, this._referencedPosition, referencedMat);
            Matrix.ComposeToRef(WebXRCamera._ScaleReadOnly, this.rotationQuaternion, this.position, poseMat);
            referencedMat.invert().multiplyToRef(poseMat, transformMat);
            transformMat.invert();

            if (!this._scene.useRightHandedSystem) {
                transformMat.toggleModelMatrixHandInPlace();
            }

            transformMat.decompose(undefined, this._referenceQuaternion, this._referencedPosition);
            const transform = new XRRigidTransform(
                {
                    x: this._referencedPosition.x / this._xrSessionManager.worldScalingFactor,
                    y: this._referencedPosition.y / this._xrSessionManager.worldScalingFactor,
                    z: this._referencedPosition.z / this._xrSessionManager.worldScalingFactor,
                },
                {
                    x: this._referenceQuaternion.x,
                    y: this._referenceQuaternion.y,
                    z: this._referenceQuaternion.z,
                    w: this._referenceQuaternion.w,
                }
            );
            this._xrSessionManager.referenceSpace = this._xrSessionManager.referenceSpace.getOffsetReferenceSpace(transform);
        }
    }
}
