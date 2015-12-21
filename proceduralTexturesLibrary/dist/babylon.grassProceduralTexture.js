/// <reference path="../../../dist/preview release/babylon.d.ts"/>

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
            this.refreshRate = 0;
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
    })(BABYLON.ProceduralTexture);
    BABYLON.GrassProceduralTexture = GrassProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['grassProceduralTexturePixelShader'] = "precision highp float;\n\nvarying vec2 vPosition;\nvarying vec2 vUV;\n\nuniform vec3 herb1Color;\nuniform vec3 herb2Color;\nuniform vec3 herb3Color;\nuniform vec3 groundColor;\n\nfloat rand(vec2 n) {\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nfloat noise(vec2 n) {\n\tconst vec2 d = vec2(0.0, 1.0);\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\n}\n\nfloat fbm(vec2 n) {\n\tfloat total = 0.0, amplitude = 1.0;\n\tfor (int i = 0; i < 4; i++) {\n\t\ttotal += noise(n) * amplitude;\n\t\tn += n;\n\t\tamplitude *= 0.5;\n\t}\n\treturn total;\n}\n\nvoid main(void) {\n\tvec3 color = mix(groundColor, herb1Color, rand(gl_FragCoord.xy * 4.0));\n\tcolor = mix(color, herb2Color, rand(gl_FragCoord.xy * 8.0));\n\tcolor = mix(color, herb3Color, rand(gl_FragCoord.xy));\n\tcolor = mix(color, herb1Color, fbm(gl_FragCoord.xy * 16.0));\n\tgl_FragColor = vec4(color, 1.0);\n}";
