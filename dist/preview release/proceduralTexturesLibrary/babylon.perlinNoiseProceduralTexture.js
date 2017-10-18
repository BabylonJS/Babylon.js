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
    var PerlinNoiseProceduralTexture = /** @class */ (function (_super) {
        __extends(PerlinNoiseProceduralTexture, _super);
        function PerlinNoiseProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            var _this = _super.call(this, name, size, "perlinNoiseProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
            _this.time = 0.0;
            _this.speed = 1.0;
            _this.translationSpeed = 1.0;
            _this._currentTranslation = 0;
            _this.updateShaderUniforms();
            return _this;
        }
        PerlinNoiseProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("size", this.getRenderSize());
            var deltaTime = this.getScene().getEngine().getDeltaTime();
            this.time += deltaTime;
            this.setFloat("time", this.time * this.speed / 1000);
            this._currentTranslation += deltaTime * this.translationSpeed / 1000.0;
            this.setFloat("translationSpeed", this._currentTranslation);
        };
        PerlinNoiseProceduralTexture.prototype.render = function (useCameraPostProcess) {
            this.updateShaderUniforms();
            _super.prototype.render.call(this, useCameraPostProcess);
        };
        PerlinNoiseProceduralTexture.prototype.resize = function (size, generateMipMaps) {
            _super.prototype.resize.call(this, size, generateMipMaps);
        };
        return PerlinNoiseProceduralTexture;
    }(BABYLON.ProceduralTexture));
    BABYLON.PerlinNoiseProceduralTexture = PerlinNoiseProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.perlinNoiseProceduralTexture.js.map

BABYLON.Effect.ShadersStore['perlinNoiseProceduralTexturePixelShader'] = "\nprecision highp float;\n\nuniform float size;\nuniform float time;\nuniform float translationSpeed;\n\nvarying vec2 vUV;\n\nfloat r(float n)\n{\nreturn fract(cos(n*89.42)*343.42);\n}\nvec2 r(vec2 n)\n{\nreturn vec2(r(n.x*23.62-300.0+n.y*34.35),r(n.x*45.13+256.0+n.y*38.89)); \n}\nfloat worley(vec2 n,float s)\n{\nfloat dis=1.0;\nfor(int x=-1; x<=1; x++)\n{\nfor(int y=-1; y<=1; y++)\n{\nvec2 p=floor(n/s)+vec2(x,y);\nfloat d=length(r(p)+vec2(x,y)-fract(n/s));\nif (dis>d)\ndis=d;\n}\n}\nreturn 1.0-dis;\n}\nvec3 hash33(vec3 p3)\n{\np3=fract(p3*vec3(0.1031,0.11369,0.13787));\np3+=dot(p3,p3.yxz+19.19);\nreturn -1.0+2.0*fract(vec3((p3.x+p3.y)*p3.z,(p3.x+p3.z)*p3.y,(p3.y+p3.z)*p3.x));\n}\nfloat perlinNoise(vec3 p)\n{\nvec3 pi=floor(p);\nvec3 pf=p-pi;\nvec3 w=pf*pf*(3.0-2.0*pf);\nreturn mix(\nmix(\nmix(\ndot(pf-vec3(0,0,0),hash33(pi+vec3(0,0,0))),\ndot(pf-vec3(1,0,0),hash33(pi+vec3(1,0,0))),\nw.x\n),\nmix(\ndot(pf-vec3(0,0,1),hash33(pi+vec3(0,0,1))),\ndot(pf-vec3(1,0,1),hash33(pi+vec3(1,0,1))),\nw.x\n),\nw.z\n),\nmix(\nmix(\ndot(pf-vec3(0,1,0),hash33(pi+vec3(0,1,0))),\ndot(pf-vec3(1,1,0),hash33(pi+vec3(1,1,0))),\nw.x\n),\nmix(\ndot(pf-vec3(0,1,1),hash33(pi+vec3(0,1,1))),\ndot(pf-vec3(1,1,1),hash33(pi+vec3(1,1,1))),\nw.x\n),\nw.z\n),\nw.y\n);\n}\n\nvoid main(void)\n{\nvec2 uv=gl_FragCoord.xy+translationSpeed;\nfloat dis=(\n1.0+perlinNoise(vec3(uv/vec2(size,size),time*0.05)*8.0))\n*(1.0+(worley(uv,32.0)+ 0.5*worley(2.0*uv,32.0)+0.25*worley(4.0*uv,32.0))\n);\ngl_FragColor=vec4(vec3(dis/4.0),1.0);\n}\n";
