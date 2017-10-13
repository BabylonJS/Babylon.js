module BABYLON {
    export class VideoTexture extends Texture {
        public video: HTMLVideoElement;

        private _autoLaunch = true;
        private _lastUpdate: number;
        private _generateMipMaps: boolean
        private _setTextureReady: () => void;
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

            if (!this.getScene().getEngine().needPOTTextures ||(Tools.IsExponentOfTwo(this.video.videoWidth) && Tools.IsExponentOfTwo(this.video.videoHeight))) {
                this.wrapU = Texture.WRAP_ADDRESSMODE;
                this.wrapV = Texture.WRAP_ADDRESSMODE;
            } else {
                this.wrapU = Texture.CLAMP_ADDRESSMODE;
                this.wrapV = Texture.CLAMP_ADDRESSMODE;
                this._generateMipMaps = false;
            }

            if (urls) {
                this.video.addEventListener("canplay", () => {
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

        private __setTextureReady(): void {
            this._texture.isReady = true;
        }

        private _createTexture(): void {
            this._texture = this.getScene().getEngine().createDynamicTexture(this.video.videoWidth, this.video.videoHeight, this._generateMipMaps, this._samplingMode);

            if (this._autoLaunch) {
                this._autoLaunch = false;
                this.video.play();
            }
            this._setTextureReady = this.__setTextureReady.bind(this);
            this.video.addEventListener("playing", this._setTextureReady);
        }

        
        public _rebuild(): void {
            this.update();
        }

        public update(): boolean {
            var now = Tools.Now;

            if (now - this._lastUpdate < 15 || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
                return false;
            }

            this._lastUpdate = now;
            this.getScene().getEngine().updateVideoTexture(this._texture, this.video, this._invertY);
            return true;
        }

        public dispose(): void {
            super.dispose();
            this.video.removeEventListener("playing", this._setTextureReady);
        }

        public static CreateFromWebCam(scene: Scene, onReady: (videoTexture: VideoTexture) => void, constraints: {
                minWidth: number,
                maxWidth: number,
                minHeight: number,
                maxHeight: number,
                deviceId: string
            }): void {
            var video = document.createElement("video");
            var constraintsDeviceId;
            if (constraints && constraints.deviceId){
                constraintsDeviceId = {
                    exact: constraints.deviceId
                }
            }

		    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

		    if (navigator.getUserMedia) {
			    navigator.getUserMedia({
                    video: {
                        deviceId: constraintsDeviceId,
                        width: {
                            min: (constraints && constraints.minWidth) || 256,
                            max: (constraints && constraints.maxWidth) || 640
                        },
                        height: {
                            min: (constraints && constraints.minHeight) || 256,
                            max: (constraints && constraints.maxHeight) || 480
                        }
                    }
                }, (stream: any) => {

                    if (video.mozSrcObject !== undefined) { // hack for Firefox < 19
                        video.mozSrcObject = stream;
                    } else {
                        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                    }

                    video.play();

                    if (onReady) {
                        onReady(new BABYLON.VideoTexture("video", video, scene, true, true));
                    }
			    }, function (e: DOMException) {
                    Tools.Error(e.name);
                });
            }
        }
    }
}
