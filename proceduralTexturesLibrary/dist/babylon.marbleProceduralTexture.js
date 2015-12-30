/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var MarbleProceduralTexture = (function (_super) {
        __extends(MarbleProceduralTexture, _super);
        function MarbleProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "marbleProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._numberOfTilesHeight = 3;
            this._numberOfTilesWidth = 3;
            this._amplitude = 9.0;
            this._marbleColor = new BABYLON.Color3(0.77, 0.47, 0.40);
            this._jointColor = new BABYLON.Color3(0.72, 0.72, 0.72);
            this.updateShaderUniforms();
        }
        MarbleProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("numberOfTilesHeight", this._numberOfTilesHeight);
            this.setFloat("numberOfTilesWidth", this._numberOfTilesWidth);
            this.setFloat("amplitude", this._amplitude);
            this.setColor3("marbleColor", this._marbleColor);
            this.setColor3("jointColor", this._jointColor);
        };
        Object.defineProperty(MarbleProceduralTexture.prototype, "numberOfTilesHeight", {
            get: function () {
                return this._numberOfTilesHeight;
            },
            set: function (value) {
                this._numberOfTilesHeight = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MarbleProceduralTexture.prototype, "amplitude", {
            get: function () {
                return this._amplitude;
            },
            set: function (value) {
                this._amplitude = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MarbleProceduralTexture.prototype, "numberOfTilesWidth", {
            get: function () {
                return this._numberOfTilesWidth;
            },
            set: function (value) {
                this._numberOfTilesWidth = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MarbleProceduralTexture.prototype, "jointColor", {
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
        Object.defineProperty(MarbleProceduralTexture.prototype, "marbleColor", {
            get: function () {
                return this._marbleColor;
            },
            set: function (value) {
                this._marbleColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return MarbleProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.MarbleProceduralTexture = MarbleProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['marbleProceduralTexturePixelShader'] = "precision highp float;\r\n\r\nvarying vec2 vPosition;\r\nvarying vec2 vUV;\r\n\r\nuniform float numberOfTilesHeight;\r\nuniform float numberOfTilesWidth;\r\nuniform float amplitude;\r\nuniform vec3 brickColor;\r\nuniform vec3 jointColor;\r\n\r\nconst vec3 tileSize = vec3(1.1, 1.0, 1.1);\r\nconst vec3 tilePct = vec3(0.98, 1.0, 0.98);\r\n\r\nfloat rand(vec2 n) {\r\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\r\n}\r\n\r\nfloat noise(vec2 n) {\r\n\tconst vec2 d = vec2(0.0, 1.0);\r\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\r\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\r\n}\r\n\r\nfloat turbulence(vec2 P)\r\n{\r\n\tfloat val = 0.0;\r\n\tfloat freq = 1.0;\r\n\tfor (int i = 0; i < 4; i++)\r\n\t{\r\n\t\tval += abs(noise(P*freq) / freq);\r\n\t\tfreq *= 2.07;\r\n\t}\r\n\treturn val;\r\n}\r\n\r\nfloat round(float number){\r\n\treturn sign(number)*floor(abs(number) + 0.5);\r\n}\r\n\r\nvec3 marble_color(float x)\r\n{\r\n\tvec3 col;\r\n\tx = 0.5*(x + 1.);\r\n\tx = sqrt(x);             \r\n\tx = sqrt(x);\r\n\tx = sqrt(x);\r\n\tcol = vec3(.2 + .75*x);  \r\n\tcol.b *= 0.95;           \r\n\treturn col;\r\n}\r\n\r\nvoid main()\r\n{\r\n\tfloat brickW = 1.0 / numberOfTilesWidth;\r\n\tfloat brickH = 1.0 / numberOfTilesHeight;\r\n\tfloat jointWPercentage = 0.01;\r\n\tfloat jointHPercentage = 0.01;\r\n\tvec3 color = brickColor;\r\n\tfloat yi = vUV.y / brickH;\r\n\tfloat nyi = round(yi);\r\n\tfloat xi = vUV.x / brickW;\r\n\r\n\tif (mod(floor(yi), 2.0) == 0.0){\r\n\t\txi = xi - 0.5;\r\n\t}\r\n\r\n\tfloat nxi = round(xi);\r\n\tvec2 brickvUV = vec2((xi - floor(xi)) / brickH, (yi - floor(yi)) / brickW);\r\n\r\n\tif (yi < nyi + jointHPercentage && yi > nyi - jointHPercentage){\r\n\t\tcolor = mix(jointColor, vec3(0.37, 0.25, 0.25), (yi - nyi) / jointHPercentage + 0.2);\r\n\t}\r\n\telse if (xi < nxi + jointWPercentage && xi > nxi - jointWPercentage){\r\n\t\tcolor = mix(jointColor, vec3(0.44, 0.44, 0.44), (xi - nxi) / jointWPercentage + 0.2);\r\n\t}\r\n\telse {\r\n\t\tfloat t = 6.28 * brickvUV.x / (tileSize.x + noise(vec2(vUV)*6.0));\r\n\t\tt += amplitude * turbulence(brickvUV.xy);\r\n\t\tt = sin(t);\r\n\t\tcolor = marble_color(t);\r\n\t}\r\n\r\n\tgl_FragColor = vec4(color, 0.0);\r\n}";
