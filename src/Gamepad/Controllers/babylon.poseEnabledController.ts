module BABYLON {
    /**
    * Defines the types of pose enabled controllers that are supported
    */
    export enum PoseEnabledControllerType {
        /**
         * HTC Vive
         */
        VIVE,
        /**
         * Oculus Rift
         */
        OCULUS,
        /**
         * Windows mixed reality
         */
        WINDOWS,
        /**
         * Samsung gear VR
         */
        GEAR_VR,
        /**
         * Google Daydream
         */
        DAYDREAM,
        /**
         * Generic
         */
        GENERIC
    }

    /**
     * Defines the MutableGamepadButton interface for the state of a gamepad button
     */
    export interface MutableGamepadButton {
        /**
         * Value of the button/trigger
         */
        value: number;
        /**
         * If the button/trigger is currently touched
         */
        touched: boolean;
        /**
         * If the button/trigger is currently pressed
         */
        pressed: boolean;
    }

    /**
     * Defines the ExtendedGamepadButton interface for a gamepad button which includes state provided by a pose controller
     * @hidden
     */
    export interface ExtendedGamepadButton extends GamepadButton {
        /**
         * If the button/trigger is currently pressed
         */
        readonly pressed: boolean;
        /**
         * If the button/trigger is currently touched
         */
        readonly touched: boolean;
        /**
         * Value of the button/trigger
         */
        readonly value: number;
    }

    /**
     * Defines the PoseEnabledControllerHelper object that is used initialize a gamepad as the controller type it is specified as (eg. windows mixed reality controller)
     */
    export class PoseEnabledControllerHelper {
        /**
         * Initializes a gamepad as the controller type it is specified as (eg. windows mixed reality controller)
         * @param vrGamepad the gamepad to initialized
         * @returns a vr controller of the type the gamepad identified as
         */
        public static InitiateController(vrGamepad: any) {
            // Oculus Touch
            if (vrGamepad.id.indexOf('Oculus Touch') !== -1) {
                return new OculusTouchController(vrGamepad);
            }
            // Windows Mixed Reality controllers
            else if (vrGamepad.id.indexOf(WindowsMotionController.GAMEPAD_ID_PREFIX) === 0) {
                return new WindowsMotionController(vrGamepad);
            }
            // HTC Vive
            else if (vrGamepad.id.toLowerCase().indexOf('openvr') !== -1) {
                return new ViveController(vrGamepad);
            }
            // Samsung/Oculus Gear VR or Oculus Go
            else if (vrGamepad.id.indexOf(GearVRController.GAMEPAD_ID_PREFIX) === 0 || vrGamepad.id.indexOf('Oculus Go') !== -1) {
                return new GearVRController(vrGamepad);
            }
            // Google Daydream
            else if (vrGamepad.id.indexOf(DaydreamController.GAMEPAD_ID_PREFIX) === 0) {
                return new DaydreamController(vrGamepad);
            }
            // Generic
            else {
                return new GenericController(vrGamepad);
            }
        }
    }

    /**
     * Defines the PoseEnabledController object that contains state of a vr capable controller
     */
    export class PoseEnabledController extends Gamepad implements PoseControlled {
        // Represents device position and rotation in room space. Should only be used to help calculate babylon space values
        private _deviceRoomPosition = Vector3.Zero();
        private _deviceRoomRotationQuaternion = new Quaternion();

        /**
         * The device position in babylon space
         */
        public devicePosition = Vector3.Zero();
        /**
         * The device rotation in babylon space
         */
        public deviceRotationQuaternion = new Quaternion();
        /**
         * The scale factor of the device in babylon space
         */
        public deviceScaleFactor: number = 1;

        /**
         * (Likely devicePosition should be used instead) The device position in its room space
         */
        public position: Vector3;
        /**
         * (Likely deviceRotationQuaternion should be used instead) The device rotation in its room space
         */
        public rotationQuaternion: Quaternion;
        /**
         * The type of controller (Eg. Windows mixed reality)
         */
        public controllerType: PoseEnabledControllerType;

        protected _calculatedPosition: Vector3;
        private _calculatedRotation: Quaternion;

        /**
         * The raw pose from the device
         */
        public rawPose: DevicePose; //GamepadPose;

        // Used to convert 6dof controllers to 3dof
        private _trackPosition = true;
        private _maxRotationDistFromHeadset = Math.PI / 5;
        private _draggedRoomRotation = 0;
        /**
         * @hidden
         */
        public _disableTrackPosition(fixedPosition: Vector3) {
            if (this._trackPosition) {
                this._calculatedPosition.copyFrom(fixedPosition);
                this._trackPosition = false;
            }
        }

        /**
         * Internal, the mesh attached to the controller
         * @hidden
         */
        public _mesh: Nullable<AbstractMesh>; // a node that will be attached to this Gamepad
        private _poseControlledCamera: TargetCamera;

        private _leftHandSystemQuaternion: Quaternion = new Quaternion();

        /**
         * Internal, matrix used to convert room space to babylon space
         * @hidden
         */
        public _deviceToWorld = Matrix.Identity();

        /**
         * Node to be used when casting a ray from the controller
         * @hidden
         */
        public _pointingPoseNode: Nullable<TransformNode> = null;
        /**
         * Name of the child mesh that can be used to cast a ray from the controller
         */
        public static readonly POINTING_POSE = "POINTING_POSE";
        /**
         * Creates a new PoseEnabledController from a gamepad
         * @param browserGamepad the gamepad that the PoseEnabledController should be created from
         */
        constructor(browserGamepad: any) {
            super(browserGamepad.id, browserGamepad.index, browserGamepad);
            this.type = Gamepad.POSE_ENABLED;
            this.controllerType = PoseEnabledControllerType.GENERIC;
            this.position = Vector3.Zero();
            this.rotationQuaternion = new Quaternion();

            this._calculatedPosition = Vector3.Zero();
            this._calculatedRotation = new Quaternion();
            Quaternion.RotationYawPitchRollToRef(Math.PI, 0, 0, this._leftHandSystemQuaternion);
        }

        private _workingMatrix = Matrix.Identity();
        /**
         * Updates the state of the pose enbaled controller and mesh based on the current position and rotation of the controller
         */
        public update() {
            super.update();
            this._updatePoseAndMesh();
        }

        /**
         * Updates only the pose device and mesh without doing any button event checking
         */
        protected _updatePoseAndMesh() {
            var pose: GamepadPose = this.browserGamepad.pose;
            this.updateFromDevice(pose);

            if (!this._trackPosition && BABYLON.Engine.LastCreatedScene && BABYLON.Engine.LastCreatedScene.activeCamera && (<WebVRFreeCamera>BABYLON.Engine.LastCreatedScene.activeCamera).devicePosition) {
                var camera = <WebVRFreeCamera>BABYLON.Engine.LastCreatedScene.activeCamera;
                camera._computeDevicePosition();

                this._deviceToWorld.setTranslation(camera.devicePosition);
                if (camera.deviceRotationQuaternion) {
                    var camera = camera;
                    camera._deviceRoomRotationQuaternion.toEulerAnglesToRef(BABYLON.Tmp.Vector3[0]);

                    // Find the radian distance away that the headset is from the controllers rotation
                    var distanceAway = Math.atan2(Math.sin(BABYLON.Tmp.Vector3[0].y - this._draggedRoomRotation), Math.cos(BABYLON.Tmp.Vector3[0].y - this._draggedRoomRotation));
                    if (Math.abs(distanceAway) > this._maxRotationDistFromHeadset) {
                        // Only rotate enouph to be within the _maxRotationDistFromHeadset
                        var rotationAmount = distanceAway - (distanceAway < 0 ? -this._maxRotationDistFromHeadset : this._maxRotationDistFromHeadset);
                        this._draggedRoomRotation += rotationAmount;

                        // Rotate controller around headset
                        var sin = Math.sin(-rotationAmount);
                        var cos = Math.cos(-rotationAmount);
                        this._calculatedPosition.x = this._calculatedPosition.x * cos - this._calculatedPosition.z * sin;
                        this._calculatedPosition.z = this._calculatedPosition.x * sin + this._calculatedPosition.z * cos;
                    }
                }
            }

            Vector3.TransformCoordinatesToRef(this._calculatedPosition, this._deviceToWorld, this.devicePosition);
            this._deviceToWorld.getRotationMatrixToRef(this._workingMatrix);
            Quaternion.FromRotationMatrixToRef(this._workingMatrix, this.deviceRotationQuaternion);
            this.deviceRotationQuaternion.multiplyInPlace(this._calculatedRotation);

            if (this._mesh) {
                this._mesh.position.copyFrom(this.devicePosition);

                if (this._mesh.rotationQuaternion) {
                    this._mesh.rotationQuaternion.copyFrom(this.deviceRotationQuaternion);
                }
            }
        }

        /**
         * Updates the state of the pose enbaled controller based on the raw pose data from the device
         * @param poseData raw pose fromthe device
         */
        updateFromDevice(poseData: DevicePose) {
            if (poseData) {
                this.rawPose = poseData;
                if (poseData.position) {
                    this._deviceRoomPosition.copyFromFloats(poseData.position[0], poseData.position[1], -poseData.position[2]);
                    if (this._mesh && this._mesh.getScene().useRightHandedSystem) {
                        this._deviceRoomPosition.z *= -1;
                    }
                    if (this._trackPosition) {
                        this._deviceRoomPosition.scaleToRef(this.deviceScaleFactor, this._calculatedPosition);
                    }
                    this._calculatedPosition.addInPlace(this.position);
                }
                let pose = this.rawPose;
                if (poseData.orientation && pose.orientation) {
                    this._deviceRoomRotationQuaternion.copyFromFloats(pose.orientation[0], pose.orientation[1], -pose.orientation[2], -pose.orientation[3]);
                    if (this._mesh) {
                        if (this._mesh.getScene().useRightHandedSystem) {
                            this._deviceRoomRotationQuaternion.z *= -1;
                            this._deviceRoomRotationQuaternion.w *= -1;
                        } else {
                            this._deviceRoomRotationQuaternion.multiplyToRef(this._leftHandSystemQuaternion, this._deviceRoomRotationQuaternion);
                        }
                    }

                    // if the camera is set, rotate to the camera's rotation
                    this._deviceRoomRotationQuaternion.multiplyToRef(this.rotationQuaternion, this._calculatedRotation);
                }
            }
        }

        /**
         * @hidden
         */
        public _meshAttachedObservable = new Observable<AbstractMesh>();

        /**
         * Attaches a mesh to the controller
         * @param mesh the mesh to be attached
         */
        public attachToMesh(mesh: AbstractMesh) {
            if (this._mesh) {
                this._mesh.parent = null;
            }
            this._mesh = mesh;
            if (this._poseControlledCamera) {
                this._mesh.parent = this._poseControlledCamera;
            }
            if (!this._mesh.rotationQuaternion) {
                this._mesh.rotationQuaternion = new Quaternion();
            }

            // Sync controller mesh and pointing pose node's state with controller, this is done to avoid a frame where position is 0,0,0 when attaching mesh
            this._updatePoseAndMesh();
            if (this._pointingPoseNode) {
                var parents = [];
                var obj: Node = this._pointingPoseNode;
                while (obj.parent) {
                    parents.push(obj.parent);
                    obj = obj.parent;
                }
                parents.reverse().forEach((p) => { p.computeWorldMatrix(true); });
            }

            this._meshAttachedObservable.notifyObservers(mesh);
        }

        /**
         * Attaches the controllers mesh to a camera
         * @param camera the camera the mesh should be attached to
         */
        public attachToPoseControlledCamera(camera: TargetCamera) {
            this._poseControlledCamera = camera;
            if (this._mesh) {
                this._mesh.parent = this._poseControlledCamera;
            }
        }

        /**
         * Disposes of the controller
         */
        public dispose() {
            if (this._mesh) {
                this._mesh.dispose();
            }
            this._mesh = null;

            super.dispose();
        }

        /**
         * The mesh that is attached to the controller
         */
        public get mesh(): Nullable<AbstractMesh> {
            return this._mesh;
        }

        /**
         * Gets the ray of the controller in the direction the controller is pointing
         * @param length the length the resulting ray should be
         * @returns a ray in the direction the controller is pointing
         */
        public getForwardRay(length = 100): Ray {
            if (!this.mesh) {
                return new Ray(Vector3.Zero(), new Vector3(0, 0, 1), length);
            }

            var m = this._pointingPoseNode ? this._pointingPoseNode.getWorldMatrix() : this.mesh.getWorldMatrix();
            var origin = m.getTranslation();

            var forward = new Vector3(0, 0, -1);
            var forwardWorld = Vector3.TransformNormal(forward, m);

            var direction = Vector3.Normalize(forwardWorld);

            return new Ray(origin, direction, length);
        }
    }
}
