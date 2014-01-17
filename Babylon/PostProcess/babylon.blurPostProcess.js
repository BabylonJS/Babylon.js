"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.BlurPostProcess = function (name, direction, blurWidth, ratio, camera, samplingMode, engine, reusable) {
        
        if (samplingMode === undefined) {
            samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE;
        }

        BABYLON.PostProcess.call(this, name, "blur", ["screenSize", "direction", "blurWidth"], null, ratio, camera, samplingMode, engine, reusable);

        this.direction = direction;
        this.blurWidth = blurWidth;
        var that = this;
        this.onApply = function (effect) {
            effect.setFloat2("screenSize", that.width, that.height);
            effect.setVector2("direction", that.direction);
            effect.setFloat("blurWidth", that.blurWidth);
        };
    };
    
    BABYLON.BlurPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();