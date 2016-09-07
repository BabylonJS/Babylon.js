var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Texture = (function (_super) {
        __extends(Texture, _super);
        function Texture(url, scene, noMipmap, invertY, samplingMode, onLoad, onError, buffer, deleteBuffer) {
            var _this = this;
            if (noMipmap === void 0) { noMipmap = false; }
            if (invertY === void 0) { invertY = true; }
            if (samplingMode === void 0) { samplingMode = Texture.TRILINEAR_SAMPLINGMODE; }
            if (onLoad === void 0) { onLoad = null; }
            if (onError === void 0) { onError = null; }
            if (buffer === void 0) { buffer = null; }
            if (deleteBuffer === void 0) { deleteBuffer = false; }
            _super.call(this, scene);
            this.uOffset = 0;
            this.vOffset = 0;
            this.uScale = 1.0;
            this.vScale = 1.0;
            this.uAng = 0;
            this.vAng = 0;
            this.wAng = 0;
            this.name = url;
            this.url = url;
            this._noMipmap = noMipmap;
            this._invertY = invertY;
            this._samplingMode = samplingMode;
            this._buffer = buffer;
            this._deleteBuffer = deleteBuffer;
            if (!url) {
                return;
            }
            this._texture = this._getFromCache(url, noMipmap, samplingMode);
            var load = function () {
                if (_this._onLoadObservarble && _this._onLoadObservarble.hasObservers()) {
                    _this.onLoadObservable.notifyObservers(true);
                }
                if (onLoad) {
                    onLoad();
                }
            };
            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this._texture = scene.getEngine().createTexture(url, noMipmap, invertY, scene, this._samplingMode, load, onError, this._buffer);
                    if (deleteBuffer) {
                        delete this._buffer;
                    }
                }
                else {
                    this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                    this._delayedOnLoad = load;
                    this._delayedOnError = onError;
                }
            }
            else {
                if (this._texture.isReady) {
                    BABYLON.Tools.SetImmediate(function () { return load(); });
                }
                else {
                    this._texture.onLoadedCallbacks.push(load);
                }
            }
        }
        Object.defineProperty(Texture.prototype, "noMipmap", {
            get: function () {
                return this._noMipmap;
            },
            enumerable: true,
            configurable: true
        });
        Texture.prototype.delayLoad = function () {
            if (this.delayLoadState !== BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap, this._samplingMode);
            if (!this._texture) {
                this._texture = this.getScene().getEngine().createTexture(this.url, this._noMipmap, this._invertY, this.getScene(), this._samplingMode, this._delayedOnLoad, this._delayedOnError, this._buffer);
                if (this._deleteBuffer) {
                    delete this._buffer;
                }
            }
        };
        Texture.prototype.updateSamplingMode = function (samplingMode) {
            if (!this._texture) {
                return;
            }
            this._samplingMode = samplingMode;
            this.getScene().getEngine().updateTextureSamplingMode(samplingMode, this._texture);
        };
        Texture.prototype._prepareRowForTextureGeneration = function (x, y, z, t) {
            x *= this.uScale;
            y *= this.vScale;
            x -= 0.5 * this.uScale;
            y -= 0.5 * this.vScale;
            z -= 0.5;
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, this._rowGenerationMatrix, t);
            t.x += 0.5 * this.uScale + this.uOffset;
            t.y += 0.5 * this.vScale + this.vOffset;
            t.z += 0.5;
        };
        Texture.prototype.getTextureMatrix = function () {
            if (this.uOffset === this._cachedUOffset &&
                this.vOffset === this._cachedVOffset &&
                this.uScale === this._cachedUScale &&
                this.vScale === this._cachedVScale &&
                this.uAng === this._cachedUAng &&
                this.vAng === this._cachedVAng &&
                this.wAng === this._cachedWAng) {
                return this._cachedTextureMatrix;
            }
            this._cachedUOffset = this.uOffset;
            this._cachedVOffset = this.vOffset;
            this._cachedUScale = this.uScale;
            this._cachedVScale = this.vScale;
            this._cachedUAng = this.uAng;
            this._cachedVAng = this.vAng;
            this._cachedWAng = this.wAng;
            if (!this._cachedTextureMatrix) {
                this._cachedTextureMatrix = BABYLON.Matrix.Zero();
                this._rowGenerationMatrix = new BABYLON.Matrix();
                this._t0 = BABYLON.Vector3.Zero();
                this._t1 = BABYLON.Vector3.Zero();
                this._t2 = BABYLON.Vector3.Zero();
            }
            BABYLON.Matrix.RotationYawPitchRollToRef(this.vAng, this.uAng, this.wAng, this._rowGenerationMatrix);
            this._prepareRowForTextureGeneration(0, 0, 0, this._t0);
            this._prepareRowForTextureGeneration(1.0, 0, 0, this._t1);
            this._prepareRowForTextureGeneration(0, 1.0, 0, this._t2);
            this._t1.subtractInPlace(this._t0);
            this._t2.subtractInPlace(this._t0);
            BABYLON.Matrix.IdentityToRef(this._cachedTextureMatrix);
            this._cachedTextureMatrix.m[0] = this._t1.x;
            this._cachedTextureMatrix.m[1] = this._t1.y;
            this._cachedTextureMatrix.m[2] = this._t1.z;
            this._cachedTextureMatrix.m[4] = this._t2.x;
            this._cachedTextureMatrix.m[5] = this._t2.y;
            this._cachedTextureMatrix.m[6] = this._t2.z;
            this._cachedTextureMatrix.m[8] = this._t0.x;
            this._cachedTextureMatrix.m[9] = this._t0.y;
            this._cachedTextureMatrix.m[10] = this._t0.z;
            return this._cachedTextureMatrix;
        };
        Texture.prototype.getReflectionTextureMatrix = function () {
            if (this.uOffset === this._cachedUOffset &&
                this.vOffset === this._cachedVOffset &&
                this.uScale === this._cachedUScale &&
                this.vScale === this._cachedVScale &&
                this.coordinatesMode === this._cachedCoordinatesMode) {
                return this._cachedTextureMatrix;
            }
            if (!this._cachedTextureMatrix) {
                this._cachedTextureMatrix = BABYLON.Matrix.Zero();
                this._projectionModeMatrix = BABYLON.Matrix.Zero();
            }
            this._cachedCoordinatesMode = this.coordinatesMode;
            switch (this.coordinatesMode) {
                case Texture.PLANAR_MODE:
                    BABYLON.Matrix.IdentityToRef(this._cachedTextureMatrix);
                    this._cachedTextureMatrix[0] = this.uScale;
                    this._cachedTextureMatrix[5] = this.vScale;
                    this._cachedTextureMatrix[12] = this.uOffset;
                    this._cachedTextureMatrix[13] = this.vOffset;
                    break;
                case Texture.PROJECTION_MODE:
                    BABYLON.Matrix.IdentityToRef(this._projectionModeMatrix);
                    this._projectionModeMatrix.m[0] = 0.5;
                    this._projectionModeMatrix.m[5] = -0.5;
                    this._projectionModeMatrix.m[10] = 0.0;
                    this._projectionModeMatrix.m[12] = 0.5;
                    this._projectionModeMatrix.m[13] = 0.5;
                    this._projectionModeMatrix.m[14] = 1.0;
                    this._projectionModeMatrix.m[15] = 1.0;
                    this.getScene().getProjectionMatrix().multiplyToRef(this._projectionModeMatrix, this._cachedTextureMatrix);
                    break;
                default:
                    BABYLON.Matrix.IdentityToRef(this._cachedTextureMatrix);
                    break;
            }
            return this._cachedTextureMatrix;
        };
        Texture.prototype.clone = function () {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () {
                return new Texture(_this._texture.url, _this.getScene(), _this._noMipmap, _this._invertY, _this._samplingMode);
            }, this);
        };
        Object.defineProperty(Texture.prototype, "onLoadObservable", {
            get: function () {
                if (!this._onLoadObservarble) {
                    this._onLoadObservarble = new BABYLON.Observable();
                }
                return this._onLoadObservarble;
            },
            enumerable: true,
            configurable: true
        });
        // Statics
        Texture.CreateFromBase64String = function (data, name, scene, noMipmap, invertY, samplingMode, onLoad, onError) {
            if (samplingMode === void 0) { samplingMode = Texture.TRILINEAR_SAMPLINGMODE; }
            if (onLoad === void 0) { onLoad = null; }
            if (onError === void 0) { onError = null; }
            return new Texture("data:" + name, scene, noMipmap, invertY, samplingMode, onLoad, onError, data);
        };
        Texture.Parse = function (parsedTexture, scene, rootUrl) {
            if (parsedTexture.isCube) {
                return BABYLON.CubeTexture.Parse(parsedTexture, scene, rootUrl);
            }
            if (!parsedTexture.name && !parsedTexture.isRenderTarget) {
                return null;
            }
            var texture = BABYLON.SerializationHelper.Parse(function () {
                if (parsedTexture.customType) {
                    var customTexture = BABYLON.Tools.Instantiate(parsedTexture.customType);
                    return customTexture.Parse(parsedTexture, scene, rootUrl);
                }
                else if (parsedTexture.mirrorPlane) {
                    var mirrorTexture = new BABYLON.MirrorTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
                    mirrorTexture._waitingRenderList = parsedTexture.renderList;
                    mirrorTexture.mirrorPlane = BABYLON.Plane.FromArray(parsedTexture.mirrorPlane);
                    return mirrorTexture;
                }
                else if (parsedTexture.isRenderTarget) {
                    var renderTargetTexture = new BABYLON.RenderTargetTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
                    renderTargetTexture._waitingRenderList = parsedTexture.renderList;
                    return renderTargetTexture;
                }
                else {
                    var texture;
                    if (parsedTexture.base64String) {
                        texture = Texture.CreateFromBase64String(parsedTexture.base64String, parsedTexture.name, scene);
                    }
                    else {
                        texture = new Texture(rootUrl + parsedTexture.name, scene);
                    }
                    return texture;
                }
            }, parsedTexture, scene);
            // Animations
            if (parsedTexture.animations) {
                for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    var parsedAnimation = parsedTexture.animations[animationIndex];
                    texture.animations.push(BABYLON.Animation.Parse(parsedAnimation));
                }
            }
            return texture;
        };
        // Constants
        Texture.NEAREST_SAMPLINGMODE = 1;
        Texture.BILINEAR_SAMPLINGMODE = 2;
        Texture.TRILINEAR_SAMPLINGMODE = 3;
        Texture.EXPLICIT_MODE = 0;
        Texture.SPHERICAL_MODE = 1;
        Texture.PLANAR_MODE = 2;
        Texture.CUBIC_MODE = 3;
        Texture.PROJECTION_MODE = 4;
        Texture.SKYBOX_MODE = 5;
        Texture.INVCUBIC_MODE = 6;
        Texture.EQUIRECTANGULAR_MODE = 7;
        Texture.FIXED_EQUIRECTANGULAR_MODE = 8;
        Texture.CLAMP_ADDRESSMODE = 0;
        Texture.WRAP_ADDRESSMODE = 1;
        Texture.MIRROR_ADDRESSMODE = 2;
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "url", void 0);
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "uOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "vOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "uScale", void 0);
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "vScale", void 0);
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "uAng", void 0);
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "vAng", void 0);
        __decorate([
            BABYLON.serialize()
        ], Texture.prototype, "wAng", void 0);
        return Texture;
    }(BABYLON.BaseTexture));
    BABYLON.Texture = Texture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.texture.js.map