/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var StarfieldProceduralTexture = (function (_super) {
        __extends(StarfieldProceduralTexture, _super);
        function StarfieldProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "starfieldProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._time = 1;
            this._alpha = 0.5;
            this._beta = 0.8;
            this._zoom = 0.8;
            this.updateShaderUniforms();
        }
        StarfieldProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("time", this._time);
            this.setFloat("alpha", this._alpha);
            this.setFloat("beta", this._beta);
            this.setFloat("zoom", this._zoom);
        };
        Object.defineProperty(StarfieldProceduralTexture.prototype, "time", {
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
        Object.defineProperty(StarfieldProceduralTexture.prototype, "alpha", {
            get: function () {
                return this._alpha;
            },
            set: function (value) {
                this._alpha = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "beta", {
            get: function () {
                return this._beta;
            },
            set: function (value) {
                this._beta = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "zoom", {
            get: function () {
                return this._zoom;
            },
            set: function (value) {
                this._zoom = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return StarfieldProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.StarfieldProceduralTexture = StarfieldProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['starfieldProceduralTexturePixelShader'] = "precision highp float;\r\n\r\n#define iterations 15\r\n#define formuparam 0.53\r\n\r\n#define volsteps 20\r\n#define stepsize 0.1\r\n\r\n#define tile 0.850\r\n\r\n#define brightness 0.0015\r\n#define darkmatter 0.400\r\n#define distfading 0.730\r\n#define saturation 0.850\r\n\r\nvarying vec2 vPosition;\r\nvarying vec2 vUV;\r\n\r\nuniform float time;\r\nuniform float alpha;\r\nuniform float beta;\r\nuniform float zoom;\r\n\r\nvoid main()\r\n{\r\n\tvec3 dir = vec3(vUV * zoom, 1.);\r\n\r\n\tfloat localTime = time * 0.0001;\r\n\r\n\t// Rotation\r\n\tmat2 rot1 = mat2(cos(alpha), sin(alpha), -sin(alpha), cos(alpha));\r\n\tmat2 rot2 = mat2(cos(beta), sin(beta), -sin(beta), cos(beta));\r\n\tdir.xz *= rot1;\r\n\tdir.xy *= rot2;\r\n\tvec3 from = vec3(1., .5, 0.5);\r\n\tfrom += vec3(localTime*2., localTime, -2.);\r\n\tfrom.xz *= rot1;\r\n\tfrom.xy *= rot2;\r\n\r\n\t//volumetric rendering\r\n\tfloat s = 0.1, fade = 1.;\r\n\tvec3 v = vec3(0.);\r\n\tfor (int r = 0; r < volsteps; r++) {\r\n\t\tvec3 p = from + s*dir*.5;\r\n\t\tp = abs(vec3(tile) - mod(p, vec3(tile*2.))); // tiling fold\r\n\t\tfloat pa, a = pa = 0.;\r\n\t\tfor (int i = 0; i < iterations; i++) {\r\n\t\t\tp = abs(p) / dot(p, p) - formuparam; // the magic formula\r\n\t\t\ta += abs(length(p) - pa); // absolute sum of average change\r\n\t\t\tpa = length(p);\r\n\t\t}\r\n\t\tfloat dm = max(0., darkmatter - a*a*.001); //dark matter\r\n\t\ta *= a*a; // add contrast\r\n\t\tif (r > 6) fade *= 1. - dm; // dark matter, don't render near\r\n\t\t\t\t\t\t\t\t  //v+=vec3(dm,dm*.5,0.);\r\n\t\tv += fade;\r\n\t\tv += vec3(s, s*s, s*s*s*s)*a*brightness*fade; // coloring based on distance\r\n\t\tfade *= distfading; // distance fading\r\n\t\ts += stepsize;\r\n\t}\r\n\tv = mix(vec3(length(v)), v, saturation); //color adjust\r\n\tgl_FragColor = vec4(v*.01, 1.);\r\n}";
