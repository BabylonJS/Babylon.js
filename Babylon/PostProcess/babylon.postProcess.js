var BABYLON = BABYLON || {};

(function () {
    BABYLON.PostProcess = function (name, fragmentUrl, parameters, samplers, ratio, camera) {
        this.name = name;
        this._camera = camera;
        this._scene = camera.getScene();
        camera.postProcesses.push(this);
        this._engine = this._scene.getEngine();

        this.width = this._engine._renderingCanvas.width * ratio;
        this.height = this._engine._renderingCanvas.height * ratio;
        
        this._texture = this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, false);

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

    BABYLON.PostProcess.prototype.activate = function() {
        this._engine.bindFramebuffer(this._texture);
    };

    BABYLON.PostProcess.prototype.apply = function () {
        // Check
        if (!this._effect.isReady())
            return null;

        // Render
        this._engine.enableEffect(this._effect);
        this._engine.setState(false);
        this._engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);

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

        this._engine._releaseTexture(this._texture);
        
        var index = this._camera.postProcesses.indexOf(this);
        this._camera.postProcesses.splice(index, 1);
    };

})();