/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var NormalMapProceduralTexture = /** @class */ (function (_super) {
        __extends(NormalMapProceduralTexture, _super);
        function NormalMapProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            var _this = _super.call(this, name, size, "normalMapProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
            _this.updateShaderUniforms();
            return _this;
        }
        NormalMapProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setTexture("baseSampler", this._baseTexture);
            this.setFloat("size", this.getRenderSize());
        };
        NormalMapProceduralTexture.prototype.render = function (useCameraPostProcess) {
            _super.prototype.render.call(this, useCameraPostProcess);
        };
        NormalMapProceduralTexture.prototype.resize = function (size, generateMipMaps) {
            _super.prototype.resize.call(this, size, generateMipMaps);
            // We need to update the "size" uniform
            this.updateShaderUniforms();
        };
        Object.defineProperty(NormalMapProceduralTexture.prototype, "baseTexture", {
            get: function () {
                return this._baseTexture;
            },
            set: function (texture) {
                this._baseTexture = texture;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Serializes this normal map procedural texture
         * @returns a serialized normal map procedural texture object
         */
        NormalMapProceduralTexture.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this, _super.prototype.serialize.call(this));
            serializationObject.customType = "BABYLON.NormalMapProceduralTexture";
            return serializationObject;
        };
        /**
         * Creates a Normal Map Procedural Texture from parsed normal map procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing normal map procedural texture information
         * @returns a parsed Normal Map Procedural Texture
         */
        NormalMapProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
            var texture = BABYLON.SerializationHelper.Parse(function () { return new NormalMapProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
            return texture;
        };
        __decorate([
            BABYLON.serializeAsTexture()
        ], NormalMapProceduralTexture.prototype, "baseTexture", null);
        return NormalMapProceduralTexture;
    }(BABYLON.ProceduralTexture));
    BABYLON.NormalMapProceduralTexture = NormalMapProceduralTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.normalMapProceduralTexture.js.map

BABYLON.Effect.ShadersStore['normalMapProceduralTexturePixelShader'] = "precision highp float;\n\nuniform sampler2D baseSampler;\nuniform float size;\n\nvarying vec2 vUV;\n\nconst vec3 LUMA_COEFFICIENT=vec3(0.2126,0.7152,0.0722);\nfloat lumaAtCoord(vec2 coord)\n{\nvec3 pixel=texture2D(baseSampler,coord).rgb;\nfloat luma=dot(pixel,LUMA_COEFFICIENT);\nreturn luma;\n}\nvoid main()\n{\nfloat lumaU0=lumaAtCoord(vUV+vec2(-1.0,0.0)/size);\nfloat lumaU1=lumaAtCoord(vUV+vec2( 1.0,0.0)/size);\nfloat lumaV0=lumaAtCoord(vUV+vec2( 0.0,-1.0)/size);\nfloat lumaV1=lumaAtCoord(vUV+vec2( 0.0,1.0)/size);\nvec2 slope=(vec2(lumaU0-lumaU1,lumaV0-lumaV1)+1.0)*0.5;\ngl_FragColor=vec4(slope,1.0,1.0);\n}\n";
