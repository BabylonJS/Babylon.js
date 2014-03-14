"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.ConvolutionPostProcess = function (name, kernel, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "convolution", ["kernel", "screenSize"], null, ratio, camera, samplingMode, engine, reusable);
        
        this.kernel = kernel;
        var that = this;
        this.onApply = function (effect) {
            effect.setFloat2("screenSize", that.width, that.height);
            effect.setArray("kernel", that.kernel);
        };
    };
    
    BABYLON.ConvolutionPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);
    
    // Based on http://en.wikipedia.org/wiki/Kernel_(image_processing)
    BABYLON.ConvolutionPostProcess.EdgeDetect0Kernel = [1, 0, -1, 0, 0, 0, -1, 0, 1];
    BABYLON.ConvolutionPostProcess.EdgeDetect1Kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
    BABYLON.ConvolutionPostProcess.EdgeDetect2Kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
    BABYLON.ConvolutionPostProcess.SharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    BABYLON.ConvolutionPostProcess.EmbossKernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
    BABYLON.ConvolutionPostProcess.GaussianKernel = [0, 1, 0, 1, 1, 1, 0, 1, 0];

})();