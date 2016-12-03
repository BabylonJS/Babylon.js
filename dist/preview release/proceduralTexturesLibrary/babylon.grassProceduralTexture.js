/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var GrassProceduralTexture = (function (_super) {
        __extends(GrassProceduralTexture, _super);
        function GrassProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "grassProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._herb1 = new BABYLON.Color3(0.29, 0.38, 0.02);
            this._herb2 = new BABYLON.Color3(0.36, 0.49, 0.09);
            this._herb3 = new BABYLON.Color3(0.51, 0.6, 0.28);
            this._groundColor = new BABYLON.Color3(1, 1, 1);
            this._grassColors = [
                new BABYLON.Color3(0.29, 0.38, 0.02),
                new BABYLON.Color3(0.36, 0.49, 0.09),
                new BABYLON.Color3(0.51, 0.6, 0.28)
            ];
            this.updateShaderUniforms();
        }
        GrassProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setColor3("herb1Color", this._grassColors[0]);
            this.setColor3("herb2Color", this._grassColors[1]);
            this.setColor3("herb3Color", this._grassColors[2]);
            this.setColor3("groundColor", this._groundColor);
        };
        Object.defineProperty(GrassProceduralTexture.prototype, "grassColors", {
            get: function () {
                return this._grassColors;
            },
            set: function (value) {
                this._grassColors = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GrassProceduralTexture.prototype, "groundColor", {
            get: function () {
                return this._groundColor;
            },
            set: function (value) {
                this.groundColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return GrassProceduralTexture;
    }(BABYLON.ProceduralTexture));
    BABYLON.GrassProceduralTexture = GrassProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.grassProceduralTexture.js.map

BABYLON.Effect.ShadersStore['grassProceduralTexturePixelShader'] = "precision highp float;\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform vec3 herb1Color;\nuniform vec3 herb2Color;\nuniform vec3 herb3Color;\nuniform vec3 groundColor;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main(void) {\nvec3 color=mix(groundColor,herb1Color,rand(gl_FragCoord.xy*4.0));\ncolor=mix(color,herb2Color,rand(gl_FragCoord.xy*8.0));\ncolor=mix(color,herb3Color,rand(gl_FragCoord.xy));\ncolor=mix(color,herb1Color,fbm(gl_FragCoord.xy*16.0));\ngl_FragColor=vec4(color,1.0);\n}";
