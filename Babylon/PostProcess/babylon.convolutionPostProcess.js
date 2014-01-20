"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.ConvolutionPostProcess = function (name, kernelMatrix, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "convolution", ["kernelMatrix"], null, ratio, camera, samplingMode, engine, reusable);
        
        this.kernelMatrix = kernelMatrix;
        var that = this;
        this.onApply = function (effect) {
            effect.setMatrix("kernelMatrix", that.kernelMatrix);
        };
    };
    
    BABYLON.ConvolutionPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();