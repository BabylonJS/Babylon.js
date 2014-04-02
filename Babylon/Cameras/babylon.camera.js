"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Camera = function (name, position, scene) {
        BABYLON.Node.call(this, scene);
        
        this.name = name;
        this.id = name;
        this.position = position;
        this.upVector = BABYLON.Vector3.Up();

        scene.cameras.push(this);

        if (!scene.activeCamera) {
            scene.activeCamera = this;
        }

        this._computedViewMatrix = BABYLON.Matrix.Identity();
        this._projectionMatrix = new BABYLON.Matrix();

        // Animations
        this.animations = [];

        // Postprocesses
        this._postProcesses = [];
        this._postProcessesTakenIndices = [];

        // Viewport
        this.viewport = new BABYLON.Viewport(0, 0, 1.0, 1.0);

        //Cache
        BABYLON.Camera.prototype._initCache.call(this);
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

    //Cache
    BABYLON.Camera.prototype._initCache = function () {
        this._cache.position = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cache.upVector = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

        this._cache.mode = undefined;
        this._cache.minZ = undefined;
        this._cache.maxZ = undefined;

        this._cache.fov = undefined;
        this._cache.aspectRatio = undefined;

        this._cache.orthoLeft = undefined;
        this._cache.orthoRight = undefined;
        this._cache.orthoBottom = undefined;
        this._cache.orthoTop = undefined;
        this._cache.renderWidth = undefined;
        this._cache.renderHeight = undefined;
    };

    BABYLON.Camera.prototype._updateCache = function (ignoreParentClass) {
        if (!ignoreParentClass) {
            BABYLON.Node.prototype._updateCache.call(this);
        }

        var engine = this._scene.getEngine();

        this._cache.position.copyFrom(this.position);
        this._cache.upVector.copyFrom(this.upVector);

        this._cache.mode = this.mode;
        this._cache.minZ = this.minZ;
        this._cache.maxZ = this.maxZ;

        this._cache.fov = this.fov;
        this._cache.aspectRatio = engine.getAspectRatio(this);

        this._cache.orthoLeft = this.orthoLeft;
        this._cache.orthoRight = this.orthoRight;
        this._cache.orthoBottom = this.orthoBottom;
        this._cache.orthoTop = this.orthoTop;
        this._cache.renderWidth = engine.getRenderWidth();
        this._cache.renderHeight = engine.getRenderHeight();
    };

    BABYLON.Camera.prototype._updateFromScene = function () {
        this.updateCache();
        this._update();
    };

    // Synchronized
    BABYLON.Camera.prototype._isSynchronized = function () {
        return this._isSynchronizedViewMatrix() && this._isSynchronizedProjectionMatrix();
    };

    BABYLON.Camera.prototype._isSynchronizedViewMatrix = function () {
        if (!BABYLON.Node.prototype._isSynchronized.call(this))
            return false;

        return this._cache.position.equals(this.position)
            && this._cache.upVector.equals(this.upVector)
            && this.isSynchronizedWithParent();
    };

    BABYLON.Camera.prototype._isSynchronizedProjectionMatrix = function () {
        var check = this._cache.mode === this.mode
             && this._cache.minZ === this.minZ
             && this._cache.maxZ === this.maxZ;
             
        if (!check) {
            return false;
        }

        var engine = this._scene.getEngine();

        if (this.mode === BABYLON.Camera.PERSPECTIVE_CAMERA) {
            check = this._cache.fov === this.fov
                 && this._cache.aspectRatio === engine.getAspectRatio(this);
        }
        else {
            check = this._cache.orthoLeft === this.orthoLeft
                 && this._cache.orthoRight === this.orthoRight
                 && this._cache.orthoBottom === this.orthoBottom
                 && this._cache.orthoTop === this.orthoTop
                 && this._cache.renderWidth === engine.getRenderWidth()
                 && this._cache.renderHeight === engine.getRenderHeight();
        }

        return check;
    };

    // Controls
    BABYLON.Camera.prototype.attachControl = function (canvas) {
    };
    
    BABYLON.Camera.prototype.detachControl = function (canvas) {
    };

    BABYLON.Camera.prototype._update = function () {
    };
    
    BABYLON.Camera.prototype.attachPostProcess = function (postProcess, insertAt) {
        if (!postProcess._reusable && this._postProcesses.indexOf(postProcess) > -1) {
            console.error("You're trying to reuse a post process not defined as reusable.");
            return;
        }

        if (insertAt == null || insertAt < 0) {
            this._postProcesses.push(postProcess);
            this._postProcessesTakenIndices.push(this._postProcesses.length - 1);

            return this._postProcesses.length - 1;
        }

        var add = 0;

        if (this._postProcesses[insertAt]) {

            var start = this._postProcesses.length - 1;


            for (var i = start; i >= insertAt + 1; --i) {
                this._postProcesses[i + 1] = this._postProcesses[i];
            }

            add = 1;
        }

        for (var i = 0; i < this._postProcessesTakenIndices.length; ++i) {
            if (this._postProcessesTakenIndices[i] < insertAt) {
                continue;
            }

            var start = this._postProcessesTakenIndices.length - 1;
            for (var j = start; j >= i; --j) {
                this._postProcessesTakenIndices[j + 1] = this._postProcessesTakenIndices[j] + add;
            }
            this._postProcessesTakenIndices[i] = insertAt;
            break;
        }

        if (!add && this._postProcessesTakenIndices.indexOf(insertAt) == -1) {
            this._postProcessesTakenIndices.push(insertAt);
        }

        var result = insertAt + add;

        this._postProcesses[result] = postProcess;

        return result;
    };

    BABYLON.Camera.prototype.detachPostProcess = function (postProcess, atIndices) {
        var result = [];


        if (!atIndices) {

            var length = this._postProcesses.length;

            for (var i = 0; i < length; i++) {

                if (this._postProcesses[i] !== postProcess) {
                    continue;
                }

                delete this._postProcesses[i];

                var index = this._postProcessesTakenIndices.indexOf(i);
                this._postProcessesTakenIndices.splice(index, 1);
            }

        }
        else {
            atIndices = (atIndices instanceof Array) ? atIndices : [atIndices];
            for (var i = 0; i < atIndices.length; i++) {
                var foundPostProcess = this._postProcesses[atIndices[i]];

                if (foundPostProcess !== postProcess) {
                    result.push(i);
                    continue;
                }

                delete this._postProcesses[atIndices[i]];

                var index = this._postProcessesTakenIndices.indexOf(atIndices[i]);
                this._postProcessesTakenIndices.splice(index, 1);
            }
        }
        return result;
    };

    BABYLON.Camera.prototype.getWorldMatrix = function () {
        if (!this._worldMatrix) {
            this._worldMatrix = BABYLON.Matrix.Identity();
        }
        
        var viewMatrix = this.getViewMatrix();

        viewMatrix.invertToRef(this._worldMatrix);

        return this._worldMatrix;
    };

    BABYLON.Camera.prototype._getViewMatrix = function () {
        return BABYLON.Matrix.Identity();
    };

    BABYLON.Camera.prototype.getViewMatrix = function () {
        this._computedViewMatrix = this._computeViewMatrix();

        if (!this.parent
            || !this.parent.getWorldMatrix
            || this.isSynchronized()) {
            return this._computedViewMatrix;
        }

        if (!this._worldMatrix) {
            this._worldMatrix = BABYLON.Matrix.Identity();
        }
        
        this._computedViewMatrix.invertToRef(this._worldMatrix);

        this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._computedViewMatrix);

        this._computedViewMatrix.invert();

        return this._computedViewMatrix;
    };
    
    BABYLON.Camera.prototype._computeViewMatrix = function (force) {
        if (!force && this._isSynchronizedViewMatrix()) {
            this._currentRenderId = this._scene.getRenderId();
            return this._computedViewMatrix;
        }

        this._computedViewMatrix = this._getViewMatrix();
        return this._computedViewMatrix;
    };

    BABYLON.Camera.prototype.getProjectionMatrix = function (force) {
        if (!force && this._isSynchronizedProjectionMatrix()) {
            return this._projectionMatrix;
        }

        var engine = this._scene.getEngine();
        if (this.mode === BABYLON.Camera.PERSPECTIVE_CAMERA) {
            BABYLON.Matrix.PerspectiveFovLHToRef(this.fov, engine.getAspectRatio(this), this.minZ, this.maxZ, this._projectionMatrix);
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
        for (var i = 0; i < this._postProcessesTakenIndices.length; ++i) {
            this._postProcesses[this._postProcessesTakenIndices[i]].dispose(this);
        }
    };
})();