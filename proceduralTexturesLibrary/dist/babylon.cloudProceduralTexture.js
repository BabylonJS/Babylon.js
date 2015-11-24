/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var CloudProceduralTexture = (function (_super) {
        __extends(CloudProceduralTexture, _super);
        function CloudProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "cloudProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._skyColor = new BABYLON.Color4(0.15, 0.68, 1.0, 1.0);
            this._cloudColor = new BABYLON.Color4(1, 1, 1, 1.0);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }
        CloudProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setColor4("skyColor", this._skyColor);
            this.setColor4("cloudColor", this._cloudColor);
        };
        Object.defineProperty(CloudProceduralTexture.prototype, "skyColor", {
            get: function () {
                return this._skyColor;
            },
            set: function (value) {
                this._skyColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CloudProceduralTexture.prototype, "cloudColor", {
            get: function () {
                return this._cloudColor;
            },
            set: function (value) {
                this._cloudColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return CloudProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.CloudProceduralTexture = CloudProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['cloudProceduralTexturePixelShader'] = "precision highp float;\r\n\r\nvarying vec2 vUV;\r\n\r\nuniform vec4 skyColor;\r\nuniform vec4 cloudColor;\r\n\r\nfloat rand(vec2 n) {\r\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\r\n}\r\n\r\nfloat noise(vec2 n) {\r\n\tconst vec2 d = vec2(0.0, 1.0);\r\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\r\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\r\n}\r\n\r\nfloat fbm(vec2 n) {\r\n\tfloat total = 0.0, amplitude = 1.0;\r\n\tfor (int i = 0; i < 4; i++) {\r\n\t\ttotal += noise(n) * amplitude;\r\n\t\tn += n;\r\n\t\tamplitude *= 0.5;\r\n\t}\r\n\treturn total;\r\n}\r\n\r\nvoid main() {\r\n\r\n\tvec2 p = vUV * 12.0;\r\n\tvec4 c = mix(skyColor, cloudColor, fbm(p));\r\n\tgl_FragColor = c;\r\n\r\n}\r\n\r\n";
