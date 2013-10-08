var BABYLON = BABYLON || {};

(function () {
    BABYLON.DeviceOrientationCamera = function (name, position, scene) {
        this.name = name;
        this.id = name;

        this._scene = scene;
        this.position = position;
        scene.cameras.push(this);
        this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
        this.cameraRotation = new BABYLON.Vector2(0, 0);
        this.rotation = new BABYLON.Vector3(0, 0, 0);
        this.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
        this.angularSensibility = 200000.0;
        this.moveSensibility = 500.0;

        if (!scene.activeCamera) {
            scene.activeCamera = this;
        }
        // Collisions
        this._collider = new BABYLON.Collider();
        this._needMoveForGravity = true;
        
        // Offset
        this._offsetX = null;
        this._offsetY = null;
        this._orientationGamma = 0;
        this._orientationBeta = 0;
        this._initialOrientationGamma = 0;
        this._initialOrientationBeta = 0;
        
        // Animations
        this.animations = [];
        
        // Internals
        this._cameraRotationMatrix = new BABYLON.Matrix();
        this._referencePoint = BABYLON.Vector3.Zero();
        this._currentTarget = BABYLON.Vector3.Zero();
        this._transformedReferencePoint = BABYLON.Vector3.Zero();
        this._viewMatrix = BABYLON.Matrix.Zero();
        this._upVector = BABYLON.Vector3.Up();
        this._oldPosition = BABYLON.Vector3.Zero();
        this._diffPosition = BABYLON.Vector3.Zero();
        this._newPosition = BABYLON.Vector3.Zero();
    };

    BABYLON.DeviceOrientationCamera.prototype = Object.create(BABYLON.FreeCamera.prototype);

    // Controls
    BABYLON.DeviceOrientationCamera.prototype.attachControl = function (canvas, noPreventDefault) {
        if (this._attachedCanvas) {
            return;
        }
        this._attachedCanvas = canvas;

        if (!this._orientationChanged) {
            this._orientationChanged = function (evt) {
                
                if (!this._initialOrientationGamma) {
                    this._initialOrientationGamma = evt.gamma;
                    this._initialOrientationBeta = evt.beta;
                }

                this._orientationGamma = evt.gamma;
                this._orientationBeta = evt.beta;

                this._offsetY = (this._initialOrientationBeta - this._orientationBeta) * 0.05;
                this._offsetX = (this._initialOrientationGamma - this._orientationGamma) * -0.05;
            };
        }

        window.addEventListener("deviceorientation", this._orientationChanged);
    };

    BABYLON.DeviceOrientationCamera.prototype.detachControl = function (canvas) {
        if (this._attachedCanvas != canvas) {
            return;
        }

        window.removeEventListener("deviceorientation", this._orientationChanged);
        
        this._attachedCanvas = null;
        this._orientationGamma = 0;
        this._orientationBeta = 0;
        this._initialOrientationGamma = 0;
        this._initialOrientationBeta = 0;
    };
    
    BABYLON.DeviceOrientationCamera.prototype._checkInputs = function () {
        if (!this._offsetX) {
            return;
        }
        this.cameraRotation.y += this._offsetX / this.angularSensibility;

        if (this._pointerPressed.length > 1) {
            this.cameraRotation.x += -this._offsetY / this.angularSensibility;
        } else {
            var speed = this._computeLocalCameraSpeed();
            var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.moveSensibility);

            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
            this.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
        }
    };
})();