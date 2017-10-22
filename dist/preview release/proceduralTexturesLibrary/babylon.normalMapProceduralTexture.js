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
    var NormalMapProceduralTexture = (function (_super) {
        __extends(NormalMapProceduralTexture, _super);
        function NormalMapProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            var _this = _super.call(this, name, size, "normalMapProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
            _this.updateShaderUniforms();
            return _this;
        }
        NormalMapProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setTexture("baseSampler", this._baseTexture);
            this.setFloat("size", this.getRenderSize());
        };
        NormalMapProceduralTexture.prototype.render = function (useCameraPostProcess) {
            _super.prototype.render.call(this, useCameraPostProcess);
        };
        NormalMapProceduralTexture.prototype.resize = function (size, generateMipMaps) {
            _super.prototype.resize.call(this, size, generateMipMaps);
            // We need to update the "size" uniform
            this.updateShaderUniforms();
        };
        Object.defineProperty(NormalMapProceduralTexture.prototype, "baseTexture", {
            get: function () {
                return this._baseTexture;
            },
            set: function (texture) {
                this._baseTexture = texture;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return NormalMapProceduralTexture;
    }(BABYLON.ProceduralTexture));
    BABYLON.NormalMapProceduralTexture = NormalMapProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.normalMapProceduralTexture.js.map

BABYLON.Effect.ShadersStore['normalMapProceduralTexturePixelShader'] = "precision highp float;\n\nuniform sampler2D baseSampler;\nuniform float size;\n\nvarying vec2 vUV;\n\nconst vec3 LUMA_COEFFICIENT=vec3(0.2126,0.7152,0.0722);\nfloat lumaAtCoord(vec2 coord)\n{\nvec3 pixel=texture2D(baseSampler,coord).rgb;\nfloat luma=dot(pixel,LUMA_COEFFICIENT);\nreturn luma;\n}\nvoid main()\n{\nfloat lumaU0=lumaAtCoord(vUV+vec2(-1.0,0.0)/size);\nfloat lumaU1=lumaAtCoord(vUV+vec2( 1.0,0.0)/size);\nfloat lumaV0=lumaAtCoord(vUV+vec2( 0.0,-1.0)/size);\nfloat lumaV1=lumaAtCoord(vUV+vec2( 0.0,1.0)/size);\nvec2 slope=(vec2(lumaU0-lumaU1,lumaV0-lumaV1)+1.0)*0.5;\ngl_FragColor=vec4(slope,1.0,1.0);\n}\n";
