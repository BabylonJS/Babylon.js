﻿module BABYLON {
    export class VideoTexture extends Texture {
        public video: HTMLVideoElement;

        private _autoLaunch = true;
        private _lastUpdate: number;
        private _generateMipMaps: boolean

        /**
         * Creates a video texture.
         * Sample : https://doc.babylonjs.com/tutorials/01._Advanced_Texturing
         * @param {Array} urlsOrVideo can be used to provide an array of urls or an already setup HTML video element.
         * @param {BABYLON.Scene} scene is obviously the current scene.
         * @param {boolean} generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
         * @param {boolean} invertY is false by default but can be used to invert video on Y axis
         * @param {number} samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
         */
        constructor(name: string, urlsOrVideo: string[] | HTMLVideoElement, scene: Scene, generateMipMaps = false, invertY = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(null, scene, !generateMipMaps, invertY);

            var urls: string[];
            this.name = name;

            if (urlsOrVideo instanceof HTMLVideoElement) {
                this.video = <any>urlsOrVideo;
            } else {
                urls = <any>urlsOrVideo;

                this.video = document.createElement("video");
                this.video.autoplay = false;
                this.video.loop = true;
            }

            this._generateMipMaps = generateMipMaps;
            this._samplingMode = samplingMode;

            if (Tools.IsExponentOfTwo(this.video.videoWidth) && Tools.IsExponentOfTwo(this.video.videoHeight)) {
                this.wrapU = Texture.WRAP_ADDRESSMODE;
                this.wrapV = Texture.WRAP_ADDRESSMODE;
            } else {
                this.wrapU = Texture.CLAMP_ADDRESSMODE;
                this.wrapV = Texture.CLAMP_ADDRESSMODE;
                this._generateMipMaps = false;
            }

            if (urls) {
                this.video.addEventListener("canplaythrough", () => {
                    this._createTexture();
                });
                urls.forEach(url => {
                    var source = document.createElement("source");
                    source.src = url;
                    this.video.appendChild(source);
                });
            } else {
                this._createTexture();
            }

            this._lastUpdate = Tools.Now;
        }

        private _createTexture(): void {
            this._texture = this.getScene().getEngine().createDynamicTexture(this.video.videoWidth, this.video.videoHeight, this._generateMipMaps, this._samplingMode, false);
            this._texture.isReady = true;
        }

        public update(): boolean {
            if (this._autoLaunch) {
                this._autoLaunch = false;
                this.video.play();
            }

            var now = Tools.Now;

            if (now - this._lastUpdate < 15 || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
                return false;
            }

            this._lastUpdate = now;
            this.getScene().getEngine().updateVideoTexture(this._texture, this.video, this._invertY);
            return true;
        }
    }
}