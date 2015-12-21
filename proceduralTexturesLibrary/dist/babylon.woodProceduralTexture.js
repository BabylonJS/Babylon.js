/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var WoodProceduralTexture = (function (_super) {
        __extends(WoodProceduralTexture, _super);
        function WoodProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "woodProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._ampScale = 100.0;
            this._woodColor = new BABYLON.Color3(0.32, 0.17, 0.09);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }
        WoodProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("ampScale", this._ampScale);
            this.setColor3("woodColor", this._woodColor);
        };
        Object.defineProperty(WoodProceduralTexture.prototype, "ampScale", {
            get: function () {
                return this._ampScale;
            },
            set: function (value) {
                this._ampScale = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WoodProceduralTexture.prototype, "woodColor", {
            get: function () {
                return this._woodColor;
            },
            set: function (value) {
                this._woodColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return WoodProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.WoodProceduralTexture = WoodProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['woodProceduralTexturePixelShader'] = "precision highp float;\n\nvarying vec2 vPosition;\nvarying vec2 vUV;\n\nuniform float ampScale;\nuniform vec3 woodColor;\n\nfloat rand(vec2 n) {\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nfloat noise(vec2 n) {\n\tconst vec2 d = vec2(0.0, 1.0);\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\n}\n\nfloat fbm(vec2 n) {\n\tfloat total = 0.0, amplitude = 1.0;\n\tfor (int i = 0; i < 4; i++) {\n\t\ttotal += noise(n) * amplitude;\n\t\tn += n;\n\t\tamplitude *= 0.5;\n\t}\n\treturn total;\n}\n\nvoid main(void) {\n\tfloat ratioy = mod(vUV.x * ampScale, 2.0 + fbm(vUV * 0.8));\n\tvec3 wood = woodColor * ratioy;\n\tgl_FragColor = vec4(wood, 1.0);\n}";
