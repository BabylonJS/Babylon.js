var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var VideoTexture = (function (_super) {
        __extends(VideoTexture, _super);
        /**
         * Creates a video texture.
         * Sample : https://doc.babylonjs.com/tutorials/01._Advanced_Texturing
         * @param {Array} urlsOrVideo can be used to provide an array of urls or an already setup HTML video element.
         * @param {BABYLON.Scene} scene is obviously the current scene.
         * @param {boolean} generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
         * @param {boolean} invertY is false by default but can be used to invert video on Y axis
         * @param {number} samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
         */
        function VideoTexture(name, urlsOrVideo, scene, generateMipMaps, invertY, samplingMode) {
            var _this = this;
            if (generateMipMaps === void 0) { generateMipMaps = false; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            _super.call(this, null, scene, !generateMipMaps, invertY);
            this._autoLaunch = true;
            var urls;
            this.name = name;
            if (urlsOrVideo instanceof HTMLVideoElement) {
                this.video = urlsOrVideo;
            }
            else {
                urls = urlsOrVideo;
                this.video = document.createElement("video");
                this.video.autoplay = false;
                this.video.loop = true;
            }
            this._generateMipMaps = generateMipMaps;
            this._samplingMode = samplingMode;
            if (BABYLON.Tools.IsExponentOfTwo(this.video.videoWidth) && BABYLON.Tools.IsExponentOfTwo(this.video.videoHeight)) {
                this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            }
            else {
                this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                this._generateMipMaps = false;
            }
            if (urls) {
                this.video.addEventListener("canplaythrough", function () {
                    _this._createTexture();
                });
                urls.forEach(function (url) {
                    var source = document.createElement("source");
                    source.src = url;
                    _this.video.appendChild(source);
                });
            }
            else {
                this._createTexture();
            }
            this._lastUpdate = BABYLON.Tools.Now;
        }
        VideoTexture.prototype._createTexture = function () {
            this._texture = this.getScene().getEngine().createDynamicTexture(this.video.videoWidth, this.video.videoHeight, this._generateMipMaps, this._samplingMode);
            this._texture.isReady = true;
        };
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
