module BABYLON {

    export enum PoseEnabledControllerType {
        VIVE,
        OCULUS,
        WINDOWS,
        GEAR_VR,
        GENERIC
    }

    export interface MutableGamepadButton {
        value: number;
        touched: boolean;
        pressed: boolean;
    }

    export interface ExtendedGamepadButton extends GamepadButton {
        readonly pressed: boolean;
        readonly touched: boolean;
        readonly value: number;
    }

    export class PoseEnabledControllerHelper {
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
            // Samsung/Oculus Gear VR
            else if (vrGamepad.id.indexOf(GearVRController.GAMEPAD_ID_PREFIX) === 0) {
                return new GearVRController(vrGamepad);
            }
            // Generic 
            else {
                return new GenericController(vrGamepad);
            }
        }
    }

    export class PoseEnabledController extends Gamepad implements PoseControlled {
        // Represents device position and rotation in room space. Should only be used to help calculate babylon space values
        private _deviceRoomPosition = Vector3.Zero();
        private _deviceRoomRotationQuaternion = new Quaternion();

        // Represents device position and rotation in babylon space
        public devicePosition = Vector3.Zero();
        public deviceRotationQuaternion = new Quaternion();

        deviceScaleFactor: number = 1;

        public position: Vector3;
        public rotationQuaternion: Quaternion;
        public controllerType: PoseEnabledControllerType;

        private _calculatedPosition: Vector3;
        private _calculatedRotation: Quaternion;

        public rawPose: DevicePose; //GamepadPose;

        public _mesh: Nullable<AbstractMesh>; // a node that will be attached to this Gamepad
        private _poseControlledCamera: TargetCamera;

        private _leftHandSystemQuaternion: Quaternion = new Quaternion();

        public _deviceToWorld = Matrix.Identity();

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
        public update() {
            super.update();
            var pose: GamepadPose = this.browserGamepad.pose;
            this.updateFromDevice(pose);

            Vector3.TransformCoordinatesToRef(this._calculatedPosition, this._deviceToWorld, this.devicePosition)
            this._deviceToWorld.getRotationMatrixToRef(this._workingMatrix);
            Quaternion.FromRotationMatrixToRef(this._workingMatrix, this.deviceRotationQuaternion);
            this.deviceRotationQuaternion.multiplyInPlace(this._calculatedRotation)

            if (this._mesh) {
                this._mesh.position.copyFrom(this.devicePosition);

                if (this._mesh.rotationQuaternion) {
                    this._mesh.rotationQuaternion.copyFrom(this.deviceRotationQuaternion);
                }
            }
        }

        updateFromDevice(poseData: DevicePose) {
            if (poseData) {
                this.rawPose = poseData;
                if (poseData.position) {
                    this._deviceRoomPosition.copyFromFloats(poseData.position[0], poseData.position[1], -poseData.position[2]);
                    if (this._mesh && this._mesh.getScene().useRightHandedSystem) {
                        this._deviceRoomPosition.z *= -1;
                    }

                    this._deviceRoomPosition.scaleToRef(this.deviceScaleFactor, this._calculatedPosition);
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
        }

        public attachToPoseControlledCamera(camera: TargetCamera) {
            this._poseControlledCamera = camera;
            if (this._mesh) {
                this._mesh.parent = this._poseControlledCamera;
            }
        }

        public dispose() {
            if (this._mesh) {
                this._mesh.dispose();
            }
            this._mesh = null;

            super.dispose();
        }

        public get mesh(): Nullable<AbstractMesh> {
            return this._mesh;
        }

        public getForwardRay(length = 100): Ray {
            if (!this.mesh) {
                return new Ray(Vector3.Zero(), new Vector3(0, 0, 1), length);
            }

            var m = this.mesh.getWorldMatrix();
            var origin = m.getTranslation();

            var forward = new Vector3(0, 0, -1);
            var forwardWorld = Vector3.TransformNormal(forward, m);

            var direction = Vector3.Normalize(forwardWorld);

            return new Ray(origin, direction, length);
        }
    }
}
