"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.FilterPostProcess = function (name, kernelMatrix, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "filter", ["kernelMatrix"], null, ratio, camera, samplingMode, engine, reusable);
        
        this.kernelMatrix = kernelMatrix;
        var that = this;
        this.onApply = function (effect) {
            effect.setMatrix("kernelMatrix", that.kernelMatrix);
        };
    };
    
    BABYLON.FilterPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();