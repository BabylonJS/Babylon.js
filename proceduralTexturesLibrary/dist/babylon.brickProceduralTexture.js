/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var BrickProceduralTexture = (function (_super) {
        __extends(BrickProceduralTexture, _super);
        function BrickProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "brickProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._numberOfBricksHeight = 15;
            this._numberOfBricksWidth = 5;
            this._jointColor = new BABYLON.Color3(0.72, 0.72, 0.72);
            this._brickColor = new BABYLON.Color3(0.77, 0.47, 0.40);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }
        BrickProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("numberOfBricksHeight", this._numberOfBricksHeight);
            this.setFloat("numberOfBricksWidth", this._numberOfBricksWidth);
            this.setColor3("brickColor", this._brickColor);
            this.setColor3("jointColor", this._jointColor);
        };
        Object.defineProperty(BrickProceduralTexture.prototype, "numberOfBricksHeight", {
            get: function () {
                return this._numberOfBricksHeight;
            },
            set: function (value) {
                this._numberOfBricksHeight = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BrickProceduralTexture.prototype, "numberOfBricksWidth", {
            get: function () {
                return this._numberOfBricksWidth;
            },
            set: function (value) {
                this._numberOfBricksWidth = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BrickProceduralTexture.prototype, "jointColor", {
            get: function () {
                return this._jointColor;
            },
            set: function (value) {
                this._jointColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BrickProceduralTexture.prototype, "brickColor", {
            get: function () {
                return this._brickColor;
            },
            set: function (value) {
                this._brickColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return BrickProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.BrickProceduralTexture = BrickProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['brickProceduralTexturePixelShader'] = "precision highp float;\r\n\r\nvarying vec2 vPosition;\r\nvarying vec2 vUV;\r\n\r\nuniform float numberOfBricksHeight;\r\nuniform float numberOfBricksWidth;\r\nuniform vec3 brickColor;\r\nuniform vec3 jointColor;\r\n\r\nfloat rand(vec2 n) {\r\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\r\n}\r\n\r\nfloat noise(vec2 n) {\r\n\tconst vec2 d = vec2(0.0, 1.0);\r\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\r\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\r\n}\r\n\r\nfloat fbm(vec2 n) {\r\n\tfloat total = 0.0, amplitude = 1.0;\r\n\tfor (int i = 0; i < 4; i++) {\r\n\t\ttotal += noise(n) * amplitude;\r\n\t\tn += n;\r\n\t\tamplitude *= 0.5;\r\n\t}\r\n\treturn total;\r\n}\r\n\r\nfloat round(float number){\r\n\treturn sign(number)*floor(abs(number) + 0.5);\r\n}\r\n\r\nvoid main(void)\r\n{\r\n\tfloat brickW = 1.0 / numberOfBricksWidth;\r\n\tfloat brickH = 1.0 / numberOfBricksHeight;\r\n\tfloat jointWPercentage = 0.01;\r\n\tfloat jointHPercentage = 0.05;\r\n\tvec3 color = brickColor;\r\n\tfloat yi = vUV.y / brickH;\r\n\tfloat nyi = round(yi);\r\n\tfloat xi = vUV.x / brickW;\r\n\r\n\tif (mod(floor(yi), 2.0) == 0.0){\r\n\t\txi = xi - 0.5;\r\n\t}\r\n\r\n\tfloat nxi = round(xi);\r\n\tvec2 brickvUV = vec2((xi - floor(xi)) / brickH, (yi - floor(yi)) /  brickW);\r\n\r\n\tif (yi < nyi + jointHPercentage && yi > nyi - jointHPercentage){\r\n\t\tcolor = mix(jointColor, vec3(0.37, 0.25, 0.25), (yi - nyi) / jointHPercentage + 0.2);\r\n\t}\r\n\telse if (xi < nxi + jointWPercentage && xi > nxi - jointWPercentage){\r\n\t\tcolor = mix(jointColor, vec3(0.44, 0.44, 0.44), (xi - nxi) / jointWPercentage + 0.2);\r\n\t}\r\n\telse {\r\n\t\tfloat brickColorSwitch = mod(floor(yi) + floor(xi), 3.0);\r\n\r\n\t\tif (brickColorSwitch == 0.0)\r\n\t\t\tcolor = mix(color, vec3(0.33, 0.33, 0.33), 0.3);\r\n\t\telse if (brickColorSwitch == 2.0)\r\n\t\t\tcolor = mix(color, vec3(0.11, 0.11, 0.11), 0.3);\r\n\t}\r\n\r\n\tgl_FragColor = vec4(color, 1.0);\r\n}";
