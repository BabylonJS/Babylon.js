var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var VideoTexture = (function (_super) {
        __extends(VideoTexture, _super);
        function VideoTexture(name, urls, scene, generateMipMaps, invertY, samplingMode) {
            var _this = this;
            if (generateMipMaps === void 0) { generateMipMaps = false; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            _super.call(this, null, scene, !generateMipMaps, invertY);
            this._autoLaunch = true;
            this.name = name;
            this.video = document.createElement("video");
            this.video.autoplay = false;
            this.video.loop = true;
            this.video.addEventListener("canplaythrough", function () {
                if (BABYLON.Tools.IsExponentOfTwo(_this.video.videoWidth) && BABYLON.Tools.IsExponentOfTwo(_this.video.videoHeight)) {
                    _this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    _this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                }
                else {
                    _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    generateMipMaps = false;
                }
                _this._texture = scene.getEngine().createDynamicTexture(_this.video.videoWidth, _this.video.videoHeight, generateMipMaps, samplingMode, false);
                _this._texture.isReady = true;
            });
            urls.forEach(function (url) {
                //Backwards-compatibility for typescript 1. from 1.3 it should say "SOURCE". see here - https://github.com/Microsoft/TypeScript/issues/1850
                var source = document.createElement("source");
                source.src = url;
                _this.video.appendChild(source);
            });
            this._lastUpdate = BABYLON.Tools.Now;
        }
        VideoTexture.prototype.update = function () {
            if (this._autoLaunch) {
                this._autoLaunch = false;
                this.video.play();
            }
            var now = BABYLON.Tools.Now;
            if (now - this._lastUpdate < 15 || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
                return false;
            }
            this._lastUpdate = now;
            this.getScene().getEngine().updateVideoTexture(this._texture, this.video, this._invertY);
            return true;
        };
        return VideoTexture;
    })(BABYLON.Texture);
    BABYLON.VideoTexture = VideoTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.videoTexture.js.map