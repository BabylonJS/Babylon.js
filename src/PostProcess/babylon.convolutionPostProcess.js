var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var ConvolutionPostProcess = (function (_super) {
        __extends(ConvolutionPostProcess, _super);
        function ConvolutionPostProcess(name, kernel, ratio, camera, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, "convolution", ["kernel", "screenSize"], null, ratio, camera, samplingMode, engine, reusable);
            this.kernel = kernel;
            this.onApply = function (effect) {
                effect.setFloat2("screenSize", _this.width, _this.height);
                effect.setArray("kernel", _this.kernel);
            };
        }
        // Statics
        // Based on http://en.wikipedia.org/wiki/Kernel_(image_processing)
        ConvolutionPostProcess.EdgeDetect0Kernel = [1, 0, -1, 0, 0, 0, -1, 0, 1];
        ConvolutionPostProcess.EdgeDetect1Kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
        ConvolutionPostProcess.EdgeDetect2Kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
        ConvolutionPostProcess.SharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        ConvolutionPostProcess.EmbossKernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
        ConvolutionPostProcess.GaussianKernel = [0, 1, 0, 1, 1, 1, 0, 1, 0];
        return ConvolutionPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.ConvolutionPostProcess = ConvolutionPostProcess;
})(BABYLON || (BABYLON = {}));
