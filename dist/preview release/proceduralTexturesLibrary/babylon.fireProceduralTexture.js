/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
    }(BABYLON.ProceduralTexture));
    BABYLON.FireProceduralTexture = FireProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.fireProceduralTexture.js.map

BABYLON.Effect.ShadersStore['fireProceduralTexturePixelShader'] = "precision highp float;\nuniform float time;\nuniform vec3 c1;\nuniform vec3 c2;\nuniform vec3 c3;\nuniform vec3 c4;\nuniform vec3 c5;\nuniform vec3 c6;\nuniform vec2 speed;\nuniform float shift;\nuniform float alphaThreshold;\nvarying vec2 vUV;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main() {\nvec2 p=vUV*8.0;\nfloat q=fbm(p-time*0.1);\nvec2 r=vec2(fbm(p+q+time*speed.x-p.x-p.y),fbm(p+q-time*speed.y));\nvec3 c=mix(c1,c2,fbm(p+r))+mix(c3,c4,r.x)-mix(c5,c6,r.y);\nvec3 color=c*cos(shift*vUV.y);\nfloat luminance=dot(color.rgb,vec3(0.3,0.59,0.11));\ngl_FragColor=vec4(color,luminance*alphaThreshold+(1.0-alphaThreshold));\n}";
