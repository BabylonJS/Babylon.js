var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var FreeCamera = (function (_super) {
        __extends(FreeCamera, _super);
        function FreeCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
            this.cameraRotation = new BABYLON.Vector2(0, 0);
            this.rotation = new BABYLON.Vector3(0, 0, 0);
            this.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
            this.speed = 2.0;
            this.checkCollisions = false;
            this.applyGravity = false;
            this.noRotationConstraint = false;
            this.angularSensibility = 2000.0;
            this.lockedTarget = null;
            this.onCollide = null;
            this._keys = [];
            this._collider = new BABYLON.Collider();
            this._needMoveForGravity = true;
            this._currentTarget = BABYLON.Vector3.Zero();
            this._viewMatrix = BABYLON.Matrix.Zero();
            this._camMatrix = BABYLON.Matrix.Zero();
            this._cameraTransformMatrix = BABYLON.Matrix.Zero();
            this._cameraRotationMatrix = BABYLON.Matrix.Zero();
            this._referencePoint = BABYLON.Vector3.Zero();
            this._transformedReferencePoint = BABYLON.Vector3.Zero();
            this._oldPosition = BABYLON.Vector3.Zero();
            this._diffPosition = BABYLON.Vector3.Zero();
            this._newPosition = BABYLON.Vector3.Zero();
            this._lookAtTemp = BABYLON.Matrix.Zero();
            this._tempMatrix = BABYLON.Matrix.Zero();
        }
        FreeCamera.prototype._getLockedTargetPosition = function () {
            if (!this.lockedTarget) {
                return null;
            }

            return this.lockedTarget.position || this.lockedTarget;
        };

        // Cache
        FreeCamera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.lockedTarget = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.rotation = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        };

        FreeCamera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }

            var lockedTargetPosition = this._getLockedTargetPosition();
            if (!lockedTargetPosition) {
                this._cache.lockedTarget = null;
            } else {
                if (!this._cache.lockedTarget) {
                    this._cache.lockedTarget = lockedTargetPosition.clone();
                } else {
                    this._cache.lockedTarget.copyFrom(lockedTargetPosition);
                }
            }

            this._cache.rotation.copyFrom(this.rotation);
        };

        // Synchronized
        FreeCamera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronizedViewMatrix.call(this)) {
                return false;
            }

            var lockedTargetPosition = this._getLockedTargetPosition();

            return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition) && this._cache.rotation.equals(this.rotation);
        };

        // Methods
        FreeCamera.prototype._computeLocalCameraSpeed = function () {
            return this.speed * ((BABYLON.Tools.GetDeltaTime() / (BABYLON.Tools.GetFps() * 10.0)));
        };

        // Target
        FreeCamera.prototype.setTarget = function (target) {
            this.upVector.normalize();

            BABYLON.Matrix.LookAtLHToRef(this.position, target, this.upVector, this._camMatrix);
            this._camMatrix.invert();

            this.rotation.x = Math.atan(this._camMatrix.m[6] / this._camMatrix.m[10]);

            var vDir = target.subtract(this.position);

            if (vDir.x >= 0.0) {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) + Math.PI / 2.0);
            } else {
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

        FreeCamera.prototype.getTarget = function () {
            return this._currentTarget;
        };

        // Controls
        FreeCamera.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            var previousPosition;
            var engine = this.getEngine();

            if (this._attachedElement) {
                return;
            }
            this._attachedElement = element;

            if (this._onMouseDown === undefined) {
                this._onMouseDown = function (evt) {
                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onMouseUp = function (evt) {
                    previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onMouseOut = function (evt) {
                    previousPosition = null;
                    _this._keys = [];
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onMouseMove = function (evt) {
                    if (!previousPosition && !engine.isPointerLock) {
                        return;
                    }

                    var offsetX;
                    var offsetY;

                    if (!engine.isPointerLock) {
                        offsetX = evt.clientX - previousPosition.x;
                        offsetY = evt.clientY - previousPosition.y;
                    } else {
                        offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                        offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                    }

                    _this.cameraRotation.y += offsetX / _this.angularSensibility;
                    _this.cameraRotation.x += offsetY / _this.angularSensibility;

                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onKeyDown = function (evt) {
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 || _this.keysDown.indexOf(evt.keyCode) !== -1 || _this.keysLeft.indexOf(evt.keyCode) !== -1 || _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);

                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                this._onKeyUp = function (evt) {
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 || _this.keysDown.indexOf(evt.keyCode) !== -1 || _this.keysLeft.indexOf(evt.keyCode) !== -1 || _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);

                        if (index >= 0) {
                            _this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                this._onLostFocus = function () {
                    _this._keys = [];
                };

                this._reset = function () {
                    _this._keys = [];
                    previousPosition = null;
                    _this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
                    _this.cameraRotation = new BABYLON.Vector2(0, 0);
                };
            }

            element.addEventListener("mousedown", this._onMouseDown, false);
            element.addEventListener("mouseup", this._onMouseUp, false);
            element.addEventListener("mouseout", this._onMouseOut, false);
            element.addEventListener("mousemove", this._onMouseMove, false);

            BABYLON.Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        };

        FreeCamera.prototype.detachControl = function (element) {
            if (this._attachedElement != element) {
                return;
            }

            element.removeEventListener("mousedown", this._onMouseDown);
            element.removeEventListener("mouseup", this._onMouseUp);
            element.removeEventListener("mouseout", this._onMouseOut);
            element.removeEventListener("mousemove", this._onMouseMove);

            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);

            this._attachedElement = null;
            if (this._reset) {
                this._reset();
            }
        };

        FreeCamera.prototype._collideWithWorld = function (velocity) {
            var globalPosition;

            if (this.parent) {
                globalPosition = BABYLON.Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
            } else {
                globalPosition = this.position;
            }

            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
            this._collider.radius = this.ellipsoid;

            this.getScene()._getNewPosition(this._oldPosition, velocity, this._collider, 3, this._newPosition);
            this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

            if (this._diffPosition.length() > BABYLON.Engine.CollisionsEpsilon) {
                this.position.addInPlace(this._diffPosition);
                if (this.onCollide) {
                    this.onCollide(this._collider.collidedMesh);
                }
            }
        };

        FreeCamera.prototype._checkInputs = function () {
            if (!this._localDirection) {
                this._localDirection = BABYLON.Vector3.Zero();
                this._transformedDirection = BABYLON.Vector3.Zero();
            }

            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                var speed = this._computeLocalCameraSpeed();

                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(-speed, 0, 0);
                } else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(0, 0, speed);
                } else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(speed, 0, 0);
                } else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(0, 0, -speed);
                }

                this.getViewMatrix().invertToRef(this._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef(this._localDirection, this._cameraTransformMatrix, this._transformedDirection);
                this.cameraDirection.addInPlace(this._transformedDirection);
            }
        };

        FreeCamera.prototype._update = function () {
            this._checkInputs();

            var needToMove = this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
            var needToRotate = Math.abs(this.cameraRotation.x) > 0 || Math.abs(this.cameraRotation.y) > 0;

            // Move
            if (needToMove) {
                if (this.checkCollisions && this.getScene().collisionsEnabled) {
                    this._collideWithWorld(this.cameraDirection);

                    if (this.applyGravity) {
                        var oldPosition = this.position;
                        this._collideWithWorld(this.getScene().gravity);
                        this._needMoveForGravity = (BABYLON.Vector3.DistanceSquared(oldPosition, this.position) != 0);
                    }
                } else {
                    this.position.addInPlace(this.cameraDirection);
                }
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

        FreeCamera.prototype._getViewMatrix = function () {
            BABYLON.Vector3.FromFloatsToRef(0, 0, 1, this._referencePoint);

            if (!this.lockedTarget) {
                // Compute
                if (this.upVector.x != 0 || this.upVector.y != 1.0 || this.upVector.z != 0) {
                    BABYLON.Matrix.LookAtLHToRef(BABYLON.Vector3.Zero(), this._referencePoint, this.upVector, this._lookAtTemp);
                    BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);

                    this._lookAtTemp.multiplyToRef(this._cameraRotationMatrix, this._tempMatrix);
                    this._lookAtTemp.invert();
                    this._tempMatrix.multiplyToRef(this._lookAtTemp, this._cameraRotationMatrix);
                } else {
                    BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
                }

                BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);

                // Computing target and final matrix
                this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
            } else {
                this._currentTarget.copyFrom(this._getLockedTargetPosition());
            }

            BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTarget, this.upVector, this._viewMatrix);
            return this._viewMatrix;
        };
        return FreeCamera;
    })(BABYLON.Camera);
    BABYLON.FreeCamera = FreeCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.freeCamera.js.map
