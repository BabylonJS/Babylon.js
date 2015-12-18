/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var RoadProceduralTexture = (function (_super) {
        __extends(RoadProceduralTexture, _super);
        function RoadProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "roadProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._roadColor = new BABYLON.Color3(0.53, 0.53, 0.53);
            this.updateShaderUniforms();
            this.refreshRate = 0;
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
    })(BABYLON.ProceduralTexture);
    BABYLON.RoadProceduralTexture = RoadProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['roadProceduralTexturePixelShader'] = "precision highp float;\r\n\r\nvarying vec2 vUV;                    \r\nuniform vec3 roadColor;\r\n\r\nfloat rand(vec2 n) {\r\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\r\n}\r\n\r\nfloat noise(vec2 n) {\r\n\tconst vec2 d = vec2(0.0, 1.0);\r\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\r\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\r\n}\r\n\r\nfloat fbm(vec2 n) {\r\n\tfloat total = 0.0, amplitude = 1.0;\r\n\tfor (int i = 0; i < 4; i++) {\r\n\t\ttotal += noise(n) * amplitude;\r\n\t\tn += n;\r\n\t\tamplitude *= 0.5;\r\n\t}\r\n\treturn total;\r\n}\r\n\r\nvoid main(void) {\r\n\tfloat ratioy = mod(gl_FragCoord.y * 100.0 , fbm(vUV * 2.0));\r\n\tvec3 color = roadColor * ratioy;\r\n\tgl_FragColor = vec4(color, 1.0);\r\n}";
