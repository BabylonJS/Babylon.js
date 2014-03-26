"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.FreeCamera = function (name, position, scene) {
        BABYLON.Camera.call(this, name, position, scene);

        this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
        this.cameraRotation = new BABYLON.Vector2(0, 0);
        this.rotation = new BABYLON.Vector3(0, 0, 0);
        this.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);

        this._keys = [];
        this.keysUp = [38];
        this.keysDown = [40];
        this.keysLeft = [37];
        this.keysRight = [39];

        // Collisions
        this._collider = new BABYLON.Collider();
        this._needMoveForGravity = true;

        // Internals
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

        BABYLON.FreeCamera.prototype._initCache.call(this);
    };

    BABYLON.FreeCamera.prototype = Object.create(BABYLON.Camera.prototype);

    // Members
    BABYLON.FreeCamera.prototype.speed = 2.0;
    BABYLON.FreeCamera.prototype.checkCollisions = false;
    BABYLON.FreeCamera.prototype.applyGravity = false;
    BABYLON.FreeCamera.prototype.noRotationConstraint = false;
    BABYLON.FreeCamera.prototype.angularSensibility = 2000.0;
    BABYLON.FreeCamera.prototype.lockedTarget = null;
    BABYLON.FreeCamera.prototype.onCollide = null;

    BABYLON.FreeCamera.prototype._getLockedTargetPosition = function () {
        if (!this.lockedTarget) {
            return null;
        }

        return this.lockedTarget.position || this.lockedTarget;
    };

    // Cache
    BABYLON.FreeCamera.prototype._initCache = function () {
        this._cache.lockedTarget = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cache.rotation = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    };

    BABYLON.FreeCamera.prototype._updateCache = function (ignoreParentClass) {
        if (!ignoreParentClass)
            BABYLON.Camera.prototype._updateCache.call(this);

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
    BABYLON.FreeCamera.prototype._isSynchronizedViewMatrix = function () {
        if (!BABYLON.Camera.prototype._isSynchronizedViewMatrix.call(this)) {
            return false;
        }

        var lockedTargetPosition = this._getLockedTargetPosition();

        return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition)
            && this._cache.rotation.equals(this.rotation);
    };

    // Methods
    BABYLON.FreeCamera.prototype._computeLocalCameraSpeed = function () {
        return this.speed * ((BABYLON.Tools.GetDeltaTime() / (BABYLON.Tools.GetFps() * 10.0)));
    };

    // Target
    BABYLON.FreeCamera.prototype.setTarget = function (target) {
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

    // Controls
    BABYLON.FreeCamera.prototype.attachControl = function (canvas, noPreventDefault) {
        var previousPosition;
        var that = this;
        var engine = this._scene.getEngine();

        if (this._attachedCanvas) {
            return;
        }
        this._attachedCanvas = canvas;

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
                that._keys = [];
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

                that.cameraRotation.y += offsetX / that.angularSensibility;
                that.cameraRotation.x += offsetY / that.angularSensibility;

                previousPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._onKeyDown = function (evt) {
                if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
                    that.keysDown.indexOf(evt.keyCode) !== -1 ||
                    that.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    that.keysRight.indexOf(evt.keyCode) !== -1) {
                    var index = that._keys.indexOf(evt.keyCode);

                    if (index === -1) {
                        that._keys.push(evt.keyCode);
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
            };

            this._onKeyUp = function (evt) {
                if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
                    that.keysDown.indexOf(evt.keyCode) !== -1 ||
                    that.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    that.keysRight.indexOf(evt.keyCode) !== -1) {
                    var index = that._keys.indexOf(evt.keyCode);

                    if (index >= 0) {
                        that._keys.splice(index, 1);
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
            };

            this._onLostFocus = function () {
                that._keys = [];
            };

            this._reset = function () {
                that._keys = [];
                previousPosition = null;
                that.cameraDirection = new BABYLON.Vector3(0, 0, 0);
                that.cameraRotation = new BABYLON.Vector2(0, 0);
            };
        }

        canvas.addEventListener("mousedown", this._onMouseDown, false);
        canvas.addEventListener("mouseup", this._onMouseUp, false);
        canvas.addEventListener("mouseout", this._onMouseOut, false);
        canvas.addEventListener("mousemove", this._onMouseMove, false);
        window.addEventListener("keydown", this._onKeyDown, false);
        window.addEventListener("keyup", this._onKeyUp, false);
        window.addEventListener("blur", this._onLostFocus, false);
    };

    BABYLON.FreeCamera.prototype.detachControl = function (canvas) {
        if (this._attachedCanvas != canvas) {
            return;
        }

        canvas.removeEventListener("mousedown", this._onMouseDown);
        canvas.removeEventListener("mouseup", this._onMouseUp);
        canvas.removeEventListener("mouseout", this._onMouseOut);
        canvas.removeEventListener("mousemove", this._onMouseMove);
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
        window.removeEventListener("blur", this._onLostFocus);

        this._attachedCanvas = null;
        if (this._reset) {
            this._reset();
        }
    };

    BABYLON.FreeCamera.prototype._collideWithWorld = function (velocity) {
        this.position.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
        this._collider.radius = this.ellipsoid;

        this._scene._getNewPosition(this._oldPosition, velocity, this._collider, 3, this._newPosition);
        this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

        if (this._diffPosition.length() > BABYLON.Engine.collisionsEpsilon) {
            this.position.addInPlace(this._diffPosition);
            if (this.onCollide) {
                this.onCollide(this._collider.collidedMesh);
            }
        }
    };

    BABYLON.FreeCamera.prototype._checkInputs = function () {
        if (!this._localDirection) {
            this._localDirection = BABYLON.Vector3.Zero();
            this._transformedDirection = BABYLON.Vector3.Zero();
        }

        // Keyboard
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

    BABYLON.FreeCamera.prototype._update = function () {
        this._checkInputs();

        var needToMove = this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
        var needToRotate = Math.abs(this.cameraRotation.x) > 0 || Math.abs(this.cameraRotation.y) > 0;

        // Move
        if (needToMove) {
            if (this.checkCollisions && this._scene.collisionsEnabled) {
                this._collideWithWorld(this.cameraDirection);


                if (this.applyGravity) {
                    var oldPosition = this.position;
                    this._collideWithWorld(this._scene.gravity);
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
            if (Math.abs(this.cameraDirection.x) < BABYLON.Engine.epsilon)
                this.cameraDirection.x = 0;

            if (Math.abs(this.cameraDirection.y) < BABYLON.Engine.epsilon)
                this.cameraDirection.y = 0;

            if (Math.abs(this.cameraDirection.z) < BABYLON.Engine.epsilon)
                this.cameraDirection.z = 0;

            this.cameraDirection.scaleInPlace(this.inertia);
        }
        if (needToRotate) {
            if (Math.abs(this.cameraRotation.x) < BABYLON.Engine.epsilon)
                this.cameraRotation.x = 0;

            if (Math.abs(this.cameraRotation.y) < BABYLON.Engine.epsilon)
                this.cameraRotation.y = 0;

            this.cameraRotation.scaleInPlace(this.inertia);
        }
    };

    BABYLON.FreeCamera.prototype._getViewMatrix = function () {
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
})();

