"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.FxaaPostProcess = function (name, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "fxaa", ["texelSize"], null, ratio, camera, samplingMode, engine, reusable);
    };
    
    BABYLON.FxaaPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);
    BABYLON.FxaaPostProcess.prototype.onSizeChanged = function () {
        this.texelWidth = 1.0 / this.width;
        this.texelHeight = 1.0 / this.height;
    };
    BABYLON.FxaaPostProcess.prototype.onApply = function (effect) {
        effect.setFloat2("texelSize", this.texelWidth, this.texelHeight);
    };
})();