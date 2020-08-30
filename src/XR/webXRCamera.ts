import { Vector3, Matrix, Quaternion } from "../Maths/math.vector";
import { Scene } from "../scene";
import { Camera } from "../Cameras/camera";
import { FreeCamera } from "../Cameras/freeCamera";
import { TargetCamera } from "../Cameras/targetCamera";
import { WebXRSessionManager } from "./webXRSessionManager";
import { Viewport } from "../Maths/math.viewport";
import { Observable } from '../Misc/observable';

/**
 * WebXR Camera which holds the views for the xrSession
 * @see https://doc.babylonjs.com/how_to/webxr_camera
 */
export class WebXRCamera extends FreeCamera {
    private _firstFrame = false;
    private _referenceQuaternion: Quaternion = Quaternion.Identity();
    private _referencedPosition: Vector3 = new Vector3();
    private _xrInvPositionCache: Vector3 = new Vector3();
    private _xrInvQuaternionCache = Quaternion.Identity();

    /**
     * Observable raised before camera teleportation
     */
    public onBeforeCameraTeleport = new Observable<Vector3>();

    /**
     *  Observable raised after camera teleportation
     */
    public onAfterCameraTeleport = new Observable<Vector3>();

    /**
     * Should position compensation execute on first frame.
     * This is used when copying the position from a native (non XR) camera
     */
    public compensateOnFirstFrame: boolean = true;

    /**
     * Creates a new webXRCamera, this should only be set at the camera after it has been updated by the xrSessionManager
     * @param name the name of the camera
     * @param scene the scene to add the camera to
     * @param _xrSessionManager a constructed xr session manager
     */
    constructor(name: string, scene: Scene, private _xrSessionManager: WebXRSessionManager) {
        super(name, Vector3.Zero(), scene);

        // Initial camera configuration
        this.minZ = 0.1;
        this.rotationQuaternion = new Quaternion();
        this.cameraRigMode = Camera.RIG_MODE_CUSTOM;
        this.updateUpVectorFromRotation = true;
        this._updateNumberOfRigCameras(1);

        this._xrSessionManager.onXRSessionInit.add(() => {
            this._referencedPosition.copyFromFloats(0, 0, 0);
            this._referenceQuaternion.copyFromFloats(0, 0, 0, 1);
            // first frame - camera's y position should be 0 for the correct offset
            this._firstFrame = this.compensateOnFirstFrame;
        });

        // Check transformation changes on each frame. Callback is added to be first so that the transformation will be
        // applied to the rest of the elements using the referenceSpace object
        this._xrSessionManager.onXRFrameObservable.add(
            (frame) => {
                if (this._firstFrame) {
                    this._updateFromXRSession();
                }
                this._updateReferenceSpace();
                this._updateFromXRSession();
            },
            undefined,
            true
        );
    }

    /**
     * Return the user's height, unrelated to the current ground.
     * This will be the y position of this camera, when ground level is 0.
     */
    public get realWorldHeight(): number {
        const basePose = this._xrSessionManager.currentFrame && this._xrSessionManager.currentFrame.getViewerPose(this._xrSessionManager.baseReferenceSpace);
        if (basePose && basePose.transform) {
            return basePose.transform.position.y;
        } else {
            return 0;
        }
    }

    /** @hidden */
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

    private _rotate180 = new Quaternion(0, 1, 0, 0);

