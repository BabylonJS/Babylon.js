/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var StarfieldProceduralTexture = /** @class */ (function (_super) {
        __extends(StarfieldProceduralTexture, _super);
        function StarfieldProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            var _this = _super.call(this, name, size, "starfieldProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
            _this._time = 1;
            _this._alpha = 0.5;
            _this._beta = 0.8;
            _this._zoom = 0.8;
            _this._formuparam = 0.53;
            _this._stepsize = 0.1;
            _this._tile = 0.850;
            _this._brightness = 0.0015;
            _this._darkmatter = 0.400;
            _this._distfading = 0.730;
            _this._saturation = 0.850;
            _this.updateShaderUniforms();
            return _this;
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
    }(BABYLON.ProceduralTexture));
    BABYLON.StarfieldProceduralTexture = StarfieldProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.starfieldProceduralTexture.js.map

BABYLON.Effect.ShadersStore['starfieldProceduralTexturePixelShader'] = "precision highp float;\n\n#define volsteps 20\n#define iterations 15\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform float time;\nuniform float alpha;\nuniform float beta;\nuniform float zoom;\nuniform float formuparam;\nuniform float stepsize;\nuniform float tile;\nuniform float brightness;\nuniform float darkmatter;\nuniform float distfading;\nuniform float saturation;\nvoid main()\n{\nvec3 dir=vec3(vUV*zoom,1.);\nfloat localTime=time*0.0001;\n\nmat2 rot1=mat2(cos(alpha),sin(alpha),-sin(alpha),cos(alpha));\nmat2 rot2=mat2(cos(beta),sin(beta),-sin(beta),cos(beta));\ndir.xz*=rot1;\ndir.xy*=rot2;\nvec3 from=vec3(1.,.5,0.5);\nfrom+=vec3(-2.,localTime*2.,localTime);\nfrom.xz*=rot1;\nfrom.xy*=rot2;\n\nfloat s=0.1,fade=1.;\nvec3 v=vec3(0.);\nfor (int r=0; r<volsteps; r++) {\nvec3 p=from+s*dir*.5;\np=abs(vec3(tile)-mod(p,vec3(tile*2.))); \nfloat pa,a=pa=0.;\nfor (int i=0; i<iterations; i++) {\np=abs(p)/dot(p,p)-formuparam; \na+=abs(length(p)-pa); \npa=length(p);\n}\nfloat dm=max(0.,darkmatter-a*a*.001); \na*=a*a; \nif (r>6) fade*=1.-dm; \n\nv+=fade;\nv+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; \nfade*=distfading; \ns+=stepsize;\n}\nv=mix(vec3(length(v)),v,saturation); \ngl_FragColor=vec4(v*.01,1.);\n}";
