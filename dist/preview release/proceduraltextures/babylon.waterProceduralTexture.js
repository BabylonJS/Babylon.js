/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var WaterProceduralTexture = (function (_super) {
        __extends(WaterProceduralTexture, _super);
        function WaterProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            var _this = _super.call(this, name, size, "waterProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
            _this._time = 0.0;
            return _this;
        }
        WaterProceduralTexture.prototype.render = function (useCameraPostProcess) {
            this._time += this.getScene().getAnimationRatio() * 0.03;
            this.setFloat("time", this._time);
            _super.prototype.render.call(this, useCameraPostProcess);
        };
        return WaterProceduralTexture;
    }(BABYLON.ProceduralTexture));
    BABYLON.WaterProceduralTexture = WaterProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.waterProceduralTexture.js.map

BABYLON.Effect.ShadersStore['waterProceduralTexturePixelShader'] = "precision highp float;\n\nuniform float time;\n\nvarying vec2 vUV;\n\nfloat random(float x) { \nreturn fract(sin(x)*10000.);\n}\nfloat noise(vec2 p) {\nreturn random(p.x+p.y*10000.);\n}\nvec2 sw(vec2 p) { return vec2(floor(p.x),floor(p.y)); }\nvec2 se(vec2 p) { return vec2(ceil(p.x),floor(p.y)); }\nvec2 nw(vec2 p) { return vec2(floor(p.x),ceil(p.y)); }\nvec2 ne(vec2 p) { return vec2(ceil(p.x),ceil(p.y)); }\nfloat smoothNoise(vec2 p) {\nvec2 interp=smoothstep(0.,1.,fract(p));\nfloat s=mix(noise(sw(p)),noise(se(p)),interp.x);\nfloat n=mix(noise(nw(p)),noise(ne(p)),interp.x);\nreturn mix(s,n,interp.y);\n}\nfloat fractalNoise(vec2 p) {\nfloat x=0.;\nx+=smoothNoise(p );\nx+=smoothNoise(p*2. )/2.;\nx+=smoothNoise(p*4. )/4.;\nx+=smoothNoise(p*8. )/8.;\nx+=smoothNoise(p*16.)/16.;\nx/=1.+1./2.+1./4.+1./8.+1./16.;\nreturn x;\n}\nfloat movingNoise(vec2 p) {\nfloat x=fractalNoise(p+iGlobalTime);\nfloat y=fractalNoise(p-iGlobalTime);\nreturn fractalNoise(p+vec2(x,y)); \n}\n\nfloat nestedNoise(vec2 p) {\nfloat x=movingNoise(p);\nfloat y=movingNoise(p+100.);\nreturn movingNoise(p+vec2(x,y));\n}\nvoid main()\n{\nfloat n=nestedNoise(vUV*6.+time);\ngl_FragColor=vec4(vec3(length(vec2(1.0)*n)),1.0);\n}";
