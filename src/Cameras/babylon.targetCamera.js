var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var TargetCamera = (function (_super) {
        __extends(TargetCamera, _super);
        function TargetCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
            this.cameraRotation = new BABYLON.Vector2(0, 0);
            this.rotation = new BABYLON.Vector3(0, 0, 0);
            this.speed = 2.0;
            this.noRotationConstraint = false;
            this.lockedTarget = null;
            this._currentTarget = BABYLON.Vector3.Zero();
            this._viewMatrix = BABYLON.Matrix.Zero();
            this._camMatrix = BABYLON.Matrix.Zero();
            this._cameraTransformMatrix = BABYLON.Matrix.Zero();
            this._cameraRotationMatrix = BABYLON.Matrix.Zero();
            this._referencePoint = new BABYLON.Vector3(0, 0, 1);
            this._transformedReferencePoint = BABYLON.Vector3.Zero();
            this._lookAtTemp = BABYLON.Matrix.Zero();
            this._tempMatrix = BABYLON.Matrix.Zero();
        }
        TargetCamera.prototype.getFrontPosition = function (distance) {
            var direction = this.getTarget().subtract(this.position);
            direction.normalize();
            direction.scaleInPlace(distance);
            return this.globalPosition.add(direction);
        };
        TargetCamera.prototype._getLockedTargetPosition = function () {
            if (!this.lockedTarget) {
                return null;
            }
            return this.lockedTarget.position || this.lockedTarget;
        };
        // Cache
        TargetCamera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.lockedTarget = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.rotation = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        };
        TargetCamera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
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
        };
        // Synchronized
        TargetCamera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronizedViewMatrix.call(this)) {
                return false;
            }
            var lockedTargetPosition = this._getLockedTargetPosition();
            return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition)
                && this._cache.rotation.equals(this.rotation);
        };
        // Methods
        TargetCamera.prototype._computeLocalCameraSpeed = function () {
            var engine = this.getEngine();
            return this.speed * ((engine.getDeltaTime() / (engine.getFps() * 10.0)));
        };
        // Target
        TargetCamera.prototype.setTarget = function (target) {
            this.upVector.normalize();
            BABYLON.Matrix.LookAtLHToRef(this.position, target, this.upVector, this._camMatrix);
            this._camMatrix.invert();
            this.rotation.x = Math.atan(this._camMatrix.m[6] / this._camMatrix.m[10]);
            var vDir = target.subtract(this.position);
            if (vDir.x >= 0.0) {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) + Math.PI / 2.0);
            }
            else {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) - Math.PI / 2.0);
            }
            this.rotation.z = -Math.acos(BABYLON.Vector3.Dot(new BABYLON.Vector3(0, 1.0, 0), this.upVector));
            if (isNaN(this.rotation.x)) {
                this.rotation.x = 0;
            }
            if (isNaN(this.rotation.y)) {
                this.rotation.y = 0;
            }
            if (isNaN(this.rotation.z)) {
                this.rotation.z = 0;
            }
        };
        TargetCamera.prototype.getTarget = function () {
            return this._currentTarget;
        };
        TargetCamera.prototype._decideIfNeedsToMove = function () {
            return Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
        };
        TargetCamera.prototype._updatePosition = function () {
            this.position.addInPlace(this.cameraDirection);
        };
        TargetCamera.prototype._checkInputs = function () {
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
                if (Math.abs(this.cameraDirection.x) < BABYLON.Epsilon) {
                    this.cameraDirection.x = 0;
                }
                if (Math.abs(this.cameraDirection.y) < BABYLON.Epsilon) {
                    this.cameraDirection.y = 0;
                }
                if (Math.abs(this.cameraDirection.z) < BABYLON.Epsilon) {
                    this.cameraDirection.z = 0;
                }
                this.cameraDirection.scaleInPlace(this.inertia);
            }
            if (needToRotate) {
                if (Math.abs(this.cameraRotation.x) < BABYLON.Epsilon) {
                    this.cameraRotation.x = 0;
                }
                if (Math.abs(this.cameraRotation.y) < BABYLON.Epsilon) {
                    this.cameraRotation.y = 0;
                }
                this.cameraRotation.scaleInPlace(this.inertia);
            }
            _super.prototype._checkInputs.call(this);
        };
        TargetCamera.prototype._getViewMatrix = function () {
            if (!this.lockedTarget) {
                // Compute
                if (this.upVector.x !== 0 || this.upVector.y !== 1.0 || this.upVector.z !== 0) {
                    BABYLON.Matrix.LookAtLHToRef(BABYLON.Vector3.Zero(), this._referencePoint, this.upVector, this._lookAtTemp);
                    BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
                    this._lookAtTemp.multiplyToRef(this._cameraRotationMatrix, this._tempMatrix);
                    this._lookAtTemp.invert();
                    this._tempMatrix.multiplyToRef(this._lookAtTemp, this._cameraRotationMatrix);
                }
                else {
                    BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);
                // Computing target and final matrix
                this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
            }
            else {
                this._currentTarget.copyFrom(this._getLockedTargetPosition());
            }
            BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTarget, this.upVector, this._viewMatrix);
            return this._viewMatrix;
        };
        TargetCamera.prototype._getVRViewMatrix = function () {
            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
            BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);
            BABYLON.Vector3.TransformNormalToRef(this.upVector, this._cameraRotationMatrix, this._cameraRigParams.vrActualUp);
            // Computing target and final matrix
            this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
            BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTarget, this._cameraRigParams.vrActualUp, this._cameraRigParams.vrWorkMatrix);
            this._cameraRigParams.vrWorkMatrix.multiplyToRef(this._cameraRigParams.vrPreViewMatrix, this._viewMatrix);
            return this._viewMatrix;
        };
        /**
         * @override
         * Override Camera.createRigCamera
         */
        TargetCamera.prototype.createRigCamera = function (name, cameraIndex) {
            if (this.cameraRigMode !== BABYLON.Camera.RIG_MODE_NONE) {
                var rigCamera = new TargetCamera(name, this.position.clone(), this.getScene());
                if (this.cameraRigMode === BABYLON.Camera.RIG_MODE_VR) {
                    rigCamera._cameraRigParams = {};
                    rigCamera._cameraRigParams.vrActualUp = new BABYLON.Vector3(0, 0, 0);
                    rigCamera._getViewMatrix = rigCamera._getVRViewMatrix;
                }
                return rigCamera;
            }
            return null;
        };
        /**
         * @override
         * Override Camera._updateRigCameras
         */
        TargetCamera.prototype._updateRigCameras = function () {
            var camLeft = this._rigCameras[0];
            var camRight = this._rigCameras[1];
            switch (this.cameraRigMode) {
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                    //provisionnaly using _cameraRigParams.stereoHalfAngle instead of calculations based on _cameraRigParams.interaxialDistance:
                    var leftSign = (this.cameraRigMode === BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED) ? 1 : -1;
                    var rightSign = (this.cameraRigMode === BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED) ? -1 : 1;
                    this._getRigCamPosition(this._cameraRigParams.stereoHalfAngle * leftSign, camLeft.position);
                    this._getRigCamPosition(this._cameraRigParams.stereoHalfAngle * rightSign, camRight.position);
                    camLeft.setTarget(this.getTarget());
                    camRight.setTarget(this.getTarget());
                    break;
                case BABYLON.Camera.RIG_MODE_VR:
                    camLeft.rotation.x = camRight.rotation.x = this.rotation.x;
                    camLeft.rotation.y = camRight.rotation.y = this.rotation.y;
                    camLeft.rotation.z = camRight.rotation.z = this.rotation.z;
                    camLeft.position.copyFrom(this.position);
                    camRight.position.copyFrom(this.position);
                    break;
            }
            _super.prototype._updateRigCameras.call(this);
        };
        TargetCamera.prototype._getRigCamPosition = function (halfSpace, result) {
            if (!this._rigCamTransformMatrix) {
                this._rigCamTransformMatrix = new BABYLON.Matrix();
            }
            var target = this.getTarget();
            BABYLON.Matrix.Translation(-target.x, -target.y, -target.z).multiplyToRef(BABYLON.Matrix.RotationY(halfSpace), this._rigCamTransformMatrix);
            this._rigCamTransformMatrix = this._rigCamTransformMatrix.multiply(BABYLON.Matrix.Translation(target.x, target.y, target.z));
            BABYLON.Vector3.TransformCoordinatesToRef(this.position, this._rigCamTransformMatrix, result);
        };
        TargetCamera.prototype.getTypeName = function () {
            return "TargetCamera";
        };
        __decorate([
            BABYLON.serializeAsVector3()
        ], TargetCamera.prototype, "rotation", void 0);
        __decorate([
            BABYLON.serialize()
        ], TargetCamera.prototype, "speed", void 0);
        __decorate([
            BABYLON.serializeAsMeshReference("lockedTargetId")
        ], TargetCamera.prototype, "lockedTarget", void 0);
        return TargetCamera;
    })(BABYLON.Camera);
    BABYLON.TargetCamera = TargetCamera;
})(BABYLON || (BABYLON = {}));