    private _updateFromXRSession() {
        const pose = this._xrSessionManager.currentFrame && this._xrSessionManager.currentFrame.getViewerPose(this._xrSessionManager.referenceSpace);

        if (!pose) {
            return;
        }

        if (pose.transform) {
            const pos = pose.transform.position;
            this._referencedPosition.set(pos.x, pos.y, pos.z);
            const orientation = pose.transform.orientation;

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

        pose.views.forEach((view: any, i: number) => {
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

            currentRig.position.set(pos.x, pos.y, pos.z);
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

            // Update viewport
            if (this._xrSessionManager.session.renderState.baseLayer) {
                var viewport = this._xrSessionManager.session.renderState.baseLayer.getViewport(view);
                var width = this._xrSessionManager.session.renderState.baseLayer.framebufferWidth;
                var height = this._xrSessionManager.session.renderState.baseLayer.framebufferHeight;
                currentRig.viewport.width = viewport.width / width;
                currentRig.viewport.height = viewport.height / height;
                currentRig.viewport.x = viewport.x / width;
                currentRig.viewport.y = viewport.y / height;
            }

            // Set cameras to render to the session's render target
            currentRig.outputRenderTarget = this._xrSessionManager.getRenderTargetTextureForEye(view.eye);
        });
    }

    private _updateNumberOfRigCameras(viewCount = 1) {
        while (this.rigCameras.length < viewCount) {
            var newCamera = new TargetCamera("XR-RigCamera: " + this.rigCameras.length, Vector3.Zero(), this.getScene());
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
            var removedCamera = this.rigCameras.pop();
            if (removedCamera) {
                removedCamera.dispose();
            }
        }
    }

    private _updateReferenceSpace() {
        // were position & rotation updated OUTSIDE of the xr update loop
        if (!this.position.equals(this._referencedPosition) || !this.rotationQuaternion.equals(this._referenceQuaternion)) {
            this.position.subtractToRef(this._referencedPosition, this._referencedPosition);
            this._referenceQuaternion.conjugateInPlace();
            this._referenceQuaternion.multiplyToRef(this.rotationQuaternion, this._referenceQuaternion);
            this._updateReferenceSpaceOffset(this._referencedPosition, this._referenceQuaternion.normalize());
        }
    }

    private _updateReferenceSpaceOffset(positionOffset: Vector3, rotationOffset?: Quaternion, ignoreHeight: boolean = false) {
        if (!this._xrSessionManager.referenceSpace || !this._xrSessionManager.currentFrame) {
            return;
        }
        // Compute the origin offset based on player position/orientation.
        this._xrInvPositionCache.copyFrom(positionOffset);
        if (rotationOffset) {
            this._xrInvQuaternionCache.copyFrom(rotationOffset);
        } else {
            this._xrInvQuaternionCache.copyFromFloats(0, 0, 0, 1);
        }

        // right handed system
        if (!this._scene.useRightHandedSystem) {
            this._xrInvPositionCache.z *= -1;
            this._xrInvQuaternionCache.z *= -1;
            this._xrInvQuaternionCache.w *= -1;
        }

        this._xrInvPositionCache.negateInPlace();
        this._xrInvQuaternionCache.conjugateInPlace();
        // transform point according to rotation with pivot
        this._xrInvPositionCache.rotateByQuaternionToRef(this._xrInvQuaternionCache, this._xrInvPositionCache);
        if (ignoreHeight) {
            this._xrInvPositionCache.y = 0;
        }
        const transform = new XRRigidTransform({ x: this._xrInvPositionCache.x, y: this._xrInvPositionCache.y, z: this._xrInvPositionCache.z }, { x: this._xrInvQuaternionCache.x, y: this._xrInvQuaternionCache.y, z: this._xrInvQuaternionCache.z, w: this._xrInvQuaternionCache.w });
        // Update offset reference to use a new originOffset with the teleported
        // player position and orientation.
        // This new offset needs to be applied to the base ref space.
        const referenceSpace = this._xrSessionManager.referenceSpace.getOffsetReferenceSpace(transform);

        const pose = this._xrSessionManager.currentFrame && this._xrSessionManager.currentFrame.getViewerPose(referenceSpace);

        if (pose) {
            const pos = new Vector3(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
            if (!this._scene.useRightHandedSystem) {
                pos.z *= -1;
            }
            this.position.subtractToRef(pos, pos);
            if (!this._scene.useRightHandedSystem) {
                pos.z *= -1;
            }
            pos.negateInPlace();

            const transform2 = new XRRigidTransform({ x: pos.x, y: pos.y, z: pos.z });
            // Update offset reference to use a new originOffset with the teleported
            // player position and orientation.
            // This new offset needs to be applied to the base ref space.
            this._xrSessionManager.referenceSpace = referenceSpace.getOffsetReferenceSpace(transform2);
        }
    }
}
