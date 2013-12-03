"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PostProcess = function (name, fragmentUrl, parameters, samplers, ratio, camera, samplingMode) {
        this.name = name;
        this._camera = camera;
        this._scene = camera.getScene();
        camera.postProcesses.push(this);
        this._engine = this._scene.getEngine();
        this._renderRatio = ratio;
        this.width = -1;
        this.height = -1;
        this.renderTargetSamplingMode = samplingMode ? samplingMode : BABYLON.Texture.NEAREST_SAMPLINGMODE;

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
    BABYLON.PostProcess.prototype.activate = function () {
        var desiredWidth = this._engine._renderingCanvas.width * this._renderRatio;
        var desiredHeight = this._engine._renderingCanvas.height * this._renderRatio;
        if (this.width !== desiredWidth || this.height !== desiredHeight) {
            if (this._texture) {
                this._engine._releaseTexture(this._texture);
                this._texture = null;
            }
            this.width = desiredWidth;
            this.height = desiredHeight;
            this._texture = this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: this._camera.postProcesses.indexOf(this) === 0, samplingMode: this.renderTargetSamplingMode });
            if (this.onSizeChanged) {
                this.onSizeChanged();
            }
        }
        this._engine.bindFramebuffer(this._texture);
        
        // Clear
        this._engine.clear(this._scene.clearColor, this._scene.autoClear || this._scene.forceWireframe, true);
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
        this._effect._bindTexture("textureSampler", this._texture);
        
        // Parameters
        if (this.onApply) {
            this.onApply(this._effect);
        }

        return this._effect;
    };

    BABYLON.PostProcess.prototype.dispose = function () {
        if (this._onDispose) {
            this._onDispose();
        }
        if (this._texture) {
            this._engine._releaseTexture(this._texture);
            this._texture = null;
        }
        
        var index = this._camera.postProcesses.indexOf(this);
        this._camera.postProcesses.splice(index, 1);
        if (index == 0 && this._camera.postProcesses.length > 0) {
            this._camera.postProcesses[0].width = -1; // invalidate frameBuffer to hint the postprocess to create a depth buffer
        }
    };

})();