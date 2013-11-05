var BABYLON = BABYLON || {};

(function () {
    BABYLON.RefractionPostProcess = function (name, refractionTextureUrl, color, depth, colorLevel, ratio, camera, samplingMode) {
        BABYLON.PostProcess.call(this, name, "refraction", ["baseColor", "depth", "colorLevel"], ["refractionSampler"], ratio, camera, samplingMode);

        this.color = color;
        this.depth = depth;
        this.colorLevel = colorLevel;
        this._refRexture = new BABYLON.Texture(refractionTextureUrl, camera.getScene());
        
        var that = this;
        this.onApply = function (effect) {
            effect.setColor3("baseColor", that.color);
            effect.setFloat("depth", that.depth);
            effect.setFloat("colorLevel", that.colorLevel);

            effect.setTexture("refractionSampler", that._refRexture);
        };
    };
    
    BABYLON.RefractionPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);
    
    // Methods
    BABYLON.RefractionPostProcess.prototype._onDispose = function () {
        this._refRexture.dispose();
    };

})();