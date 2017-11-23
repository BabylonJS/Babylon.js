module BABYLON {
    export class TargetCamera extends Camera {

        public cameraDirection = new Vector3(0, 0, 0);
        public cameraRotation = new Vector2(0, 0);

        @serializeAsVector3()
        public rotation = new Vector3(0, 0, 0);

        public rotationQuaternion: Quaternion;

        @serialize()
        public speed = 2.0;

        public noRotationConstraint = false;

        @serializeAsMeshReference("lockedTargetId")
        public lockedTarget: any = null;

        public _currentTarget = Vector3.Zero();
        public _viewMatrix = Matrix.Zero();
        public _camMatrix = Matrix.Zero();
        public _cameraTransformMatrix = Matrix.Zero();
        public _cameraRotationMatrix = Matrix.Zero();
        private _rigCamTransformMatrix: Matrix;

        public _referencePoint = new Vector3(0, 0, 1);
        private _defaultUpVector = new Vector3(0, 1, 0);
        public _transformedReferencePoint = Vector3.Zero();
        public _lookAtTemp = Matrix.Zero();
        public _tempMatrix = Matrix.Zero();

        public _reset: () => void;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
        }

        public getFrontPosition(distance: number): Vector3 {
            var direction = this.getTarget().subtract(this.position);
            direction.normalize();
            direction.scaleInPlace(distance);
            return this.globalPosition.add(direction);
        }

        public _getLockedTargetPosition(): Nullable<Vector3> {
            if (!this.lockedTarget) {
                return null;
            }

            if (this.lockedTarget.absolutePosition) {
                this.lockedTarget.computeWorldMatrix();
            }

            return this.lockedTarget.absolutePosition || this.lockedTarget;
        }

        // State

        /**
         * Store current camera state (fov, position, etc..)
         */
        private _storedPosition: Vector3;
        private _storedRotation: Vector3;
        private _storedRotationQuaternion: Quaternion;

        public storeState(): Camera {
            this._storedPosition = this.position.clone();
            this._storedRotation = this.rotation.clone();
            if (this.rotationQuaternion) {
                this._storedRotationQuaternion = this.rotationQuaternion.clone();
            }

            return super.storeState();
        }

        /**
         * Restored camera state. You must call storeState() first
         */
        public _restoreStateValues(): boolean {
            if (!super._restoreStateValues()) {
                return false;
            }

            this.position = this._storedPosition.clone();
            this.rotation = this._storedRotation.clone();

            if (this.rotationQuaternion) {
                this.rotationQuaternion = this._storedRotationQuaternion.clone();
            }

            this.cameraDirection.copyFromFloats(0, 0, 0);
            this.cameraRotation.copyFromFloats(0, 0);

            return true;
        }

        // Cache
        public _initCache() {
            super._initCache();
            this._cache.lockedTarget = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.rotation = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.rotationQuaternion = new Quaternion(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            var lockedTargetPosition = this._getLockedTargetPosition();
            if (!lockedTargetPosition) {
                this._cache.lockedTarget = null;
            }
            else {
                if (!this._cache.lockedTarget) {
                    this._cache.lockedTarget = lockedTargetPosition.clone();
                }
                else {
                    this._cache.lockedTarget.copyFrom(lockedTargetPosition);
                }
            }

            this._cache.rotation.copyFrom(this.rotation);
            if (this.rotationQuaternion)
                this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
        }

        // Synchronized
        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronizedViewMatrix()) {
                return false;
            }

            var lockedTargetPosition = this._getLockedTargetPosition();

            return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition)
                && (this.rotationQuaternion ? this.rotationQuaternion.equals(this._cache.rotationQuaternion) : this._cache.rotation.equals(this.rotation));
        }

        // Methods
        public _computeLocalCameraSpeed(): number {
            var engine = this.getEngine();
            return this.speed * Math.sqrt((engine.getDeltaTime() / (engine.getFps() * 100.0)));
        }

        // Target
        public setTarget(target: Vector3): void {
            this.upVector.normalize();

            Matrix.LookAtLHToRef(this.position, target, this._defaultUpVector, this._camMatrix);
            this._camMatrix.invert();

            this.rotation.x = Math.atan(this._camMatrix.m[6] / this._camMatrix.m[10]);

            var vDir = target.subtract(this.position);

            if (vDir.x >= 0.0) {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) + Math.PI / 2.0);
            } else {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) - Math.PI / 2.0);
            }

            this.rotation.z = 0;

            if (isNaN(this.rotation.x)) {
                this.rotation.x = 0;
            }

            if (isNaN(this.rotation.y)) {
                this.rotation.y = 0;
            }

            if (isNaN(this.rotation.z)) {
                this.rotation.z = 0;
            }

            if (this.rotationQuaternion) {
                Quaternion.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this.rotationQuaternion);
            }
        }


        /**
         * Return the current target position of the camera. This value is expressed in local space.
         */
        public getTarget(): Vector3 {
            return this._currentTarget;
        }

        public _decideIfNeedsToMove(): boolean {
            return Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
        }

        public _updatePosition(): void {
            if (this.parent) {
                this.parent.getWorldMatrix().invertToRef(Tmp.Matrix[0]);
                Vector3.TransformNormalToRef(this.cameraDirection, Tmp.Matrix[0], Tmp.Vector3[0]);
                this.position.addInPlace(Tmp.Vector3[0]);
                return;
            }
            this.position.addInPlace(this.cameraDirection);
        }
        public _checkInputs(): void {
            var needToMove = this._decideIfNeedsToMove();
            var needToRotate = Math.abs(this.cameraRotation.x) > 0 || Math.abs(this.cameraRotation.y) > 0;

            // Move
            if (needToMove) {
                this._updatePosition();
            }

            // Rotate
            if (needToRotate) {
                this.rotation.x += this.cameraRotation.x;
                this.rotation.y += this.cameraRotation.y;

                //rotate, if quaternion is set and rotation was used
                if (this.rotationQuaternion) {
                    var len = this.rotation.lengthSquared();
                    if (len) {
                        Quaternion.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this.rotationQuaternion);
                    }
                }


                if (!this.noRotationConstraint) {
                    var limit = (Math.PI / 2) * 0.95;


                    if (this.rotation.x > limit)
                        this.rotation.x = limit;
                    if (this.rotation.x < -limit)
                        this.rotation.x = -limit;
                }
            }

            // Inertia
            if (needToMove) {
                if (Math.abs(this.cameraDirection.x) < this.speed * Epsilon) {
                    this.cameraDirection.x = 0;
                }

                if (Math.abs(this.cameraDirection.y) < this.speed * Epsilon) {
                    this.cameraDirection.y = 0;
                }

                if (Math.abs(this.cameraDirection.z) < this.speed * Epsilon) {
                    this.cameraDirection.z = 0;
                }

                this.cameraDirection.scaleInPlace(this.inertia);
            }
            if (needToRotate) {
                if (Math.abs(this.cameraRotation.x) < this.speed * Epsilon) {
                    this.cameraRotation.x = 0;
                }

                if (Math.abs(this.cameraRotation.y) < this.speed * Epsilon) {
                    this.cameraRotation.y = 0;
                }
                this.cameraRotation.scaleInPlace(this.inertia);
            }

            super._checkInputs();
        }

        protected _updateCameraRotationMatrix() {
            if (this.rotationQuaternion) {
                this.rotationQuaternion.toRotationMatrix(this._cameraRotationMatrix);
            } else {
                Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
            }
            //update the up vector!
            BABYLON.Vector3.TransformNormalToRef(this._defaultUpVector, this._cameraRotationMatrix, this.upVector);
        }

        public _getViewMatrix(): Matrix {
            if (!this.lockedTarget) {
                // Compute
                this._updateCameraRotationMatrix();

                Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);

                // Computing target and final matrix
                this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
            } else {
                let targetPosition = this._getLockedTargetPosition();

                if (targetPosition) {
                    this._currentTarget.copyFrom(targetPosition);
                }
            }

            if (this.getScene().useRightHandedSystem) {
                Matrix.LookAtRHToRef(this.position, this._currentTarget, this.upVector, this._viewMatrix);
            } else {
                Matrix.LookAtLHToRef(this.position, this._currentTarget, this.upVector, this._viewMatrix);
            }

            return this._viewMatrix;
        }

        /**
         * @override
         * Override Camera.createRigCamera
         */
        public createRigCamera(name: string, cameraIndex: number): Nullable<Camera> {
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                var rigCamera = new TargetCamera(name, this.position.clone(), this.getScene());
                if (this.cameraRigMode === Camera.RIG_MODE_VR || this.cameraRigMode === Camera.RIG_MODE_WEBVR) {
                    if (!this.rotationQuaternion) {
                        this.rotationQuaternion = new Quaternion();
                    }
                    rigCamera._cameraRigParams = {};
                    rigCamera.rotationQuaternion = new Quaternion();
                }
                return rigCamera;
            }
            return null;
        }

        /**
         * @override
         * Override Camera._updateRigCameras
         */
        public _updateRigCameras() {
            var camLeft = <TargetCamera>this._rigCameras[0];
            var camRight = <TargetCamera>this._rigCameras[1];

            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                    //provisionnaly using _cameraRigParams.stereoHalfAngle instead of calculations based on _cameraRigParams.interaxialDistance:
                    var leftSign = (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED) ? 1 : -1;
                    var rightSign = (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED) ? -1 : 1;
                    this._getRigCamPosition(this._cameraRigParams.stereoHalfAngle * leftSign, camLeft.position);
                    this._getRigCamPosition(this._cameraRigParams.stereoHalfAngle * rightSign, camRight.position);

                    camLeft.setTarget(this.getTarget());
                    camRight.setTarget(this.getTarget());
                    break;

                case Camera.RIG_MODE_VR:
                    if (camLeft.rotationQuaternion) {
                        camLeft.rotationQuaternion.copyFrom(this.rotationQuaternion);
                        camRight.rotationQuaternion.copyFrom(this.rotationQuaternion);
                    } else {
                        camLeft.rotation.copyFrom(this.rotation);
                        camRight.rotation.copyFrom(this.rotation);
                    }
                    camLeft.position.copyFrom(this.position);
                    camRight.position.copyFrom(this.position);

                    break;
            }
            super._updateRigCameras();
        }

        private _getRigCamPosition(halfSpace: number, result: Vector3) {
            if (!this._rigCamTransformMatrix) {
                this._rigCamTransformMatrix = new Matrix();
            }
            var target = this.getTarget();
            Matrix.Translation(-target.x, -target.y, -target.z).multiplyToRef(Matrix.RotationY(halfSpace), this._rigCamTransformMatrix);

            this._rigCamTransformMatrix = this._rigCamTransformMatrix.multiply(Matrix.Translation(target.x, target.y, target.z));

            Vector3.TransformCoordinatesToRef(this.position, this._rigCamTransformMatrix, result);
        }

        public getClassName(): string {
            return "TargetCamera";
        }
    }
} 