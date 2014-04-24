module BABYLON {
    export class VideoTexture extends Texture {
        public video: HTMLVideoElement;

        private _autoLaunch = true;
        private _lastUpdate: number;

        constructor(name: string, urls, size, scene, generateMipMaps, invertY) {
            super(null, scene, !generateMipMaps, invertY);

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

            this.video.addEventListener("canplaythrough", () => {
                if (this._texture) {
                    this._texture.isReady = true;
                }
            });

            urls.forEach(url => {
                var source = document.createElement("source");
                source.src = url;
                this.video.appendChild(source);
            });

            this._lastUpdate = new Date().getTime();
        }

        public update(): boolean {
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
        }
    }
} 