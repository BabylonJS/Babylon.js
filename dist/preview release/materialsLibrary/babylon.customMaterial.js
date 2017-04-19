/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var CustomShaderHelper = (function () {
        function CustomShaderHelper() {
        }
        return CustomShaderHelper;
    }());
    BABYLON.CustomShaderHelper = CustomShaderHelper;
    var CustomMaterial = (function (_super) {
        __extends(CustomMaterial, _super);
        function CustomMaterial(name, builder, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this._mainPart = 'void main(void) {';
            _this._diffusePart = 'vec3 diffuseColor=vDiffuseColor.rgb;';
            _this._vertexPositionPart = 'gl_Position=viewProjection*finalWorld*vec4(position,1.0);';
            _this.builder = builder;
            _this.customShaderNameResolve = function (shaderName) {
                return _this.builder(new CustomShaderHelper(), shaderName, _this._mainPart, _this._diffusePart, _this._vertexPositionPart);
            };
            return _this;
        }
        return CustomMaterial;
    }(BABYLON.StandardMaterial));
    BABYLON.CustomMaterial = CustomMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.customMaterial.js.map
