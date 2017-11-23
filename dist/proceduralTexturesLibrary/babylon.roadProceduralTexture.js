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
    var RoadProceduralTexture = (function (_super) {
        __extends(RoadProceduralTexture, _super);
        function RoadProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            var _this = _super.call(this, name, size, "roadProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
            _this._roadColor = new BABYLON.Color3(0.53, 0.53, 0.53);
            _this.updateShaderUniforms();
            return _this;
        }
        RoadProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setColor3("roadColor", this._roadColor);
        };
        Object.defineProperty(RoadProceduralTexture.prototype, "roadColor", {
            get: function () {
                return this._roadColor;
            },
            set: function (value) {
                this._roadColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return RoadProceduralTexture;
    }(BABYLON.ProceduralTexture));
    BABYLON.RoadProceduralTexture = RoadProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.roadProceduralTexture.js.map

BABYLON.Effect.ShadersStore['roadProceduralTexturePixelShader'] = "precision highp float;\nvarying vec2 vUV; \nuniform vec3 roadColor;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main(void) {\nfloat ratioy=mod(gl_FragCoord.y*100.0 ,fbm(vUV*2.0));\nvec3 color=roadColor*ratioy;\ngl_FragColor=vec4(color,1.0);\n}";
