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
        function VideoTexture(name, urls, size, scene, generateMipMaps, invertY) {
            var _this = this;
            _super.call(this, null, scene, !generateMipMaps, invertY);
            this._autoLaunch = true;

            this.name = name;

            this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;

            this._texture = scene.getEngine().createDynamicTexture(size, size, generateMipMaps);
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
                var source = document.createElement("source");
                source.src = url;
                _this.video.appendChild(source);
            });

            this._lastUpdate = new Date().getTime();
        }
        VideoTexture.prototype.update = function () {
            if (this._autoLaunch) {
                this._autoLaunch = false;
                this.video.play();
            }

            var now = new Date().getTime();

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
