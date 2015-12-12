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
            this.refreshRate = 0;
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

BABYLON.Effect.ShadersStore['marbleProceduralTexturePixelShader'] = "precision highp float;\n\nvarying vec2 vPosition;\nvarying vec2 vUV;\n\nuniform float numberOfTilesHeight;\nuniform float numberOfTilesWidth;\nuniform float amplitude;\nuniform vec3 brickColor;\nuniform vec3 jointColor;\n\nconst vec3 tileSize = vec3(1.1, 1.0, 1.1);\nconst vec3 tilePct = vec3(0.98, 1.0, 0.98);\n\nfloat rand(vec2 n) {\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nfloat noise(vec2 n) {\n\tconst vec2 d = vec2(0.0, 1.0);\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\n}\n\nfloat turbulence(vec2 P)\n{\n\tfloat val = 0.0;\n\tfloat freq = 1.0;\n\tfor (int i = 0; i < 4; i++)\n\t{\n\t\tval += abs(noise(P*freq) / freq);\n\t\tfreq *= 2.07;\n\t}\n\treturn val;\n}\n\nfloat round(float number){\n\treturn sign(number)*floor(abs(number) + 0.5);\n}\n\nvec3 marble_color(float x)\n{\n\tvec3 col;\n\tx = 0.5*(x + 1.);\n\tx = sqrt(x);             \n\tx = sqrt(x);\n\tx = sqrt(x);\n\tcol = vec3(.2 + .75*x);  \n\tcol.b *= 0.95;           \n\treturn col;\n}\n\nvoid main()\n{\n\tfloat brickW = 1.0 / numberOfTilesWidth;\n\tfloat brickH = 1.0 / numberOfTilesHeight;\n\tfloat jointWPercentage = 0.01;\n\tfloat jointHPercentage = 0.01;\n\tvec3 color = brickColor;\n\tfloat yi = vUV.y / brickH;\n\tfloat nyi = round(yi);\n\tfloat xi = vUV.x / brickW;\n\n\tif (mod(floor(yi), 2.0) == 0.0){\n\t\txi = xi - 0.5;\n\t}\n\n\tfloat nxi = round(xi);\n\tvec2 brickvUV = vec2((xi - floor(xi)) / brickH, (yi - floor(yi)) / brickW);\n\n\tif (yi < nyi + jointHPercentage && yi > nyi - jointHPercentage){\n\t\tcolor = mix(jointColor, vec3(0.37, 0.25, 0.25), (yi - nyi) / jointHPercentage + 0.2);\n\t}\n\telse if (xi < nxi + jointWPercentage && xi > nxi - jointWPercentage){\n\t\tcolor = mix(jointColor, vec3(0.44, 0.44, 0.44), (xi - nxi) / jointWPercentage + 0.2);\n\t}\n\telse {\n\t\tfloat t = 6.28 * brickvUV.x / (tileSize.x + noise(vec2(vUV)*6.0));\n\t\tt += amplitude * turbulence(brickvUV.xy);\n\t\tt = sin(t);\n\t\tcolor = marble_color(t);\n\t}\n\n\tgl_FragColor = vec4(color, 0.0);\n}";
