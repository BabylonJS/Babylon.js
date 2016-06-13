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
    var FreeCamera = (function (_super) {
        __extends(FreeCamera, _super);
        function FreeCamera(name, position, scene) {
            var _this = this;
            _super.call(this, name, position, scene);
            this.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
            this.checkCollisions = false;
            this.applyGravity = false;
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
            this.inputs = new BABYLON.FreeCameraInputsManager(this);
            this.inputs.addKeyboard().addMouse();
        }
        Object.defineProperty(FreeCamera.prototype, "angularSensibility", {
            //-- begin properties for backward compatibility for inputs
            get: function () {
                var mouse = this.inputs.attached["mouse"];
                if (mouse)
                    return mouse.angularSensibility;
            },
            set: function (value) {
                var mouse = this.inputs.attached["mouse"];
                if (mouse)
                    mouse.angularSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FreeCamera.prototype, "keysUp", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysUp;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysUp = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FreeCamera.prototype, "keysDown", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysDown;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysDown = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FreeCamera.prototype, "keysLeft", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysLeft;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysLeft = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FreeCamera.prototype, "keysRight", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysRight;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysRight = value;
            },
            enumerable: true,
            configurable: true
        });
        // Controls
        FreeCamera.prototype.attachControl = function (element, noPreventDefault) {
            this.inputs.attachElement(element, noPreventDefault);
        };
        FreeCamera.prototype.detachControl = function (element) {
            this.inputs.detachElement(element);
            this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
            this.cameraRotation = new BABYLON.Vector2(0, 0);
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
            this.inputs.checkInputs();
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
        FreeCamera.prototype.dispose = function () {
            this.inputs.clear();
            _super.prototype.dispose.call(this);
        };
        FreeCamera.prototype.getTypeName = function () {
            return "FreeCamera";
        };
        __decorate([
            BABYLON.serializeAsVector3()
        ], FreeCamera.prototype, "ellipsoid", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCamera.prototype, "checkCollisions", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCamera.prototype, "applyGravity", void 0);
        return FreeCamera;
    }(BABYLON.TargetCamera));
    BABYLON.FreeCamera = FreeCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.freeCamera.js.map