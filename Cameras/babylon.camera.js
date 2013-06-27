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
    
    // Members
    BABYLON.Camera.prototype.fov = 0.8;
    BABYLON.Camera.prototype.minZ = 0.1;
    BABYLON.Camera.prototype.maxZ = 1000.0;
    BABYLON.Camera.prototype.inertia = 0.9;

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
        return new BABYLON.Matrix.PerspectiveFovLH(this.fov, this._scene.getEngine().getAspectRatio(), this.minZ, this.maxZ);
    };

})();