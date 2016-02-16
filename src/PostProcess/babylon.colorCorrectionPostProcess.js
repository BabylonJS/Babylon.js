//
//  This post-process allows the modification of rendered colors by using
//  a 'look-up table' (LUT). This effect is also called Color Grading.
// 
//  The object needs to be provided an url to a texture containing the color
//  look-up table: the texture must be 256 pixels wide and 16 pixels high.
//  Use an image editing software to tweak the LUT to match your needs.
// 
//  For an example of a color LUT, see here:
//      http://udn.epicgames.com/Three/rsrc/Three/ColorGrading/RGBTable16x1.png
//  For explanations on color grading, see here:
//      http://udn.epicgames.com/Three/ColorGrading.html
//
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var ColorCorrectionPostProcess = (function (_super) {
        __extends(ColorCorrectionPostProcess, _super);
        function ColorCorrectionPostProcess(name, colorTableUrl, ratio, camera, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, 'colorCorrection', null, ['colorTable'], ratio, camera, samplingMode, engine, reusable);
            this._colorTableTexture = new BABYLON.Texture(colorTableUrl, camera.getScene(), true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            this._colorTableTexture.anisotropicFilteringLevel = 1;
            this._colorTableTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._colorTableTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.onApply = function (effect) {
                effect.setTexture("colorTable", _this._colorTableTexture);
            };
        }
        return ColorCorrectionPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.ColorCorrectionPostProcess = ColorCorrectionPostProcess;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.colorCorrectionPostProcess.js.map