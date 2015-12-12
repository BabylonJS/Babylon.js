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
            this._formuparam = 0.53;
            this._stepsize = 0.1;
            this._tile = 0.850;
            this._brightness = 0.0015;
            this._darkmatter = 0.400;
            this._distfading = 0.730;
            this._saturation = 0.850;
            this.updateShaderUniforms();
        }
        StarfieldProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("time", this._time);
            this.setFloat("alpha", this._alpha);
            this.setFloat("beta", this._beta);
            this.setFloat("zoom", this._zoom);
            this.setFloat("formuparam", this._formuparam);
            this.setFloat("stepsize", this._stepsize);
            this.setFloat("tile", this._tile);
            this.setFloat("brightness", this._brightness);
            this.setFloat("darkmatter", this._darkmatter);
            this.setFloat("distfading", this._distfading);
            this.setFloat("saturation", this._saturation);
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
        Object.defineProperty(StarfieldProceduralTexture.prototype, "formuparam", {
            get: function () {
                return this._formuparam;
            },
            set: function (value) {
                this._formuparam = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "stepsize", {
            get: function () {
                return this._stepsize;
            },
            set: function (value) {
                this._stepsize = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "tile", {
            get: function () {
                return this._tile;
            },
            set: function (value) {
                this._tile = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "brightness", {
            get: function () {
                return this._brightness;
            },
            set: function (value) {
                this._brightness = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "darkmatter", {
            get: function () {
                return this._darkmatter;
            },
            set: function (value) {
                this._darkmatter = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "distfading", {
            get: function () {
                return this._distfading;
            },
            set: function (value) {
                this._distfading = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StarfieldProceduralTexture.prototype, "saturation", {
            get: function () {
                return this._saturation;
            },
            set: function (value) {
                this._saturation = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return StarfieldProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.StarfieldProceduralTexture = StarfieldProceduralTexture;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['starfieldProceduralTexturePixelShader'] = "precision highp float;\n\n//defined as const as fragment shaders does not support uniforms in loops\n#define volsteps 20\n#define iterations 15\n\nvarying vec2 vPosition;\nvarying vec2 vUV;\n\nuniform float time;\nuniform float alpha;\nuniform float beta;\nuniform float zoom;\nuniform float formuparam;\nuniform float stepsize;\nuniform float tile;\nuniform float brightness;\nuniform float darkmatter;\nuniform float distfading;\nuniform float saturation;\n\nvoid main()\n{\n\tvec3 dir = vec3(vUV * zoom, 1.);\n\n\tfloat localTime = time * 0.0001;\n\n\t// Rotation\n\tmat2 rot1 = mat2(cos(alpha), sin(alpha), -sin(alpha), cos(alpha));\n\tmat2 rot2 = mat2(cos(beta), sin(beta), -sin(beta), cos(beta));\n\tdir.xz *= rot1;\n\tdir.xy *= rot2;\n\tvec3 from = vec3(1., .5, 0.5);\n\tfrom += vec3(localTime*2., localTime, -2.);\n\tfrom.xz *= rot1;\n\tfrom.xy *= rot2;\n\n\t//volumetric rendering\n\tfloat s = 0.1, fade = 1.;\n\tvec3 v = vec3(0.);\n\tfor (int r = 0; r < volsteps; r++) {\n\t\tvec3 p = from + s*dir*.5;\n\t\tp = abs(vec3(tile) - mod(p, vec3(tile*2.))); // tiling fold\n\t\tfloat pa, a = pa = 0.;\n\t\tfor (int i = 0; i < iterations; i++) {\n\t\t\tp = abs(p) / dot(p, p) - formuparam; // the magic formula\n\t\t\ta += abs(length(p) - pa); // absolute sum of average change\n\t\t\tpa = length(p);\n\t\t}\n\t\tfloat dm = max(0., darkmatter - a*a*.001); //dark matter\n\t\ta *= a*a; // add contrast\n\t\tif (r > 6) fade *= 1. - dm; // dark matter, don't render near\n\t\t\t\t\t\t\t\t  //v+=vec3(dm,dm*.5,0.);\n\t\tv += fade;\n\t\tv += vec3(s, s*s, s*s*s*s)*a*brightness*fade; // coloring based on distance\n\t\tfade *= distfading; // distance fading\n\t\ts += stepsize;\n\t}\n\tv = mix(vec3(length(v)), v, saturation); //color adjust\n\tgl_FragColor = vec4(v*.01, 1.);\n}";
