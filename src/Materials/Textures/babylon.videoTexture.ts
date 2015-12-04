module BABYLON {
    export class VideoTexture extends Texture {
        public video: HTMLVideoElement;

        private _autoLaunch = true;
        private _lastUpdate: number;

        constructor(name: string, urls: string[], scene: Scene, generateMipMaps = false, invertY = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(null, scene, !generateMipMaps, invertY);

            this.name = name;

            this.video = document.createElement("video");
            this.video.autoplay = false;
            this.video.loop = true;

            this.video.addEventListener("canplaythrough", () => {
                if (Tools.IsExponentOfTwo(this.video.videoWidth) && Tools.IsExponentOfTwo(this.video.videoHeight)) {
                    this.wrapU = Texture.WRAP_ADDRESSMODE;
                    this.wrapV = Texture.WRAP_ADDRESSMODE;
                } else {
                    this.wrapU = Texture.CLAMP_ADDRESSMODE;
                    this.wrapV = Texture.CLAMP_ADDRESSMODE;
                    generateMipMaps = false;
                }

                this._texture = scene.getEngine().createDynamicTexture(this.video.videoWidth, this.video.videoHeight, generateMipMaps, samplingMode, false);
                this._texture.isReady = true;
            });

            urls.forEach(url => {
                //Backwards-compatibility for typescript 1. from 1.3 it should say "SOURCE". see here - https://github.com/Microsoft/TypeScript/issues/1850
                var source = <HTMLSourceElement> document.createElement("source");
                source.src = url;
                this.video.appendChild(source);
            });

            this._lastUpdate = Tools.Now;
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