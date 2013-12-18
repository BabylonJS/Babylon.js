"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Camera = function (name, position, scene) {
        this.name = name;
        this.id = name;
        this.position = position;
        this.upVector = BABYLON.Vector3.Up();
        this._childrenFlag = true;

        this._scene = scene;

        scene.cameras.push(this);

        if (!scene.activeCamera) {
            scene.activeCamera = this;
        }

        this._computedViewMatrix = BABYLON.Matrix.Identity();

        // Animations
        this.animations = [];

        // Postprocesses
        this.postProcesses = [];
        
        // Viewport
        this.viewport = new BABYLON.Viewport(0, 0, 1.0, 1.0);
    };

    BABYLON.Camera.prototype = Object.create(BABYLON.Node.prototype);

    // Statics
    BABYLON.Camera.PERSPECTIVE_CAMERA = 0;
    BABYLON.Camera.ORTHOGRAPHIC_CAMERA = 1;

    // Members
    BABYLON.Camera.prototype.orthoLeft = null;
    BABYLON.Camera.prototype.orthoRight = null;
    BABYLON.Camera.prototype.orthoBottom = null;
    BABYLON.Camera.prototype.orthoTop = null;
    BABYLON.Camera.prototype.fov = 0.8;
    BABYLON.Camera.prototype.minZ = 0.1;
    BABYLON.Camera.prototype.maxZ = 1000.0;
    BABYLON.Camera.prototype.inertia = 0.9;
    BABYLON.Camera.prototype.mode = BABYLON.Camera.PERSPECTIVE_CAMERA;

    // Properties
    BABYLON.Camera.prototype.getScene = function () {
        return this._scene;
    };

    // Methods
    BABYLON.Camera.prototype.attachControl = function (canvas) {
    };

    BABYLON.Camera.prototype.detachControl = function (canvas) {
    };

    BABYLON.Camera.prototype._update = function () {
    };

    BABYLON.Camera.prototype.getWorldMatrix = function () {
        var viewMatrix = this.getViewMatrix();

        if (!this._worldMatrix) {
            this._worldMatrix = BABYLON.Matrix.Identity();
        }

        viewMatrix.invertToRef(this._worldMatrix);

        return this._worldMatrix;
    };

    BABYLON.Camera.prototype._getViewMatrix = function () {
        return BABYLON.Matrix.Identity();
    };

    BABYLON.Camera.prototype.getViewMatrix = function () {
        this._computedViewMatrix = this._getViewMatrix();

        if (this.parent && this.parent.getWorldMatrix) {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }

            this._computedViewMatrix.invertToRef(this._worldMatrix);

            this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._computedViewMatrix);

            this._computedViewMatrix.invert();

            return this._computedViewMatrix;
        }

        return this._computedViewMatrix;
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

    BABYLON.Camera.prototype.dispose = function () {
        // Remove from scene
        var index = this._scene.cameras.indexOf(this);
        this._scene.cameras.splice(index, 1);
        
        // Postprocesses
        while (this.postProcesses.length) {
            this.postProcesses[0].dispose();
        }
    };
})();