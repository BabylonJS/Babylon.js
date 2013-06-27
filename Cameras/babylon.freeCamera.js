var BABYLON = BABYLON || {};

(function () {
    BABYLON.FreeCamera = function (name, position, scene) {
        this.name = name;
        this.id = name;

        this._scene = scene;
        this.position = position;
        scene.cameras.push(this);
        this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
        this.cameraRotation = new BABYLON.Vector2(0, 0);
        this.rotation = new BABYLON.Vector3(0, 0, 0);
        this.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);

        this._keys = [];
        this.keysUp = [38];
        this.keysDown = [40];
        this.keysLeft = [37];
        this.keysRight = [39];

        if (!scene.activeCamera) {
            scene.activeCamera = this;
        }
        // Collisions
        this._collider = new BABYLON.Collider();
        this._needMoveForGravity = true;
        
        // Animations
        this.animations = [];
    };

    BABYLON.FreeCamera.prototype = Object.create(BABYLON.Camera.prototype);

    // Members
    BABYLON.FreeCamera.prototype.speed = 2.0;
    BABYLON.FreeCamera.prototype.checkCollisions = false;
    BABYLON.FreeCamera.prototype.applyGravity = false;

    // Methods
    BABYLON.FreeCamera.prototype._computeLocalCameraSpeed = function () {
        return this.speed * ((BABYLON.Tools.GetDeltaTime() / (BABYLON.Tools.GetFps() * 10.0)));
    };

    // Target
    BABYLON.FreeCamera.prototype.setTarget = function (target) {
        var camMatrix = BABYLON.Matrix.LookAtLH(this.position, target, BABYLON.Vector3.Up());
        camMatrix.invert();

        this.rotation.x = Math.atan(camMatrix.m[6] / camMatrix.m[10]);

        var vDir = target.subtract(this.position);

        if (vDir.x >= 0.0) {
            this.rotation.y = (-Math.atan(vDir.z / vDir.x) + Math.PI / 2.0);
        } else {
            this.rotation.y = (-Math.atan(vDir.z / vDir.x) - Math.PI / 2.0);
        }

        this.rotation.z = -Math.acos(BABYLON.Vector3.Dot(new BABYLON.Vector3(0, 1.0, 0), BABYLON.Vector3.Up()));

        if (isNaN(this.rotation.x))
            this.rotation.x = 0;

        if (isNaN(this.rotation.y))
            this.rotation.y = 0;

        if (isNaN(this.rotation.z))
            this.rotation.z = 0;
    };

    // Controls
    BABYLON.FreeCamera.prototype.attachControl = function (canvas) {
        var previousPosition;
        var that = this;

        this._onMouseDown = function (evt) {
            previousPosition = {
                x: evt.clientX,
                y: evt.clientY
            };

            evt.preventDefault();
        };

        this._onMouseUp = function (evt) {
            previousPosition = null;
            evt.preventDefault();
        };

        this._onMouseOut = function (evt) {
            previousPosition = null;
            that._keys = [];
            evt.preventDefault();
        };

        this._onMouseMove = function (evt) {
            if (!previousPosition) {
                return;
            }

            var offsetX = evt.clientX - previousPosition.x;
            var offsetY = evt.clientY - previousPosition.y;

            that.cameraRotation.y += offsetX / 2000.0;
            that.cameraRotation.x += offsetY / 2000.0;

            previousPosition = {
                x: evt.clientX,
                y: evt.clientY
            };
            evt.preventDefault();
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
                evt.preventDefault();
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
                evt.preventDefault();
            }
        };

        this._onLostFocus = function () {
            that._keys = [];
        };

        canvas.addEventListener("mousedown", this._onMouseDown, true);
        canvas.addEventListener("mouseup", this._onMouseUp, true);
        canvas.addEventListener("mouseout", this._onMouseOut, true);
        canvas.addEventListener("mousemove", this._onMouseMove, true);
        window.addEventListener("keydown", this._onKeyDown, true);
        window.addEventListener("keyup", this._onKeyUp, true);
        window.addEventListener("blur", this._onLostFocus, true);
    };

    BABYLON.FreeCamera.prototype.detachControl = function (canvas) {
        canvas.removeEventListener("mousedown", this._onMouseDown);
        canvas.removeEventListener("mouseup", this._onMouseUp);
        canvas.removeEventListener("mouseout", this._onMouseOut);
        canvas.removeEventListener("mousemove", this._onMouseMove);
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
        window.removeEventListener("blur", this._onLostFocus);
    };

    BABYLON.FreeCamera.prototype._collideWithWorld = function (velocity) {
        var oldPosition = this.position.subtract(new BABYLON.Vector3(0, this.ellipsoid.y, 0));
        this._collider.radius = this.ellipsoid;

        var newPosition = this._scene._getNewPosition(oldPosition, velocity, this._collider, 3);
        var diffPosition = newPosition.subtract(oldPosition);

        if (diffPosition.length() > BABYLON.Engine.collisionsEpsilon) {
            this.position = this.position.add(diffPosition);
        }
    };

    BABYLON.FreeCamera.prototype._checkInputs = function () {
        // Keyboard
        for (var index = 0; index < this._keys.length; index++) {
            var keyCode = this._keys[index];
            var direction;
            var speed = this._computeLocalCameraSpeed();

            if (this.keysLeft.indexOf(keyCode) !== -1) {
                direction = new BABYLON.Vector3(-speed, 0, 0);
            } else if (this.keysUp.indexOf(keyCode) !== -1) {
                direction = new BABYLON.Vector3(0, 0, speed);
            } else if (this.keysRight.indexOf(keyCode) !== -1) {
                direction = new BABYLON.Vector3(speed, 0, 0);
            } else if (this.keysDown.indexOf(keyCode) !== -1) {
                direction = new BABYLON.Vector3(0, 0, -speed);
            }

            var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);
            this.cameraDirection = this.cameraDirection.add(BABYLON.Vector3.TransformCoordinates(direction, cameraTransform));
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
                    this._needMoveForGravity = (oldPosition.subtract(this.position).length() != 0);
                }
            } else {
                this.position = this.position.add(this.cameraDirection);
            }
        }

        // Rotate
        if (needToRotate) {
            this.rotation.x += this.cameraRotation.x;
            this.rotation.y += this.cameraRotation.y;

            var limit = (Math.PI / 2) * 0.95;

            if (this.rotation.x > limit)
                this.rotation.x = limit;
            if (this.rotation.x < -limit)
                this.rotation.x = -limit;
        }

        // Inertia
        if (needToMove) {
            this.cameraDirection = this.cameraDirection.scale(this.inertia);
        }
        if (needToRotate) {
            this.cameraRotation = this.cameraRotation.scale(this.inertia);
        }
    };

    BABYLON.FreeCamera.prototype.getViewMatrix = function () {
        // Compute
        var referencePoint = new BABYLON.Vector3(0, 0, 1);
        var transform = BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);

        var currentTarget = this.position.add(BABYLON.Vector3.TransformCoordinates(referencePoint, transform));

        return new BABYLON.Matrix.LookAtLH(this.position, currentTarget, BABYLON.Vector3.Up());
    };
})();