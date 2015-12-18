/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var FireProceduralTexture = (function (_super) {
        __extends(FireProceduralTexture, _super);
        function FireProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "fireProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._time = 0.0;
            this._speed = new BABYLON.Vector2(0.5, 0.3);
            this._autoGenerateTime = true;
            this._alphaThreshold = 0.5;
            this._fireColors = FireProceduralTexture.RedFireColors;
            this.updateShaderUniforms();
            this.refreshRate = 1;
        }
        FireProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("time", this._time);
            this.setVector2("speed", this._speed);
            this.setColor3("c1", this._fireColors[0]);
            this.setColor3("c2", this._fireColors[1]);
            this.setColor3("c3", this._fireColors[2]);
            this.setColor3("c4", this._fireColors[3]);
            this.setColor3("c5", this._fireColors[4]);
            this.setColor3("c6", this._fireColors[5]);
            this.setFloat("alphaThreshold", this._alphaThreshold);
        };
        FireProceduralTexture.prototype.render = function (useCameraPostProcess) {
            if (this._autoGenerateTime) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }
            _super.prototype.render.call(this, useCameraPostProcess);
        };
        Object.defineProperty(FireProceduralTexture, "PurpleFireColors", {
            get: function () {
                return [
                    new BABYLON.Color3(0.5, 0.0, 1.0),
                    new BABYLON.Color3(0.9, 0.0, 1.0),
                    new BABYLON.Color3(0.2, 0.0, 1.0),
                    new BABYLON.Color3(1.0, 0.9, 1.0),
                    new BABYLON.Color3(0.1, 0.1, 1.0),
                    new BABYLON.Color3(0.9, 0.9, 1.0)
                ];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FireProceduralTexture, "GreenFireColors", {
            get: function () {
                return [
                    new BABYLON.Color3(0.5, 1.0, 0.0),
                    new BABYLON.Color3(0.5, 1.0, 0.0),
                    new BABYLON.Color3(0.3, 0.4, 0.0),
                    new BABYLON.Color3(0.5, 1.0, 0.0),
                    new BABYLON.Color3(0.2, 0.0, 0.0),
                    new BABYLON.Color3(0.5, 1.0, 0.0)
                ];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FireProceduralTexture, "RedFireColors", {
            get: function () {
                return [
                    new BABYLON.Color3(0.5, 0.0, 0.1),
                    new BABYLON.Color3(0.9, 0.0, 0.0),
                    new BABYLON.Color3(0.2, 0.0, 0.0),
                    new BABYLON.Color3(1.0, 0.9, 0.0),
                    new BABYLON.Color3(0.1, 0.1, 0.1),
                    new BABYLON.Color3(0.9, 0.9, 0.9)
                ];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FireProceduralTexture, "BlueFireColors", {
            get: function () {
                return [
                    new BABYLON.Color3(0.1, 0.0, 0.5),
                    new BABYLON.Color3(0.0, 0.0, 0.5),
                    new BABYLON.Color3(0.1, 0.0, 0.2),
                    new BABYLON.Color3(0.0, 0.0, 1.0),
                    new BABYLON.Color3(0.1, 0.2, 0.3),
                    new BABYLON.Color3(0.0, 0.2, 0.9)
                ];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FireProceduralTexture.prototype, "fireColors", {
            get: function () {
                return this._fireColors;
            },
            set: function (value) {
                this._fireColors = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FireProceduralTexture.prototype, "time", {
            get: function () {
                return this._time;
            },
            set: function (value) {
                this._time = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FireProceduralTexture.prototype, "speed", {
            get: function () {
                return this._speed;
            },
            set: function (value) {
                this._speed = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FireProceduralTexture.prototype, "alphaThreshold", {
            get: function () {
                return this._alphaThreshold;
            },
            set: function (value) {
                this._alphaThreshold = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return FireProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.FireProceduralTexture = FireProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['fireProceduralTexturePixelShader'] = "precision highp float;\r\n\r\nuniform float time;\r\nuniform vec3 c1;\r\nuniform vec3 c2;\r\nuniform vec3 c3;\r\nuniform vec3 c4;\r\nuniform vec3 c5;\r\nuniform vec3 c6;\r\nuniform vec2 speed;\r\nuniform float shift;\r\nuniform float alphaThreshold;\r\n\r\nvarying vec2 vUV;\r\n\r\nfloat rand(vec2 n) {\r\n\treturn fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\r\n}\r\n\r\nfloat noise(vec2 n) {\r\n\tconst vec2 d = vec2(0.0, 1.0);\r\n\tvec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\r\n\treturn mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\r\n}\r\n\r\nfloat fbm(vec2 n) {\r\n\tfloat total = 0.0, amplitude = 1.0;\r\n\tfor (int i = 0; i < 4; i++) {\r\n\t\ttotal += noise(n) * amplitude;\r\n\t\tn += n;\r\n\t\tamplitude *= 0.5;\r\n\t}\r\n\treturn total;\r\n}\r\n\r\nvoid main() {\r\n\tvec2 p = vUV * 8.0;\r\n\tfloat q = fbm(p - time * 0.1);\r\n\tvec2 r = vec2(fbm(p + q + time * speed.x - p.x - p.y), fbm(p + q - time * speed.y));\r\n\tvec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);\r\n\tvec3 color = c * cos(shift * vUV.y);\r\n\tfloat luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));\r\n\r\n\tgl_FragColor = vec4(color, luminance * alphaThreshold + (1.0 - alphaThreshold));\r\n}";
