var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
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
            return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition) && this._cache.rotation.equals(this.rotation);
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
        TargetCamera.prototype._update = function () {
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
                if (Math.abs(this.cameraDirection.x) < BABYLON.Engine.Epsilon) {
                    this.cameraDirection.x = 0;
                }
                if (Math.abs(this.cameraDirection.y) < BABYLON.Engine.Epsilon) {
                    this.cameraDirection.y = 0;
                }
                if (Math.abs(this.cameraDirection.z) < BABYLON.Engine.Epsilon) {
                    this.cameraDirection.z = 0;
                }
                this.cameraDirection.scaleInPlace(this.inertia);
            }
            if (needToRotate) {
                if (Math.abs(this.cameraRotation.x) < BABYLON.Engine.Epsilon) {
                    this.cameraRotation.x = 0;
                }
                if (Math.abs(this.cameraRotation.y) < BABYLON.Engine.Epsilon) {
                    this.cameraRotation.y = 0;
                }
                this.cameraRotation.scaleInPlace(this.inertia);
            }
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
        return TargetCamera;
    })(BABYLON.Camera);
    BABYLON.TargetCamera = TargetCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.targetCamera.js.map