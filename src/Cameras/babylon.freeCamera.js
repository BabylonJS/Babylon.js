var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var FreeCamera = (function (_super) {
        __extends(FreeCamera, _super);
        function FreeCamera(name, position, scene) {
            var _this = this;
            _super.call(this, name, position, scene);
            this.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
            this.checkCollisions = false;
            this.applyGravity = false;
            this.angularSensibility = 2000.0;
            this._keys = [];
            this._collider = new BABYLON.Collider();
            this._needMoveForGravity = false;
            this._oldPosition = BABYLON.Vector3.Zero();
            this._diffPosition = BABYLON.Vector3.Zero();
            this._newPosition = BABYLON.Vector3.Zero();
            this._onCollisionPositionChange = function (collisionId, newPosition, collidedMesh) {
                if (collidedMesh === void 0) { collidedMesh = null; }
                //TODO move this to the collision coordinator!
                if (_this.getScene().workerCollisions)
                    newPosition.multiplyInPlace(_this._collider.radius);
                var updatePosition = function (newPos) {
                    _this._newPosition.copyFrom(newPos);
                    _this._newPosition.subtractToRef(_this._oldPosition, _this._diffPosition);
                    var oldPosition = _this.position.clone();
                    if (_this._diffPosition.length() > BABYLON.Engine.CollisionsEpsilon) {
                        _this.position.addInPlace(_this._diffPosition);
                        if (_this.onCollide && collidedMesh) {
                            _this.onCollide(collidedMesh);
                        }
                    }
                };
                updatePosition(newPosition);
            };
        }
        FreeCamera.prototype._onLostFocus = function (e) {
            this._keys = [];
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
                    }
                    else {
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
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
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
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            _this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
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
            if (this._attachedElement !== element) {
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
            }
            else {
                globalPosition = this.position;
            }
            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
            this._collider.radius = this.ellipsoid;
            //no need for clone, as long as gravity is not on.
            var actualVelocity = velocity;
            //add gravity to the velocity to prevent the dual-collision checking
            if (this.applyGravity) {
                //this prevents mending with cameraDirection, a global variable of the free camera class.
                actualVelocity = velocity.add(this.getScene().gravity);
            }
            this.getScene().collisionCoordinator.getNewPosition(this._oldPosition, actualVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
        };
        FreeCamera.prototype._checkInputs = function () {
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
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(0, 0, speed);
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(speed, 0, 0);
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(0, 0, -speed);
                }
                this.getViewMatrix().invertToRef(this._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef(this._localDirection, this._cameraTransformMatrix, this._transformedDirection);
                this.cameraDirection.addInPlace(this._transformedDirection);
            }
            _super.prototype._checkInputs.call(this);
        };
        FreeCamera.prototype._decideIfNeedsToMove = function () {
            return this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
        };
        FreeCamera.prototype._updatePosition = function () {
            if (this.checkCollisions && this.getScene().collisionsEnabled) {
                this._collideWithWorld(this.cameraDirection);
            }
            else {
                this.position.addInPlace(this.cameraDirection);
            }
        };
        FreeCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.checkCollisions = this.checkCollisions;
            serializationObject.applyGravity = this.applyGravity;
            serializationObject.ellipsoid = this.ellipsoid.asArray();
            return serializationObject;
        };
        return FreeCamera;
    })(BABYLON.TargetCamera);
    BABYLON.FreeCamera = FreeCamera;
})(BABYLON || (BABYLON = {}));
