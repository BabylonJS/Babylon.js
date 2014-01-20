"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PostProcess = function (name, fragmentUrl, parameters, samplers, ratio, camera, samplingMode, engine, reusable) {
        this.name = name;

        if (camera != null) {
            this._camera = camera;
            this._scene = camera.getScene();
            camera.attachPostProcess(this);
            this._engine = this._scene.getEngine();
        }
        else {
            this._engine = engine;
        }

        this._renderRatio = ratio;
        this.width = -1;
        this.height = -1;
        this.renderTargetSamplingMode = samplingMode ? samplingMode : BABYLON.Texture.NEAREST_SAMPLINGMODE;
        this._reusable = reusable || false;

        this._textures = new BABYLON.Tools.SmartArray(2);
        this._currentRenderTextureInd = 0;

        samplers = samplers || [];
        samplers.push("textureSampler");

        this._effect = this._engine.createEffect({ vertex: "postprocess", fragment: fragmentUrl },
            ["position"],
            parameters || [],
            samplers, "");
    };
    
    // Methods
    BABYLON.PostProcess.prototype.onApply = null;
    BABYLON.PostProcess.prototype._onDispose = null;
    BABYLON.PostProcess.prototype.onSizeChanged = null;
    BABYLON.PostProcess.prototype.onActivate = null;
    BABYLON.PostProcess.prototype.activate = function (camera) {
        camera = camera || this._camera;

        var scene = camera.getScene();
        var desiredWidth = this._engine._renderingCanvas.width * this._renderRatio;
        var desiredHeight = this._engine._renderingCanvas.height * this._renderRatio;
        if (this.width !== desiredWidth || this.height !== desiredHeight) {
            if (this._textures.length > 0) {
                for (var i = 0; i < this._textures.length; i++) {
                    this._engine._releaseTexture(this._textures.data[i]);
                }
                this._textures.reset();
            }
            this.width = desiredWidth;
            this.height = desiredHeight;
            this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === camera._postProcessesTakenIndices[0], samplingMode: this.renderTargetSamplingMode }));

            if (this._reusable) {
                this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === camera._postProcessesTakenIndices[0], samplingMode: this.renderTargetSamplingMode }));
            }

            if (this.onSizeChanged) {
                this.onSizeChanged();
            }

        }

        this._engine.bindFramebuffer(this._textures.data[this._currentRenderTextureInd]);
        
        if (this.onActivate) {
            this.onActivate(camera);
        }

        // Clear
        this._engine.clear(scene.clearColor, scene.autoClear || scene.forceWireframe, true);

        if (this._reusable) {
            this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2;
        }
    };

    BABYLON.PostProcess.prototype.apply = function () {
        // Check
        if (!this._effect.isReady())
            return null;

        // States
        this._engine.enableEffect(this._effect);
        this._engine.setState(false);
        this._engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
        this._engine.setDepthBuffer(false);
        this._engine.setDepthWrite(false);

        // Texture
        this._effect._bindTexture("textureSampler", this._textures.data[this._currentRenderTextureInd]);
        
        // Parameters
        if (this.onApply) {
            this.onApply(this._effect);
        }

        return this._effect;
    };

    BABYLON.PostProcess.prototype.dispose = function (camera) {
        camera = camera || this._camera;

        if (this._onDispose) {
            this._onDispose();
        }
        if (this._textures.length > 0) {
            for (var i = 0; i < this._textures.length; i++) {
                this._engine._releaseTexture(this._textures.data[i]);
            }
            this._textures.reset();
        }
        
        camera.detachPostProcess(this);

        var index = camera._postProcesses.indexOf(this);
        if (index === camera._postProcessesTakenIndices[0] && camera._postProcessesTakenIndices.length > 0) {
            this._camera._postProcesses[camera._postProcessesTakenIndices[0]].width = -1; // invalidate frameBuffer to hint the postprocess to create a depth buffer
        }
    };

})();