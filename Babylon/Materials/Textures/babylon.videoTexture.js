var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var VideoTexture = (function (_super) {
        __extends(VideoTexture, _super);
        function VideoTexture(name, urls, size, scene, generateMipMaps, invertY, samplingMode) {
            var _this = this;
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            _super.call(this, null, scene, !generateMipMaps, invertY);
            this._autoLaunch = true;
            this.name = name;
            this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            var requiredWidth = size.width || size;
            var requiredHeight = size.height || size;
            this._texture = scene.getEngine().createDynamicTexture(requiredWidth, requiredHeight, generateMipMaps, samplingMode);
            var textureSize = this.getSize();
            this.video = document.createElement("video");
            this.video.width = textureSize.width;
            this.video.height = textureSize.height;
            this.video.autoplay = false;
            this.video.loop = true;
            this.video.addEventListener("canplaythrough", function () {
                if (_this._texture) {
                    _this._texture.isReady = true;
                }
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
            if (now - this._lastUpdate < 15) {
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