var BABYLON = BABYLON || {};

(function () {
    BABYLON.Camera = function (name, position, scene) {
        this.name = name;
        this.id = name;
        this.position = position;
       
        this._scene = scene;

        scene.cameras.push(this);

        if (!scene.activeCamera) {
            scene.activeCamera = this;
        }
    };
    
    // Statics
    BABYLON.Camera.PERSPECTIVE_CAMERA = 0;
    BABYLON.Camera.ORTHOGRAPHIC_CAMERA = 1;
    
    // Members
    BABYLON.Camera.prototype.fov = 0.8;
    BABYLON.Camera.prototype.orthoLeft = null;
    BABYLON.Camera.prototype.orthoRight = null;
    BABYLON.Camera.prototype.orthoBottom = null;
    BABYLON.Camera.prototype.orthoTop = null;
    BABYLON.Camera.prototype.fov = 0.8;
    BABYLON.Camera.prototype.minZ = 0.1;
    BABYLON.Camera.prototype.maxZ = 1000.0;
    BABYLON.Camera.prototype.inertia = 0.9;
    BABYLON.Camera.prototype.mode = BABYLON.Camera.PERSPECTIVE_CAMERA;

    // Methods
    BABYLON.Camera.prototype.attachControl = function (canvas) {
    };

    BABYLON.Camera.prototype.detachControl = function (canvas) {
    };

    BABYLON.Camera.prototype._update = function () {
    };

    BABYLON.Camera.prototype.getViewMatrix = function () {
        return BABYLON.Matrix.Identity();
    };

    BABYLON.Camera.prototype.getProjectionMatrix = function () {
        if (!this._projectionMatrix) {
            this._projectionMatrix = new BABYLON.Matrix();
        }

        var engine = this._scene.getEngine();
        if (this.mode === BABYLON.Camera.PERSPECTIVE_CAMERA) {
            BABYLON.Matrix.PerspectiveFovLHToRef(this.fov, engine.getAspectRatio(), this.minZ, this.maxZ, this._projectionMatrix);
            return this._projectionMatrix;
        }

        var halfWidth = engine.getRenderWidth() / 2.0;
        var halfHeight = engine.getRenderHeight() / 2.0;
        BABYLON.Matrix.OrthoOffCenterLHToRef(this.orthoLeft || -halfWidth, this.orthoRight || halfWidth, this.orthoBottom || -halfHeight, this.orthoTop || halfHeight, this.minZ, this.maxZ, this._projectionMatrix);
        return this._projectionMatrix;
    };
})();